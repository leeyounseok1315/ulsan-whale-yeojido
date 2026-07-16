import type { NextRequest } from "next/server";

// Cron/관리 엔드포인트 토큰 가드. Vercel Cron은 CRON_SECRET을 Authorization 헤더로 자동 첨부.
//
// fail-closed 원칙: CRON_SECRET이 없으면 '거부'한다.
// (과거엔 미설정 시 통과시켰는데, .env.example이 빈 값으로 커밋돼 있어 그걸 그대로 복사한 배포는
//  캐시 전체 퍼지·배치 수집이 무인증으로 열렸다. 시크릿 누락은 개방 사유가 아니라 설정 오류다.)
//
// 로컬 개발 편의가 필요하면 ALLOW_INSECURE_CRON=true를 '명시적으로' 켠다 — 프로덕션에선 무시된다.
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    const devBypass =
      process.env.NODE_ENV !== "production" && process.env.ALLOW_INSECURE_CRON === "true";
    if (!devBypass) {
      console.warn("[auth] CRON_SECRET 미설정 — 관리/배치 엔드포인트를 거부합니다(fail-closed).");
    }
    return devBypass;
  }
  const h = req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "";
  return h === `Bearer ${secret}` || h === secret;
}
