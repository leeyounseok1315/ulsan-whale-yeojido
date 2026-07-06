import { redisAvailable, redisCommand } from "./cache";

// TourAPI 호출 쿼터·레이트리밋 모니터링 (내부 전용 — 공사 비노출).
// Redis 가용 시 일자별 카운터로 '워커·인스턴스 간 공유' 집계, 미설정 시 인메모리(워커별)로 폴백.
// canCall(호출 직전 동기 가드)은 지연을 피하려 인메모리 카운트를 사용(워커별 소프트 캡).

type EndpointStat = { calls: number; errors: number };

type BatchRun = { ts: string; ok: boolean; count: number };

const stats = new Map<string, EndpointStat>();
let windowStart = Date.now();
let lastBatch: BatchRun | null = null;
const batchHist: BatchRun[] = []; // 인메모리 폴백용 최근 이력
const STALE_MS = 26 * 60 * 60 * 1000; // 마지막 배치가 26시간 넘으면 stale

const DAILY_QUOTA = Number(process.env.TOUR_API_DAILY_QUOTA ?? 1000);
const DAY_MS = 24 * 60 * 60 * 1000;
const WARN_RATIO = 0.8;
const EXPIRE_S = "172800"; // 2일 후 자동 만료
const ENDPOINTS = ["areaBasedList2", "searchKeyword2", "detailCommon2"];

function rollWindow() {
  if (Date.now() - windowStart > DAY_MS) {
    stats.clear();
    windowStart = Date.now();
  }
}

function dayKey(): string {
  const d = new Date();
  const k = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `metrics:${k}`;
}

export function recordCall(endpoint: string, ok: boolean) {
  // 인메모리 (동기 가드·폴백)
  rollWindow();
  const s = stats.get(endpoint) ?? { calls: 0, errors: 0 };
  s.calls += 1;
  if (!ok) s.errors += 1;
  stats.set(endpoint, s);
  // Redis (워커 간 공유 집계) — fire-and-forget
  if (redisAvailable()) {
    const dk = dayKey();
    redisCommand(["INCR", `${dk}:calls`]).then(() => redisCommand(["EXPIRE", `${dk}:calls`, EXPIRE_S])).catch(() => {});
    redisCommand(["INCR", `${dk}:calls:${endpoint}`]).then(() => redisCommand(["EXPIRE", `${dk}:calls:${endpoint}`, EXPIRE_S])).catch(() => {});
    if (!ok) redisCommand(["INCR", `${dk}:err:${endpoint}`]).catch(() => {});
  }
}

export function recordBatch(ok: boolean, count: number) {
  const entry: BatchRun = { ts: new Date().toISOString(), ok, count };
  lastBatch = entry;
  batchHist.unshift(entry);
  if (batchHist.length > 10) batchHist.length = 10;
  if (redisAvailable()) {
    redisCommand(["SET", "metrics:lastBatch", JSON.stringify(entry), "EX", EXPIRE_S]).catch(() => {});
    redisCommand(["LPUSH", "metrics:batchHist", JSON.stringify(entry)])
      .then(() => redisCommand(["LTRIM", "metrics:batchHist", "0", "9"]))
      .catch(() => {});
  }
  if (!ok) void sendAlert(`[배치] 수집 실패 — ${entry.ts}`);
}

// 실패 알림 — ALERT_WEBHOOK_URL 설정 시 POST(슬랙 등), 없으면 로그만.
async function sendAlert(message: string) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.warn(message);
    return;
  }
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: message }) });
  } catch {
    /* 알림 실패는 무시 */
  }
}

function isHealthy(lb: BatchRun | null): boolean {
  return lb ? lb.ok && Date.now() - Date.parse(lb.ts) < STALE_MS : false;
}

function totalCallsMem(): number {
  let n = 0;
  for (const s of stats.values()) n += s.calls;
  return n;
}

// 동기 — 호출 직전 가드/에러메시지용(인메모리, 워커별 소프트 캡)
export function quotaStatus() {
  const used = totalCallsMem();
  const pct = DAILY_QUOTA > 0 ? used / DAILY_QUOTA : 0;
  return {
    used,
    quota: DAILY_QUOTA,
    pct: Math.round(pct * 1000) / 1000,
    warn: pct >= WARN_RATIO,
    exceeded: used >= DAILY_QUOTA,
  };
}

export function canCall(): boolean {
  return !quotaStatus().exceeded;
}

// 비동기 — /api/health 표시용(Redis면 워커 간 합산, 아니면 인메모리)
export async function getMetrics() {
  rollWindow();
  if (redisAvailable()) {
    try {
      const dk = dayKey();
      const total = Number((await redisCommand(["GET", `${dk}:calls`])) ?? 0);
      const byEndpoint: Record<string, EndpointStat> = {};
      for (const ep of ENDPOINTS) {
        const calls = Number((await redisCommand(["GET", `${dk}:calls:${ep}`])) ?? 0);
        const errors = Number((await redisCommand(["GET", `${dk}:err:${ep}`])) ?? 0);
        if (calls || errors) byEndpoint[ep] = { calls, errors };
      }
      const lbRaw = await redisCommand(["GET", "metrics:lastBatch"]);
      const lb: BatchRun | null = lbRaw ? JSON.parse(lbRaw as string) : null;
      const histRaw = ((await redisCommand(["LRANGE", "metrics:batchHist", "0", "9"])) as string[]) ?? [];
      const recentBatches = histRaw
        .map((s) => {
          try {
            return JSON.parse(s) as BatchRun;
          } catch {
            return null;
          }
        })
        .filter((b): b is BatchRun => Boolean(b));
      const pct = DAILY_QUOTA > 0 ? total / DAILY_QUOTA : 0;
      return {
        backend: "redis" as const,
        windowStart: dk,
        quota: { used: total, quota: DAILY_QUOTA, pct: Math.round(pct * 1000) / 1000, warn: pct >= WARN_RATIO, exceeded: total >= DAILY_QUOTA },
        byEndpoint,
        lastBatch: lb,
        recentBatches,
        batchHealthy: isHealthy(lb),
      };
    } catch {
      // Redis 장애 시 인메모리로 폴백
    }
  }
  return {
    backend: "memory" as const,
    windowStart: new Date(windowStart).toISOString(),
    quota: quotaStatus(),
    byEndpoint: Object.fromEntries(stats.entries()),
    lastBatch,
    recentBatches: batchHist,
    batchHealthy: isHealthy(lastBatch),
  };
}
