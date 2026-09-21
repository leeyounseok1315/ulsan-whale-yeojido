import { NextResponse, type NextRequest } from "next/server";
import { fetchBusTransit } from "@/backend/lib/transit";

// GET /api/transit?sx=129.38&sy=35.50&ex=129.31&ey=35.56
// 두 지점 사이 버스 경로 — 외부 대중교통 OpenAPI를 서버가 대신 호출한다(키 비노출).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // Number(null)·Number("")이 0이 되므로 값의 존재를 먼저 확인한다.
  const read = (key: string): number | null => {
    const raw = sp.get(key);
    if (!raw?.trim()) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const sx = read("sx");
  const sy = read("sy");
  const ex = read("ex");
  const ey = read("ey");

  if (sx === null || sy === null || ex === null || ey === null) {
    return NextResponse.json({ error: "sx·sy·ex·ey 좌표가 모두 필요해요." }, { status: 400 });
  }
  if (Math.abs(sy) > 90 || Math.abs(ey) > 90 || Math.abs(sx) > 180 || Math.abs(ex) > 180) {
    return NextResponse.json({ error: "좌표 범위를 벗어났어요." }, { status: 400 });
  }

  const result = await fetchBusTransit({ lon: sx, lat: sy }, { lon: ex, lat: ey });

  return NextResponse.json(result, {
    headers: { "cache-control": "public, max-age=3600, s-maxage=3600" },
  });
}
