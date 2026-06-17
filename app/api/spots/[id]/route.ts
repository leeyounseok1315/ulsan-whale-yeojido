import { NextResponse } from "next/server";
import { getSpot } from "@/lib/data";

// GET /api/spots/:id — 스팟 상세 (detail* 통합 자리). Next 15: params는 Promise.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = await getSpot(id);
  if (!spot) {
    return NextResponse.json({ error: "스팟을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ source: "공공데이터", spot });
}
