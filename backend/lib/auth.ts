import type { NextRequest } from "next/server";

// Cron/관리 엔드포인트 토큰 가드. Vercel Cron은 CRON_SECRET을 Authorization 헤더로 자동 첨부.
// CRON_SECRET 미설정 시 개발 편의상 허용 — 배포 시 반드시 설정.
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const h = req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "";
  return h === `Bearer ${secret}` || h === secret;
}
