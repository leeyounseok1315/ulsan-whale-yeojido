import { NextResponse, type NextRequest } from "next/server";
import { getSpots } from "@/backend/lib/data";
import { buildCourse } from "@/backend/lib/recommend";
import { isValidRefDate } from "@/backend/lib/season";
import { INTERESTS, type Companion, type Duration, type Interest } from "@/backend/lib/types";

const COMPANIONS: Companion[] = ["family", "couple", "friends", "solo"];
const DURATIONS: Duration[] = ["day", "1n2d", "2n3d"];

// GET /api/recommend?companion=family&duration=1n2d&interests=history,food&date=2026-01-15
// date(기준 날짜)는 시즌 외부 주입 — 비운항기 검증(시간 모킹)에 사용. interests는 콤마 구분.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const companion = sp.get("companion");
  const duration = sp.get("duration");
  const date = sp.get("date");

  // 파라미터가 '있는데 값이 유효하지 않으면' 400 — 빈 문자열도 포함한다.
  // (과거엔 빈 문자열이 falsy라 검증을 통과한 뒤 ?? 기본값도 비켜가:
  //  companion= → 가중치 테이블 미스로 500, duration= → 빈 코스 200, date= → refDate "" 응답)
  if (companion !== null && !COMPANIONS.includes(companion as Companion)) {
    return NextResponse.json({ error: "동행 유형이 올바르지 않아요." }, { status: 400 });
  }
  if (duration !== null && !DURATIONS.includes(duration as Duration)) {
    return NextResponse.json({ error: "체류 기간이 올바르지 않아요." }, { status: 400 });
  }
  if (date !== null && !isValidRefDate(date)) {
    return NextResponse.json(
      { error: "기준 날짜는 YYYY-MM-DD 형식의 실제 날짜여야 해요." },
      { status: 400 },
    );
  }

  // 관심사 — 유효한 값만 통과(잘못된 값은 무시).
  const interests = (sp.get("interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((i): i is Interest => INTERESTS.includes(i as Interest));

  const spots = await getSpots();
  const course = buildCourse(
    spots,
    (companion as Companion | null) ?? "family",
    (duration as Duration | null) ?? "day",
    interests,
    date ?? undefined,
  );
  return NextResponse.json({ source: "공공데이터", course });
}
