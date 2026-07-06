import { NextResponse } from "next/server";
import { cacheStats } from "@/backend/lib/cache";
import { getMetrics } from "@/backend/lib/metrics";
import { isMockMode } from "@/backend/lib/data";

// GET /api/health — 동작 모드·캐시·호출 메트릭 헬스체크 (내부 점검용, 공사 비노출).
export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: isMockMode() ? "mock" : "live",
    cache: cacheStats(),
    metrics: await getMetrics(),
    source: "공공데이터",
    ts: new Date().toISOString(),
  });
}
