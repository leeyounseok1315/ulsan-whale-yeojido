import { NextResponse, type NextRequest } from "next/server";
import { purgeTag } from "@/backend/lib/cache";
import { isCronAuthorized } from "@/backend/lib/auth";

// POST /api/admin/purge?tag=spots — 캐시 태그 퍼지(큐레이션 변경 즉시 반영). 토큰 가드.
// 예: 핵심 스팟/큐레이션을 바꾼 뒤 이걸 호출하면 다음 요청에서 새 데이터로 재수집.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 401 });
  }
  const tag = req.nextUrl.searchParams.get("tag") ?? "spots";
  const purged = await purgeTag(tag);
  return NextResponse.json({ ok: true, tag, purged, source: "공공데이터" });
}

export const GET = POST;
