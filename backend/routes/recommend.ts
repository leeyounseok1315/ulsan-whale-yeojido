import { NextResponse, type NextRequest } from "next/server";
import { getSpots } from "@/backend/lib/data";
import { buildCourse } from "@/backend/lib/recommend";
import { isValidRefDate, resolveRefDate } from "@/backend/lib/season";
import { cached } from "@/backend/lib/cache";
import { localizeSpot, resolveLang, sourceLabel } from "@/backend/lib/i18n";
import { INTERESTS, type Companion, type Duration, type Interest } from "@/backend/lib/types";

const COMPANIONS: Companion[] = ["family", "couple", "friends", "solo"];
const DURATIONS: Duration[] = ["day", "1n2d", "2n3d"];
const COURSE_TTL_MS = 1000 * 60 * 10; // 10분 — 스팟 캐시와 함께 'spots' 태그로 퍼지

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

  // 관심사 — 유효한 값만 통과(잘못된 값은 무시). 정렬해 캐시 키 순서 의존성을 없앤다.
  const interests = [
    ...new Set(
      (sp.get("interests") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((i): i is Interest => INTERESTS.includes(i as Interest)),
    ),
  ].sort();

  const comp = (companion as Companion | null) ?? "family";
  const dur = (duration as Duration | null) ?? "day";
  const lang = resolveLang(sp.get("lang"));
  const effDate = resolveRefDate(date ?? undefined); // 없으면 오늘 — 키에 실제 날짜를 박아 자정 넘어가도 안전

  // 재현성·캐싱 (W7): 같은 입력이면 같은 코스. 'spots' 태그로 묶어 재수집·퍼지 때 함께 무효화.
  const course = await cached(
    `course:${comp}:${dur}:${interests.join("+")}:${effDate}:${lang}`,
    COURSE_TTL_MS,
    async () => {
      // 코스 안내 문구가 스팟 이름을 인용하므로, 지역화된 스팟으로 코스를 짠다.
      const spots = (await getSpots()).map((s) => localizeSpot(s, lang));
      return buildCourse(spots, comp, dur, interests, effDate, lang);
    },
    { tags: ["spots"] },
  );
  return NextResponse.json({ source: sourceLabel(lang), course });
}
