import { NextResponse, type NextRequest } from "next/server";
import { getSpots } from "@/backend/lib/data";
import { THEME_ORDER } from "@/backend/lib/theme";
import type { WhaleThemeId } from "@/backend/lib/types";

// GET /api/spots?theme=culture&q=고래 — 지도용 고래 테마 스팟 목록 (BFF).
export async function GET(req: NextRequest) {
  const theme = req.nextUrl.searchParams.get("theme") as WhaleThemeId | null;
  const q = req.nextUrl.searchParams.get("q");

  if (theme && !THEME_ORDER.includes(theme)) {
    return NextResponse.json({ error: "고래 테마가 올바르지 않아요." }, { status: 400 });
  }

  let spots = await getSpots();
  if (theme) spots = spots.filter((s) => s.theme === theme);
  if (q) spots = spots.filter((s) => s.title.includes(q) || s.summary.includes(q) || s.address.includes(q));

  return NextResponse.json({ source: "공공데이터", count: spots.length, spots });
}
