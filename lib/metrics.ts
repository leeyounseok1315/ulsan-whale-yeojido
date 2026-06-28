import { redisAvailable, redisCommand } from "./cache";

// TourAPI 호출 쿼터·레이트리밋 모니터링 (내부 전용 — 공사 비노출).
// Redis 가용 시 일자별 카운터로 '워커·인스턴스 간 공유' 집계, 미설정 시 인메모리(워커별)로 폴백.
// canCall(호출 직전 동기 가드)은 지연을 피하려 인메모리 카운트를 사용(워커별 소프트 캡).

type EndpointStat = { calls: number; errors: number };

const stats = new Map<string, EndpointStat>();
let windowStart = Date.now();
let lastBatch: { ts: string; ok: boolean; count: number } | null = null;

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
  lastBatch = { ts: new Date().toISOString(), ok, count };
  if (redisAvailable()) {
    redisCommand(["SET", "metrics:lastBatch", JSON.stringify(lastBatch), "EX", EXPIRE_S]).catch(() => {});
  }
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
      const lb = await redisCommand(["GET", "metrics:lastBatch"]);
      const pct = DAILY_QUOTA > 0 ? total / DAILY_QUOTA : 0;
      return {
        backend: "redis" as const,
        windowStart: dk,
        quota: { used: total, quota: DAILY_QUOTA, pct: Math.round(pct * 1000) / 1000, warn: pct >= WARN_RATIO, exceeded: total >= DAILY_QUOTA },
        byEndpoint,
        lastBatch: lb ? JSON.parse(lb as string) : null,
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
  };
}
