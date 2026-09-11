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
  SpotCategory,
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
const parseTimeMin = (value?: string): number | null => {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

/**
 * 동행 유형별 테마 가중치 (v1 — 결과 차별화의 핵심).
 * 폭을 넓히는 것만으론 부족했다. 핵심 스팟 4곳이 core+relevance 2.0 동점이라,
 * '1순위 테마만 다르고 2·3순위가 같으면' 나머지 자리가 같은 스팟으로 채워져 코스가 겹쳤다.
 * → 동행마다 2순위까지 서로 다른 테마가 오도록 배치했다(격자 탐색으로 검증:
 *   동행 쌍 평균 자카드 0.83→0.35, 완전 동일 쌍 1→0).
 */
const COMPANION_WEIGHT: Record<Companion, Record<WhaleThemeId, number>> = {
  family: { culture: 2.0, nature: 1.3, heritage: 0.9, observe: 0.8 }, // 전시·체험 → 강변 산책
  couple: { nature: 2.0, culture: 1.2, observe: 0.9, heritage: 0.6 }, // 경관 → 분위기 있는 실내
  friends: { observe: 2.0, heritage: 1.3, nature: 1.0, culture: 0.9 }, // 바다 액티비티 → 인증샷 유산
  solo: { heritage: 2.0, nature: 1.3, observe: 0.9, culture: 0.8 }, // 유산·사색 → 조용한 자연
};

const COMPANION_CATEGORY_WEIGHT: Record<
  Companion,
  Record<SpotCategory, number>
> = {
  family: {
    nature: 1.2,
    heritage: 1.1,
    culture: 2.0,
    experience: 1.8,
    festival: 1.2,
    food: 0.8,
    lodging: 0.4,
    other: 0.7,
  },
  couple: {
    nature: 2.0,
    heritage: 1.0,
    culture: 1.4,
    experience: 1.3,
    festival: 1.2,
    food: 1.0,
    lodging: 0.4,
    other: 0.7,
  },
  friends: {
    nature: 1.3,
    heritage: 0.9,
    culture: 1.0,
    experience: 2.0,
    festival: 1.6,
    food: 1.0,
    lodging: 0.4,
    other: 0.7,
  },
  solo: {
    nature: 1.5,
    heritage: 2.0,
    culture: 1.5,
    experience: 1.0,
    festival: 0.9,
    food: 0.8,
    lodging: 0.4,
    other: 0.8,
  },
};

// 같은 테마가 코스를 독식하지 않도록 n번째 선택마다 감쇠(체감 효용).
// 장생포 문화 4곳이 나란히 들어차던 문제를 푼다 — 테마 다양성이 곧 여행 만족도.
// 0.40: 격자 탐색에서 차별화를 해치지 않으면서 코스당 테마 수를 2.25→2.5로 올린 값.
const CATEGORY_DIMINISH = 0.4;
// 같은 지리 클러스터(반경 CLUSTER_KM) 반복 선택 감쇠. 장생포는 서비스의 심장이라
// 배제가 아니라 '완만한' 감쇠로 둔다(과하면 고래 테마가 흐려진다 — 절대규칙 #3).
const CLUSTER_DIMINISH = 0.15;
const CLUSTER_KM = 1.2;

// 관심사 매칭 규칙 + 가중치 (선택한 관심사에 부합하는 스팟을 상위로).
// v1: 0.8 → 1.3. 관심사는 사용자가 '명시적으로 고른' 신호라 동행 테마 선호(폭 1.4)를
// 넘어설 수 있어야 한다. 0.8일 땐 이미 상위인 테마에 묻혀 결과가 안 바뀌는 조합이 있었다
// (예: solo+nature — solo의 nature가 이미 2순위라 순서 불변).
const INTEREST_WEIGHT = 1.3;
const WHALE_THEME_FACTOR = 0.35;
const PEAK_WEIGHT = 0.7; // 제철 스팟 가중(시즌 결합)
// 그날 실제로 열리는 축제 가중 — 며칠뿐인 일회성이라 상시 스팟보다 우선한다.
// (핵심 스팟 가중 +1을 넘겨, 당일 코스처럼 자리가 적을 때도 축제가 들어오도록)
const EVENT_TODAY_WEIGHT = 1.4;
const INTEREST_MATCH: Record<Interest, (s: WhaleSpot) => boolean> = {
  history: (s) =>
    s.category === "heritage" ||
    s.category === "culture",

  nature: (s) =>
    s.category === "nature",

  experience: (s) =>
    s.category === "experience" ||
    /체험|모노레일|케이블카|여행선|크루즈|레포츠|공방/.test(s.title),

  // 고래 관찰은 서비스 정체성과 직접 연결되므로 기존 whale theme도 유지
  observation: (s) =>
    s.theme === "observe" ||
    /고래|생태체험|회유|여행선|크루즈/.test(s.title),

  food: (s) =>
    s.category === "food" ||
    s.contentTypeId === "39",
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

function baseNoteFor(
  spot: WhaleSpot,
  companion: Companion,
  lang: Lang,
): string {
  // 고래바다여행선처럼 시즌 운영이 핵심인 장소
  if (spot.seasonal) {
    return lang === "en"
      ? "See Ulsan from the sea through a whale's eyes — check the sailing times in advance."
      : "바다 위에서 고래의 시선으로 울산을 만나보세요 — 운항 시간을 미리 확인하세요.";
  }

  // 실제 고래 연관 관광지는 고래여지도의 정체성을 살린다.
  if (spot.isWhaleThemed) {
      // 고래 테마이면서 체험형 관광지라면 실제 여행 활동을 강조한다.
  if (spot.category === "experience") {
    return lang === "en"
      ? "Enjoy a hands-on experience while exploring Ulsan's whale-themed attractions."
      : companion === "friends"
        ? "친구들과 울산의 고래 테마를 직접 체험하며 즐기기 좋은 곳이에요."
        : "울산의 고래 테마를 직접 체험하며 즐기기 좋은 곳이에요.";
      }
    if (lang === "en") {
      switch (spot.theme) {
        case "observe":
          return "A special place to experience Ulsan's whale story up close.";

        case "heritage":
          return "Discover traces of whales and prehistoric life preserved in Ulsan.";

        case "culture":
          return companion === "family"
            ? "A whale-themed cultural stop that's easy to enjoy with the family."
            : "Explore the history and culture behind Ulsan's whale city.";

        case "nature":
          return "Enjoy Ulsan's scenery while following the story of the whale city.";
      }
    }

    switch (spot.theme) {
      case "observe":
        return "울산의 고래 이야기를 가까이에서 체험해보기 좋은 곳이에요.";

      case "heritage":
        return "울산에 남은 고래와 선사시대의 흔적을 만나보세요.";

      case "culture":
        return companion === "family"
          ? "가족과 함께 고래 문화와 이야기를 즐기기 좋은 곳이에요."
          : "울산 고래도시의 역사와 문화를 알아보기 좋은 곳이에요.";

      case "nature":
        return "고래도시 울산의 이야기와 함께 자연 풍경을 즐겨보세요.";
    }
  }

  // 일반 울산 관광지는 실제 관광 카테고리에 맞는 설명을 사용한다.
  if (lang === "en") {
    switch (spot.category) {
      case "nature":
        return companion === "couple"
          ? "A scenic stop for a relaxed walk together."
          : "A relaxing place to enjoy Ulsan's natural scenery.";

      case "heritage":
        return "Take time to explore the history and heritage of Ulsan.";

      case "culture":
        return companion === "family"
          ? "A cultural stop with exhibitions and experiences for the family."
          : "A good place to enjoy Ulsan's culture and exhibitions.";

      case "experience":
        return companion === "friends"
          ? "A hands-on stop that's especially fun to enjoy with friends."
          : "Add some activity to your trip with a hands-on experience.";

      case "festival":
        return "Enjoy a local event taking place during your trip.";

      case "food":
        return "Take a break and sample some of Ulsan's local flavors.";

      case "lodging":
        return "A convenient place to rest after your day of travel.";

      default:
        return "A worthwhile stop to add to your Ulsan itinerary.";
    }
  }

  switch (spot.category) {
    case "nature":
      return companion === "couple"
        ? "함께 풍경을 즐기며 여유롭게 걷기 좋은 곳이에요."
        : "울산의 자연 풍경 속에서 쉬어가기 좋은 곳이에요.";

    case "heritage":
      return "울산에 남아 있는 역사와 유산을 천천히 살펴보세요.";

    case "culture":
      return companion === "family"
        ? "가족과 함께 전시와 문화 체험을 즐기기 좋은 곳이에요."
        : "울산의 문화와 전시를 즐겨보기 좋은 곳이에요.";

    case "experience":
      return companion === "friends"
        ? "친구들과 직접 체험하며 즐기기 좋은 곳이에요."
        : "직접 움직이고 체험하는 여행에 잘 어울리는 곳이에요.";

    case "festival":
      return "여행 날짜에 맞춰 울산의 지역 행사를 즐겨보세요.";

    case "food":
      return "울산의 먹거리를 맛보며 잠시 쉬어가기 좋아요.";

    case "lodging":
      return "하루 여행을 마무리하고 편하게 쉬기 좋은 곳이에요.";

    default:
      return "울산 여행 코스에 함께 둘러보기 좋은 장소예요.";
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

const themeW = COMPANION_WEIGHT[companion];
const categoryW = COMPANION_CATEGORY_WEIGHT[companion];

const baseScore = (s: WhaleSpot) =>
  (s.isCore ? 1 : 0.4) +
  (categoryW[s.category] ?? 0.7) +
  (s.isWhaleThemed
    ? (themeW[s.theme] ?? 1) * WHALE_THEME_FACTOR
    : 0) +
  interestBonus(s, interests) +
  (isPeak(s.peak, onDate) ? PEAK_WEIGHT : 0) +
  (s.contentTypeId === "15" && isEventRunning(s.eventPeriod, onDate)
    ? EVENT_TODAY_WEIGHT
    : 0) +
  s.relevance;
  /**
   * v1 선별 — 점수 상위 N개를 그냥 자르지 않고, 이미 고른 것과의 '다양성'을 반영해 하나씩 고른다.
   * 같은 관광 카테고리가 코스를 독식하지 않도록 n번째 선택마다 감쇠
   * (기존 slice 방식은 core+relevance가 동점인 장생포 문화 4곳이 자리를 독식했다)
   */
  const rank = (list: WhaleSpot[], limit: number): WhaleSpot[] => {
    const remaining = [...list];
    const picked: WhaleSpot[] = [];
    const categoryCount = new Map<SpotCategory, number>();

    while (picked.length < limit && remaining.length) {
      let bestIdx = 0;
      let bestVal = -Infinity;
      remaining.forEach((s, i) => {
        const categorySeen = categoryCount.get(s.category) ?? 0;
        const clusterSeen = picked.filter(
          (p) => haversineKm(p, s) <= CLUSTER_KM,
        ).length;

      const val =
      baseScore(s) -
      categorySeen * CATEGORY_DIMINISH -
      clusterSeen * CLUSTER_DIMINISH;
        // 동점이면 원본(연관도·핵심 우선 정렬) 순서를 유지 — 재현성 보장.
        if (val > bestVal) {
          bestVal = val;
          bestIdx = i;
        }
      });
      const [chosenSpot] = remaining.splice(bestIdx, 1);
      picked.push(chosenSpot);
      categoryCount.set(
        chosenSpot.category,
        (categoryCount.get(chosenSpot.category) ?? 0) + 1,
      );
    }
    return picked;
  };

  const days = DAYS[duration];
  const need = Math.min(pool.length, days * STOPS_PER_DAY);
  const ranked = rank(pool, need);
  const routed = orderByRoute(ranked); // 점수·다양성으로 '선별' → 거리로 '순서화'

  // 이동시간 반영 스케줄링: 하루 10:00 시작, 지점당 체류 + 구간 이동시간으로 도착 시각 계산.
  let prev: WhaleSpot | null = null;
  let cur = DAY_START_MIN;
  const stops: CourseStop[] = routed.map((spot, i) => {
    const day = Math.floor(i / STOPS_PER_DAY) + 1;
    const order = (i % STOPS_PER_DAY) + 1;
    let legKm = 0;
    if (order === 1) {
      cur = DAY_START_MIN;
    } else {
      legKm = Math.round(haversineKm(prev as WhaleSpot, spot) * 10) / 10;
      cur = Math.min(
        cur + DWELL_MIN + Math.round((legKm / SPEED_KMH) * 60),
        20 * 60,
      );
    }

// 운영 시작 전 도착하면 실제 오픈 시간까지 기다린 뒤 방문한다.
if (!spot.opening?.alwaysOpenHours) {
  const openMin = parseTimeMin(spot.opening?.open);

  if (openMin !== null && cur < openMin) {
    cur = openMin;
  }
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

    const wouldHave = rank([...pool, ex], Math.min(pool.length + 1, days * STOPS_PER_DAY));
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
    
    const refYmd = onDate.replaceAll("-", "");
    const isUpcoming = ev.eventPeriod.start > refYmd;
    
    if (en) {
      seasonNotes.push(
        isUpcoming
        ? `${ev.title} isn't running on this date, so we left it out (scheduled ${fmtEventPeriod(ev.eventPeriod)}).`
        : `${ev.title} isn't running on this date, so we left it out (last held ${fmtEventPeriod(ev.eventPeriod)}).`,
      );
    } else {
      seasonNotes.push(
        isUpcoming
        ? `${ev.title}${topicParticle(ev.title)} 이 날짜에 열리지 않아 코스에서 뺐어요 (개최 예정 ${fmtEventPeriod(ev.eventPeriod)}).`
        : `${ev.title}${topicParticle(ev.title)} 이 날짜에 열리지 않아 코스에서 뺐어요 (최근 개최 ${fmtEventPeriod(ev.eventPeriod)}).`,
      );
    }
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

  // 요청한 자리보다 코스가 짧으면 왜 짧은지 알린다 (W9 엣지케이스).
  // 조용히 줄여 내보내면 사용자는 '2박3일인데 왜 4곳뿐이지?'를 알 길이 없다.
  const wanted = days * STOPS_PER_DAY;
  if (stops.length < wanted) {
    const why = dropped.size > 0;
    seasonNotes.push(
      en
        ? `Only ${stops.length} of ${wanted} slots could be filled on this date` +
          (why ? " — some places are closed or out of season." : " — the whale-themed pool is small.")
        : `이 날짜엔 ${wanted}곳 중 ${stops.length}곳만 채울 수 있었어요` +
          (why ? " — 휴무·비운항인 곳이 있어서예요." : " — 고래 테마 스팟이 그만큼이라서예요."),
    );
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
