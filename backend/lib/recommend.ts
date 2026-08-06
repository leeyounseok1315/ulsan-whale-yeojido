import type {
  Companion,
  Course,
  CourseStop,
  Duration,
  EventPeriod,
  Interest,
  Substitution,
  WhaleSpot,
  WhaleThemeId,
} from "./types";
import {
  CRUISE_SEASON,
  isEventRunning,
  isPeak,
  isSeasonOpen,
  openRangeLabel,
  resolveRefDate,
  SEASON_SUBSTITUTE,
  unavailableReason,
} from "./season";
import { closedByArrival, isClosedOn, openHoursLabel, weekdayKr } from "./operating";
import { type Lang, monthRangeLabel, weekdayName } from "./i18n";

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
// 그날 실제로 열리는 축제 가중 — 며칠뿐인 일회성이라 상시 스팟보다 우선한다.
// (핵심 스팟 가중 +1을 넘겨, 당일 코스처럼 자리가 적을 때도 축제가 들어오도록)
const EVENT_TODAY_WEIGHT = 1.4;
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

// 제철 라벨(국문) → 영문. 큐레이션 매핑, 없으면 국문 그대로.
const PEAK_LABEL_EN: Record<string, string> = {
  "고래 관찰 성수기": "Peak whale-watching season",
  "갈수기 관찰 적기": "Best viewing (low-water season)",
  "억새 절정": "Silver-grass at its peak",
  "정원·야경 좋은 때": "Great for gardens & night views",
  "축제 기간": "Festival season",
};
const peakLabelL = (label: string, lang: Lang) => (lang === "en" ? PEAK_LABEL_EN[label] ?? label : label);

