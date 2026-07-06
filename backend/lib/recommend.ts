import type { Companion, Course, CourseStop, Duration, Interest, WhaleSpot, WhaleThemeId } from "./types";
import { CRUISE_SEASON, isSeasonOpen } from "./season";

// 코스 추천 엔진 — 규칙 기반 (과설계 금지).
// 입력: 동행 유형 + 체류 기간 + 관심사 + 기준 날짜(시즌 외부 주입). 출력: 일자·시간 코스.
// 점수 모델: score = 핵심가중(core) + 동행×테마 + 관심사매칭 + 연관도(relevance).

const DAYS: Record<Duration, number> = { day: 1, "1n2d": 2, "2n3d": 3 };
const STOPS_PER_DAY = 3;
const VISIT_HOURS = [10, 13, 16]; // 하루 방문 시각

// 동행 유형별 테마 가중치 (결과 차별화).
const COMPANION_WEIGHT: Record<Companion, Record<WhaleThemeId, number>> = {
  family: { culture: 1.4, heritage: 1.2, nature: 1.0, observe: 1.1 },
  couple: { nature: 1.4, observe: 1.2, culture: 1.0, heritage: 0.9 },
  friends: { observe: 1.4, culture: 1.1, heritage: 1.1, nature: 1.0 },
  solo: { heritage: 1.4, culture: 1.1, nature: 1.1, observe: 0.9 },
};

// 관심사 매칭 규칙 + 가중치 (선택한 관심사에 부합하는 스팟을 상위로).
const INTEREST_WEIGHT = 0.8;
const INTEREST_MATCH: Record<Interest, (s: WhaleSpot) => boolean> = {
  history: (s) => s.theme === "heritage" || s.contentTypeId === "14",
  nature: (s) => s.theme === "nature",
  experience: (s) => /체험|마을|모노레일|둘레길|옛길/.test(s.title),
  observation: (s) => s.theme === "observe",
  food: (s) => s.contentTypeId === "39",
};

function interestBonus(spot: WhaleSpot, interests: Interest[]): number {
  let b = 0;
  for (const i of interests) if (INTEREST_MATCH[i]?.(spot)) b += INTEREST_WEIGHT;
  return b;
}

function noteFor(spot: WhaleSpot, companion: Companion): string {
  if (spot.seasonal) return "바다 위에서 고래의 시선으로 — 운항 시간을 미리 확인하세요.";
  switch (spot.theme) {
    case "culture":
      return companion === "family" ? "아이와 함께 고래 이야기를 천천히." : "포경의 역사를 따라 걷기.";
    case "heritage":
      return "선사시대 고래잡이의 기록을 마주하는 시간.";
    case "nature":
      return companion === "couple" ? "해질 무렵 산책하기 좋아요." : "도시를 품은 자연에서 쉼표.";
    default:
      return "고래 도시의 한 장면.";
  }
}

export function buildCourse(
  spots: WhaleSpot[],
  companion: Companion,
  duration: Duration,
  interests: Interest[] = [],
  refDate?: string,
): Course {
  const cruiseOpen = isSeasonOpen(CRUISE_SEASON, refDate);
  const seasonNotes: string[] = [];

  // 현재 비운항 시즌인 시즌성 스팟은 코스에서 제외 — id가 아닌 seasonal 기준(mock/live 공통).
  const pool = spots.filter((s) => !(s.seasonal && !isSeasonOpen(s.seasonal, refDate)));
  seasonNotes.push(
    cruiseOpen
      ? `${CRUISE_SEASON.label} 시즌이에요 (4~10월). 바다 위 코스를 추천에 넣었어요.`
      : CRUISE_SEASON.closedNote,
  );

  const w = COMPANION_WEIGHT[companion];
  const ranked = pool
    .map((s) => ({ s, score: (s.isCore ? 1 : 0.4) + (w[s.theme] ?? 1) + interestBonus(s, interests) + s.relevance }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);

  const days = DAYS[duration];
  const need = Math.min(ranked.length, days * STOPS_PER_DAY);
  const chosen = ranked.slice(0, need);

  const stops: CourseStop[] = chosen.map((spot, i) => {
    const day = Math.floor(i / STOPS_PER_DAY) + 1;
    const order = (i % STOPS_PER_DAY) + 1;
    return {
      spot,
      day,
      order,
      arrive: `${String(VISIT_HOURS[order - 1]).padStart(2, "0")}:00`,
      note: noteFor(spot, companion),
    };
  });

  return {
    companion,
    duration,
    interests,
    refDate: refDate ?? new Date().toISOString().slice(0, 10),
    stops,
    seasonNotes,
  };
}
