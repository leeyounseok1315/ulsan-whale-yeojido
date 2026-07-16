import { NextResponse } from "next/server";
import { cacheStats } from "@/backend/lib/cache";
import { getMetrics } from "@/backend/lib/metrics";
import { getSpots, isMockMode } from "@/backend/lib/data";

// GET /api/health — 동작 모드·캐시·호출 메트릭 헬스체크 (내부 점검용, 공사 비노출).
//
// ok는 리터럴 상수가 아니라 '실제 상태의 파생값'이다.
// (과거엔 ok:true를 박아둬, 원격 호출이 전부 실패하고 스팟이 0건인 상태에서도 정상이라고 보고했다)
export const dynamic = "force-dynamic";

const PROBE_MS = 3000; // 헬스체크가 콜드 수집을 기다리며 매달리지 않도록

async function probeSpots(): Promise<{ state: "ok" | "empty" | "error" | "slow"; count: number | null }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const slow = new Promise<"slow">((resolve) => {
      timer = setTimeout(() => resolve("slow"), PROBE_MS);
    });
    const spots = getSpots();
    spots.catch(() => {}); // race에서 지더라도 rejection이 미처리로 남지 않게
    const r = await Promise.race([spots, slow]);
    if (r === "slow") return { state: "slow", count: null }; // 아직 예열 중 — 실패로 단정하지 않는다
    return { state: r.length > 0 ? "ok" : "empty", count: r.length };
  } catch {
    return { state: "error", count: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [metrics, spots] = await Promise.all([getMetrics(), probeSpots()]);

  const calls = Object.values(metrics.byEndpoint).reduce((a, s) => a + s.calls, 0);
  const errors = Object.values(metrics.byEndpoint).reduce((a, s) => a + s.errors, 0);
  const remote = calls > 0 && errors === calls ? "failing" : errors / Math.max(calls, 1) >= 0.5 ? "degraded" : "ok";
  const quota = metrics.quota.exceeded ? "exceeded" : metrics.quota.warn ? "warn" : "ok";

  const checks = { spots: spots.state, remote, quota };
  const ok = spots.state === "ok" && remote !== "failing" && quota !== "exceeded";

  return NextResponse.json(
    {
      ok,
      checks,
      spotCount: spots.count,
      mode: isMockMode() ? "mock" : "live",
      cache: cacheStats(),
      metrics,
      source: "공공데이터",
      ts: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