function baseNoteFor(spot: WhaleSpot, companion: Companion, lang: Lang): string {
  if (lang === "en") {
    if (spot.seasonal) return "See through the whale's eyes at sea — check the sailing times in advance.";
    switch (spot.theme) {
      case "culture":
        return companion === "family" ? "Whale stories to enjoy slowly with the kids." : "Walk through the history of whaling.";
      case "heritage":
        return "Come face to face with a prehistoric record of whale hunting.";
      case "nature":
        return companion === "couple" ? "Lovely for a walk around sunset." : "A pause in nature within the city.";
      default:
        return "A scene from the whale city.";
    }
  }
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
function noteFor(spot: WhaleSpot, companion: Companion, refDate: string, lang: Lang): string {
  const base = baseNoteFor(spot, companion, lang);
  return spot.peak && isPeak(spot.peak, refDate) ? `${peakLabelL(spot.peak.label, lang)} — ${base}` : base;
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
  lang: Lang = "ko",
): Course {
  const en = lang === "en";
  const onDate = resolveRefDate(refDate); // 없거나 형식이 틀리면 오늘 — 엔진 내부는 항상 유효 날짜
  const seasonNotes: string[] = [];

  // 코스에서 빠지는 스팟 세 종류:
  //  ① 가용성 휴지기(고래바다여행선 비운항 등) — id가 아닌 seasonal 기준(mock/live 공통)
  //  ② 기준일에 열리지 않는 축제 — 개최기간을 모르면 넣지 않는다(모르는 걸 '열린다'고 하지 않는다)
  //  ③ 기준일이 정기 휴무인 스팟 (W7) — 월요일 휴관 등. 닫은 곳으로 안내하지 않는다.
  const closedSeasonal = spots.filter((s) => s.seasonal && !isSeasonOpen(s.seasonal, onDate));
  const closedEvent = spots.filter((s) => s.contentTypeId === "15" && !isEventRunning(s.eventPeriod, onDate));
  const closedByRest = spots.filter(
    (s) => !closedSeasonal.includes(s) && !closedEvent.includes(s) && isClosedOn(s.opening, onDate),
  );
  const dropped = new Set([...closedSeasonal, ...closedEvent, ...closedByRest]);
  const pool = spots.filter((s) => !dropped.has(s));

  const rank = (list: WhaleSpot[]) => {
    const w = COMPANION_WEIGHT[companion];
    return list
      .map((s) => ({
        s,
        score:
          (s.isCore ? 1 : 0.4) +
          (w[s.theme] ?? 1) +
          interestBonus(s, interests) +
          (isPeak(s.peak, onDate) ? PEAK_WEIGHT : 0) + // 제철 가중치(시즌 결합) — '선별'에 반영
          (s.contentTypeId === "15" && isEventRunning(s.eventPeriod, onDate) ? EVENT_TODAY_WEIGHT : 0) +
          s.relevance,
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);
  };
  const ranked = rank(pool);

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
      isPeak: isPeak(spot.peak, onDate),
      openHours: openHoursLabel(spot.opening, lang),
      note: noteFor(spot, companion, onDate, lang),
    };
  });

  // ── 안내 문구는 전부 '실제 코스 상태'에서 파생한다. 단언하지 말고 확인하고 말한다. ──
  // (과거엔 운항기면 코스에 크루즈가 없어도 "바다 위 코스를 넣었어요", 제철 스팟이 맨 뒤여도
  //  "앞쪽에 배치했어요", 원래도 들어갈 스팟을 "대신 넣었어요"라고 거짓 안내했다)

  // 시즌 비가용 → '진짜 대체'만 주장한다. 반사실 비교: 그 스팟이 열려 있었다면 짜였을 코스와 견줘,
  // 그것이 빠진 덕에 새로 들어온 스팟만 대체로 인정한다.
  const substitutions: Substitution[] = [];
  const inCourse = new Set(routed.map((s) => s.id));
  for (const ex of closedSeasonal) {
    if (!ex.seasonal) continue;
    const reason = unavailableReason(ex.seasonal, onDate, lang); // 휴지기인지, 주말만 운항인지 사유를 그대로
    const head = en
      ? `${ex.title} isn't available on this date (${reason}).`
      : `${ex.title}${topicParticle(ex.title)} 이 날짜엔 이용할 수 없어요 (${reason}).`;

    const wouldHave = rank([...pool, ex]).slice(0, Math.min(pool.length + 1, days * STOPS_PER_DAY));
    const wouldHaveIds = new Set(wouldHave.map((s) => s.id));
    // 열려 있었어도 애초에 코스에 못 들었다면, 그 스팟 때문에 바뀐 건 없다 → 대체를 주장하지 않는다.
    const newcomers = wouldHaveIds.has(ex.id)
      ? ranked.filter((s) => inCourse.has(s.id) && !wouldHaveIds.has(s.id))
      : [];
    // 큐레이션 대체(SEASON_SUBSTITUTE)를 우선하되, 그것도 '새로 들어온' 경우에만 인정한다.
    const sub = newcomers.find((s) => s.id === SEASON_SUBSTITUTE[ex.id]) ?? newcomers[0];

    if (sub) {
      substitutions.push({ excludedTitle: ex.title, replacedByTitle: sub.title, reason });
      seasonNotes.push(
        en ? `${head} Added ${sub.title} instead.` : `${head} 대신 ${sub.title}${objectParticle(sub.title)} 코스에 넣었어요.`,
      );
    } else {
      seasonNotes.push(head); // 대신 들어온 게 없으면 대체했다고 말하지 않는다
    }
  }

  // 크루즈 운항 안내 — 실제로 코스에 들어갔을 때만 '넣었다'고 한다.
  if (isSeasonOpen(CRUISE_SEASON, onDate)) {
    const cruise = routed.find((s) => s.seasonal === CRUISE_SEASON);
    if (en) {
      const season = `The whale-watching cruise runs this season (${monthRangeLabel(CRUISE_SEASON.openMonths, "en")}).`;
      seasonNotes.push(cruise ? `${season} We added the sea route to your course.` : `${season} Fit it in if you have time.`);
    } else {
      const season = `${CRUISE_SEASON.label} 시즌이에요 (${openRangeLabel(CRUISE_SEASON)}).`;
      seasonNotes.push(cruise ? `${season} 바다 위 코스를 추천에 넣었어요.` : `${season} 시간이 되면 함께 둘러보세요.`);
    }
  } else if (!closedSeasonal.some((s) => s.seasonal === CRUISE_SEASON)) {
    // 휴지기인데 크루즈가 스팟 목록에 아예 없던 경우에만 일반 안내(있었다면 위에서 개별 안내됨).
    seasonNotes.push(
      en
        ? `The whale-watching cruise runs only ${monthRangeLabel(CRUISE_SEASON.openMonths, "en")}; off-season, we guide you to Jangsaengpo spots open year-round.`
        : CRUISE_SEASON.closedNote,
    );
  }

  // 기준일에 열리지 않는 축제는 코스에 넣지 않았다는 사실을 알린다(개최기간을 알 때만).
  for (const ev of closedEvent) {
    if (!ev.eventPeriod) continue;
    seasonNotes.push(
      en
        ? `${ev.title} isn't running on this date, so we left it out (last held ${fmtEventPeriod(ev.eventPeriod)}).`
        : `${ev.title}${topicParticle(ev.title)} 이 날짜에 열리지 않아 코스에서 뺐어요 (최근 개최 ${fmtEventPeriod(ev.eventPeriod)}).`,
    );
  }

  // 정기 휴무로 뺀 곳 안내 (W7) — 한 줄로 묶는다. 대부분 같은 요일(기준일) 휴무라 한 문장이면 충분.
  if (closedByRest.length) {
    const names = closedByRest.map((s) => s.title);
    if (en) {
      const head = names.slice(0, 2).join(", ") + (names.length > 2 ? ` and ${names.length - 2} more` : "");
      seasonNotes.push(`We left out places closed on ${weekdayName(dayIndex(onDate), "en")} (${head}).`);
    } else {
      const head = names.slice(0, 2).join(", ") + (names.length > 2 ? ` 외 ${names.length - 2}곳` : "");
      seasonNotes.push(`${weekdayKr(onDate)}요일에 문 닫는 곳은 빼고 코스를 짰어요 (${head}).`);
    }
  }

  // 운영시간 안내 (W7) — 도착 예정 시각에 이미 마감하는 스팟이 있으면 알린다(마감시각을 아는 경우만).
  for (const st of stops) {
    if (closedByArrival(st.spot.opening, st.arrive)) {
      seasonNotes.push(
        en
          ? `${st.spot.title} is already closed by your arrival at ${st.arrive} (open ${st.openHours}). Consider visiting it earlier.`
          : `${st.spot.title}${topicParticle(st.spot.title)} 도착 예정 ${st.arrive}엔 이미 문을 닫아요 (운영 ${st.openHours}). 순서를 앞당기는 걸 권해요.`,
      );
    }
  }

  // 제철 안내 — '선별에 우선 반영'이 사실. 순서는 거리 기반이라 앞쪽 배치를 약속하지 않는다.
  const peakLabels = [
    ...new Set(stops.filter((s) => s.isPeak).map((s) => (s.spot.peak ? peakLabelL(s.spot.peak.label, lang) : ""))),
  ].filter(Boolean);
  if (peakLabels.length) {
    seasonNotes.push(
      en
        ? `Right now: ${peakLabels.join(", ")} — we prioritised in-season spots.`
        : `지금은 ${peakLabels.join(", ")} — 제철 스팟을 우선 담았어요.`,
    );
  }

  return {
    companion,
    duration,
    interests,
    refDate: onDate,
    stops,
    distanceKm: totalDistanceKm(routed),
    substitutions,
    seasonNotes,
  };
}

/** 20250925~20250928 → "2025.09.25~09.28" */
function fmtEventPeriod(p: EventPeriod): string {
  const d = (s: string) => `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  return p.start === p.end ? d(p.start) : `${d(p.start)}~${d(p.end).slice(5)}`;
}

/** 기준 날짜의 요일 인덱스(0=일). weekdayName(i18n)에 넘길 값. */
const dayIndex = (refDate: string) => new Date(`${refDate}T00:00:00`).getDay();
