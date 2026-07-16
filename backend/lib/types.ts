// 앱 전역 타입 정의.
// 관광 OpenAPI(공공데이터) 원시 필드는 파싱 경계(adapter)에서만 만지고,
// 앱 내부에서는 아래 WhaleSpot 등 표준 모델만 사용한다. (CLAUDE.md 코딩 컨벤션)

/** 관광 OpenAPI 원시 응답 아이템 — adapter 밖으로 새지 않게 한다. */
export interface RawTourItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  mapx?: string; // 경도(lon)
  mapy?: string; // 위도(lat)
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  overview?: string;
  // detailCommon2 / detailIntro2 로 보강되는 필드
  usetime?: string;
  restdate?: string;
  usefee?: string;
}

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  "12": "관광지",
  "14": "문화시설",
  "15": "축제·공연",
  "25": "여행코스",
  "28": "레포츠",
  "32": "숙박",
  "38": "쇼핑",
  "39": "음식점",
};

/** 고래 테마 분류 — 행정구역(구/군)이 아니다. (절대규칙 #3) */
export type WhaleThemeId = "culture" | "observe" | "heritage" | "nature";

export interface WhaleTheme {
  id: WhaleThemeId;
  label: string;
  blurb: string;
  /** 디자인 토큰 색상 변수 (인주/쪽빛/먹/녹) */
  tone: "seal" | "water" | "ink" | "jade";
}

/** 앱 내부 표준 스팟 모델 */
export interface WhaleSpot {
  id: string; // contentid
  title: string;
  theme: WhaleThemeId;
  contentTypeId: string;
  contentTypeLabel: string;
  address: string;
  lon: number; // mapx
  lat: number; // mapy
  image: string | null;
  tel: string | null;
  summary: string; // overview (공사 표기 sanitize 적용)
  isCore: boolean; // 핵심 5대 고래 스팟 화이트리스트
  isWhaleThemed: boolean; // 고래 테마 여부 (= isCore || relevance>=임계) — 태깅 엔진 출력
  relevance: number; // 0~1 고래 연관도
  seasonal?: SeasonRule; // 가용성 시즌(고래바다여행선 운항 등) — 휴지기엔 코스에서 제외
  peak?: PeakSeason; // 제철 — 해당 시기에 추천 가중치·배지
  detail?: SpotDetail;
  images?: string[]; // 상세 갤러리(detailImage2) — 상세 조회 시에만 채움
}

export interface SpotDetail {
  useTime?: string;
  restDate?: string;
  useFee?: string;
}

export type Companion = "family" | "couple" | "friends" | "solo";
export type Duration = "day" | "1n2d" | "2n3d";
export type Interest = "history" | "nature" | "experience" | "observation" | "food";

export const COMPANION_LABEL: Record<Companion, string> = {
  family: "가족",
  couple: "연인",
  friends: "친구",
  solo: "혼자",
};
export const DURATION_LABEL: Record<Duration, string> = {
  day: "당일",
  "1n2d": "1박 2일",
  "2n3d": "2박 3일",
};
// 관심사 — 추천 입력 도메인 확장(W4). 스팟 점수에 가중치로 반영.
export const INTEREST_LABEL: Record<Interest, string> = {
  history: "역사·유산",
  nature: "자연·경관",
  experience: "체험·가족",
  observation: "고래 관찰",
  food: "미식",
};
export const INTERESTS: Interest[] = ["history", "nature", "experience", "observation", "food"];

export interface SeasonRule {
  openMonths: number[]; // 1~12. 예: 고래바다여행선 4~10월
  label: string;
  closedNote: string;
}

/** 제철(성수기) — 가용성(SeasonRule)과 별개로 '지금이 가장 좋은 때'. 추천 가중치·배지에 사용. */
export interface PeakSeason {
  months: number[]; // 1~12
  label: string; // 예: "억새 절정"
}

/** 시즌 비가용 스팟을 대체한 기록 (비운항기 대체 안내). */
export interface Substitution {
  excludedTitle: string;
  replacedByTitle: string;
  reason: string; // 예: "고래바다여행선 운항 휴지기(11~3월)"
}

export interface CourseStop {
  spot: WhaleSpot;
  day: number;
  order: number;
  arrive: string; // "10:00" — 이동시간 반영 계산
  legKm: number; // 같은 날 직전 지점에서의 이동 거리(km). 하루 첫 지점은 0.
  isPeak: boolean; // 기준 날짜 기준 제철인지
  note: string;
}

export interface Course {
  companion: Companion;
  duration: Duration;
  interests: Interest[];
  refDate: string; // 기준 날짜(외부 주입 가능 — 시즌 검증용)
  stops: CourseStop[];
  distanceKm: number; // 코스 총 이동 거리(순서화 반영)
  substitutions: Substitution[]; // 시즌 비가용 → 대체 스팟 기록
  seasonNotes: string[];
}
