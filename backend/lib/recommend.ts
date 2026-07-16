import type {
  Companion,
  Course,
  CourseStop,
  Duration,
  Interest,
  Substitution,
  WhaleSpot,
  WhaleThemeId,
} from "./types";
import { CRUISE_SEASON, closedRangeLabel, isPeak, isSeasonOpen, SEASON_SUBSTITUTE } from "./season";

// 코스 추천 엔진 — 규칙 기반 (과설계 금지).
// 입력: 동행 유형 + 체류 기간 + 관심사 + 기준 날짜(시즌 외부 주입). 출력: 일자·시간 코스.
// 점수 모델: score = 핵심가중(core) + 동행×테마 + 관심사매칭 + 연관도(relevance).

const DAYS: Record<Duration, number> = { day: 1, "1n2d": 2, "2n3d": 3 };
const STOPS_PER_DAY = 3;
const DAY_START_MIN = 10 * 60; // 하루 시작 10:00
const DWELL_MIN = 80; // 지점당 체류(분)
const SPEED_KMH = 32; // 이동 평균 속도(도심 근사)
const fmtTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// 동행 유형별 테마 가중치 (결과 차별화).
const COMPANION_WEIGHT: Record<Companion, Record<WhaleThemeId, number>> = {
  family: { culture: 1.4, heritage: 1.2, nature: 1.0, observe: 1.1 },
  couple: { nature: 1.4, observe: 1.2, culture: 1.0, heritage: 0.9 },
  friends: { observe: 1.4, culture: 1.1, heritage: 1.1, nature: 1.0 },
  solo: { heritage: 1.4, culture: 1.1, nature: 1.1, observe: 0.9 },
};

// 관심사 매칭 규칙 + 가중치 (선택한 관심사에 부합하는 스팟을 상위로).
const INTEREST_WEIGHT = 0.8;
const PEAK_WEIGHT = 0.7; // 제철 스팟 가중(시즌 결합)
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

// 한국어 조사 — 받침 유무로 은/는·을/를 선택(스팟 이름이 들어가는 안내 문구용).
function hasFinalConsonant(word: string): boolean {
  const code = word.trim().slice(-1).charCodeAt(0);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return false; // 한글 음절이 아니면 판단 불가
  return (code - 0xac00) % 28 !== 0;
}
const topicParticle = (w: string) => (hasFinalConsonant(w) ? "은" : "는");
const objectParticle = (w: string) => (hasFinalConsonant(w) ? "을" : "를");

function baseNoteFor(spot: WhaleSpot, companion: Companion): string {
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

/** 제철이면 안내 문구 앞에 제철 라벨을 붙인다. */
function noteFor(spot: WhaleSpot, companion: Companion, refDate?: string): string {
  const base = baseNoteFor(spot, companion);
  return spot.peak && isPeak(spot.peak, refDate) ? `${spot.peak.label} — ${base}` : base;
}

function haversineKm(a: WhaleSpot, b: WhaleSpot): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 선택된 스팟을 최근접 이웃으로 순서화(지그재그 최소화). 시작은 최고 점수 스팟.
function orderByRoute(spots: WhaleSpot[]): WhaleSpot[] {
  if (spots.length <= 2) return spots;
  const remaining = spots.slice(1);
  const route = [spots[0]];
  while (remaining.length) {
    const last = route[route.length - 1];
    let bi = 0;
    let bd = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(last, s);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    route.push(remaining.splice(bi, 1)[0]);
  }
  return route;
}

function totalDistanceKm(spots: WhaleSpot[]): number {
  let d = 0;
  for (let i = 1; i < spots.length; i++) d += haversineKm(spots[i - 1], spots[i]);
  return Math.round(d * 10) / 10;
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

  // 가용성 시즌 휴지기인 스팟은 코스에서 제외 — id가 아닌 seasonal 기준(mock/live 공통).
  const closedSeasonal = spots.filter((s) => s.seasonal && !isSeasonOpen(s.seasonal, refDate));
  const pool = spots.filter((s) => !closedSeasonal.includes(s));
  seasonNotes.push(
    cruiseOpen
      ? `${CRUISE_SEASON.label} 시즌이에요 (4~10월). 바다 위 코스를 추천에 넣었어요.`
      : CRUISE_SEASON.closedNote,
  );

  const w = COMPANION_WEIGHT[companion];
  const ranked = pool
    .map((s) => ({
      s,
      score:
        (s.isCore ? 1 : 0.4) +
        (w[s.theme] ?? 1) +
        interestBonus(s, interests) +
        (isPeak(s.peak, refDate) ? PEAK_WEIGHT : 0) + // 제철 가중치(시즌 결합)
        s.relevance,
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);

  const days = DAYS[duration];
  const need = Math.min(ranked.length, days * STOPS_PER_DAY);
  const chosen = ranked.slice(0, need);
  const routed = orderByRoute(chosen); // 점수로 '선별' → 거리로 '순서화'

  // 이동시간 반영 스케줄링: 하루 10:00 시작, 지점당 체류 + 구간 이동시간으로 도착 시각 계산.
  let prev: WhaleSpot | null = null;
  let cur = DAY_START_MIN;
  const stops: CourseStop[] = routed.map((spot, i) => {
    const day = Math.floor(i / STOPS_PER_DAY) + 1;
    const order = (i % STOPS_PER_DAY) + 1;
    let legKm = 0;
    if (order === 1) {
      cur = DAY_START_MIN; // 하루 시작
    } else {
      legKm = Math.round(haversineKm(prev as WhaleSpot, spot) * 10) / 10;
      cur = Math.min(cur + DWELL_MIN + Math.round((legKm / SPEED_KMH) * 60), 20 * 60);
    }
    prev = spot;
    return {
      spot,
      day,
      order,
      arrive: fmtTime(cur),
      legKm,
      isPeak: isPeak(spot.peak, refDate),
      note: noteFor(spot, companion, refDate),
    };
  });

  // 시즌 비가용 스팟 → 코스에 실제로 들어간 대체 스팟을 명시(비운항기 대체 안내).
  const substitutions: Substitution[] = [];
  for (const ex of closedSeasonal) {
    const subId = SEASON_SUBSTITUTE[ex.id];
    const sub = subId ? routed.find((s) => s.id === subId) : undefined;
    if (!sub || !ex.seasonal) continue;
    const closed = closedRangeLabel(ex.seasonal);
    substitutions.push({
      excludedTitle: ex.title,
      replacedByTitle: sub.title,
      reason: `${ex.seasonal.label} 휴지기(${closed})`,
    });
    seasonNotes.push(
      `${ex.title}${topicParticle(ex.title)} ${closed} 휴지기예요. ` +
        `대신 ${sub.title}${objectParticle(sub.title)} 코스에 넣었어요.`,
    );
  }

  // 제철 안내 — 계절마다 추천이 도는 이유를 사용자에게 보여준다.
  const peakLabels = [...new Set(stops.filter((s) => s.isPeak).map((s) => s.spot.peak?.label ?? ""))].filter(Boolean);
  if (peakLabels.length) seasonNotes.push(`지금은 ${peakLabels.join(", ")} — 제철 스팟을 코스 앞쪽에 배치했어요.`);

  return {
    companion,
    duration,
    interests,
    refDate: refDate ?? new Date().toISOString().slice(0, 10),
    stops,
    distanceKm: totalDistanceKm(routed),
    substitutions,
    seasonNotes,
  };
}
