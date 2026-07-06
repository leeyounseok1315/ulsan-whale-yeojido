import { NextResponse, type NextRequest } from "next/server";
import { isMockMode, refreshSpots } from "@/backend/lib/data";

// 전수 수집 + 캐시 갱신 트리거. Vercel Cron(야간 배치)·수집 스크립트의 진입점.
// 토큰(CRON_SECRET) 가드 — 공개 노출 방지. Cron은 GET으로 호출하므로 GET=POST.
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 미설정 시 개발 편의상 허용 (배포 시 반드시 설정)
  const h = req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "";
  return h === `Bearer ${secret}` || h === secret;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 401 });
  }
  try {
    const result = await refreshSpots();
    return NextResponse.json({ source: "공공데이터", mode: isMockMode() ? "mock" : "live", ...result });
  } catch {
    // 실패해도 기존 캐시/스냅샷은 유지됨 — 배치 실패 감지용 신호만 반환
    return NextResponse.json({ source: "공공데이터", ok: false, error: "수집에 실패했어요." }, { status: 500 });
  }
}

export const GET = POST;
