import { NextResponse, type NextRequest } from "next/server";
import { getNearby, isNearbyType } from "@/backend/lib/nearby";
import { getSpot } from "@/backend/lib/data";
import { localizeNearby, resolveLang, sourceLabel } from "@/backend/lib/i18n";

// GET /api/nearby?spotId=128202&type=food&radius=2000&limit=6&lang=en
//   또는 좌표 직접: ?lon=129.29&lat=35.55&type=lodging
// 스팟 주변 먹거리·숙박 큐레이션 (W8) — locationBasedList2, 거리순.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") ?? "food";
  const lang = resolveLang(sp.get("lang"));

  if (!isNearbyType(type)) {
    return NextResponse.json({ error: "type은 food·lodging·tour 중 하나여야 해요." }, { status: 400 });
  }

  // 좌표 확정: spotId가 있으면 스팟 좌표를, 없으면 lon/lat 직접.
  let lon: number;
  let lat: number;
  const spotId = sp.get("spotId");
  if (spotId) {
    const spot = await getSpot(spotId);
    if (!spot) return NextResponse.json({ error: "스팟을 찾을 수 없어요." }, { status: 404 });
    lon = spot.lon;
    lat = spot.lat;
  } else {
    lon = Number(sp.get("lon"));
    lat = Number(sp.get("lat"));
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || (!lon && !lat)) {
      return NextResponse.json({ error: "spotId 또는 lon·lat 좌표가 필요해요." }, { status: 400 });
    }
  }

  const radius = Number(sp.get("radius")) || undefined;
  const limit = Number(sp.get("limit")) || undefined;
  const nearby = (await getNearby(lon, lat, { type, radius, limit })).map((n) => localizeNearby(n, lang));

  return NextResponse.json({ source: sourceLabel(lang), type, count: nearby.length, nearby });
}
