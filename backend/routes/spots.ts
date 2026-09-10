import { NextResponse, type NextRequest } from "next/server";
import { getSpots, getTourismSpots } from "@/backend/lib/data";
import { THEME_ORDER } from "@/backend/lib/theme";
import { localizeSpot, resolveLang, sourceLabel } from "@/backend/lib/i18n";
import type { WhaleThemeId } from "@/backend/lib/types";

// GET /api/spots?theme=culture&q=고래&lang=en — 지도용 고래 테마 스팟 목록 (BFF).
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") ?? "whale";

  if (scope !== "whale" && scope !== "all") {
  return NextResponse.json(
    { error: "scope는 whale 또는 all이어야 합니다." },
    { status: 400 },
  );
}
  const theme = req.nextUrl.searchParams.get("theme") as WhaleThemeId | null;
  const q = req.nextUrl.searchParams.get("q");
  const lang = resolveLang(req.nextUrl.searchParams.get("lang"));

  if (theme && !THEME_ORDER.includes(theme)) {
    return NextResponse.json({ error: "고래 테마가 올바르지 않아요." }, { status: 400 });
  }

  // 지역화는 요청 시점에 (getSpots 캐시는 국문 정본 1벌 유지). 검색은 지역화된 텍스트로.
  const sourceSpots =
    scope === "all" ? await getTourismSpots() : await getSpots();

let spots = sourceSpots.map((s) => localizeSpot(s, lang));

  if (theme) spots = spots.filter((s) => s.theme === theme);
  if (q) spots = spots.filter((s) => s.title.includes(q) || s.summary.includes(q) || s.address.includes(q));

  return NextResponse.json({ source: sourceLabel(lang), count: spots.length, spots });
}
