// TourAPI 호출 쿼터·레이트리밋 모니터링 (내부 전용 — 공사 비노출). 인메모리 v0, 일 단위 윈도우.
// 일일 호출 한도 추적·초과 임박 경고·호출량 가시화. (PLAN.md 리스크: 일일 한도 소진)

type EndpointStat = { calls: number; errors: number };

const stats = new Map<string, EndpointStat>();
let windowStart = Date.now();
let lastBatch: { ts: string; ok: boolean; count: number } | null = null;

const DAILY_QUOTA = Number(process.env.TOUR_API_DAILY_QUOTA ?? 1000);
const DAY_MS = 24 * 60 * 60 * 1000;
const WARN_RATIO = 0.8;

function rollWindow() {
  if (Date.now() - windowStart > DAY_MS) {
    stats.clear();
    windowStart = Date.now();
  }
}

export function recordCall(endpoint: string, ok: boolean) {
  rollWindow();
  const s = stats.get(endpoint) ?? { calls: 0, errors: 0 };
  s.calls += 1;
  if (!ok) s.errors += 1;
  stats.set(endpoint, s);
}

export function recordBatch(ok: boolean, count: number) {
  lastBatch = { ts: new Date().toISOString(), ok, count };
}

function totalCalls(): number {
  let n = 0;
  for (const s of stats.values()) n += s.calls;
  return n;
}

export function quotaStatus() {
  const used = totalCalls();
  const pct = DAILY_QUOTA > 0 ? used / DAILY_QUOTA : 0;
  return {
    used,
    quota: DAILY_QUOTA,
    pct: Math.round(pct * 1000) / 1000,
    warn: pct >= WARN_RATIO,
    exceeded: used >= DAILY_QUOTA,
  };
}

/** 한도 초과 시 추가 호출 차단 — tourapi 클라이언트가 호출 전에 확인. */
export function canCall(): boolean {
  return !quotaStatus().exceeded;
}

export function getMetrics() {
  rollWindow();
  return {
    windowStart: new Date(windowStart).toISOString(),
    quota: quotaStatus(),
    byEndpoint: Object.fromEntries(stats.entries()),
    lastBatch,
  };
}
