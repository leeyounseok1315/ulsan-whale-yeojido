import { NextResponse } from "next/server";
import { cacheStats } from "@/lib/cache";
import { isMockMode } from "@/lib/data";

// GET /api/health — 캐시·동작 모드 헬스체크 (내부 점검용, 공사 비노출).
export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: isMockMode() ? "mock" : "live",
    cache: cacheStats(),
    source: "공공데이터",
    ts: new Date().toISOString(),
  });
}
