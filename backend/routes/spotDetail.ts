import { NextResponse } from "next/server";
import { getSpotDetail } from "@/backend/lib/detail";

// GET /api/spots/:id — detail* 통합 상세(운영시간·휴무·요금·갤러리). Next 15: params는 Promise.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = await getSpotDetail(id);
  if (!spot) {
    return NextResponse.json({ error: "스팟을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ source: "공공데이터", spot });
}
