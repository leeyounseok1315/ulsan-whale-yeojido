import { NextResponse, type NextRequest } from "next/server";
import { getSpots } from "@/backend/lib/data";
import { buildCourse } from "@/backend/lib/recommend";
import { INTERESTS, type Companion, type Duration, type Interest } from "@/backend/lib/types";

const COMPANIONS: Companion[] = ["family", "couple", "friends", "solo"];
const DURATIONS: Duration[] = ["day", "1n2d", "2n3d"];

// GET /api/recommend?companion=family&duration=1n2d&interests=history,food&date=2026-01-15
// date(기준 날짜)는 시즌 외부 주입 — 비운항기 검증(시간 모킹)에 사용. interests는 콤마 구분.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const companion = sp.get("companion");
  const duration = sp.get("duration");
  const date = sp.get("date") ?? undefined;

  if (companion && !COMPANIONS.includes(companion as Companion)) {
    return NextResponse.json({ error: "동행 유형이 올바르지 않아요." }, { status: 400 });
  }
  if (duration && !DURATIONS.includes(duration as Duration)) {
    return NextResponse.json({ error: "체류 기간이 올바르지 않아요." }, { status: 400 });
  }

  // 관심사 — 유효한 값만 통과(잘못된 값은 무시).
  const interests = (sp.get("interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((i): i is Interest => INTERESTS.includes(i as Interest));

  const spots = await getSpots();
  const course = buildCourse(
    spots,
    (companion as Companion) ?? "family",
    (duration as Duration) ?? "day",
    interests,
    date,
  );
  return NextResponse.json({ source: "공공데이터", course });
}
