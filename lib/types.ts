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
  "39": "음식점",
  "32": "숙박",
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
  relevance: number; // 0~1 고래 연관도
  seasonal?: SeasonRule; // 시즌성(고래바다여행선 등)
  detail?: SpotDetail;
}

export interface SpotDetail {
  useTime?: string;
  restDate?: string;
  useFee?: string;
}

export type Companion = "family" | "couple" | "friends" | "solo";
export type Duration = "day" | "1n2d" | "2n3d";

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

export interface SeasonRule {
  openMonths: number[]; // 1~12. 예: 고래바다여행선 4~10월
  label: string;
  closedNote: string;
}

export interface CourseStop {
  spot: WhaleSpot;
  day: number;
  order: number;
  arrive: string; // "10:00"
  note: string;
}

export interface Course {
  companion: Companion;
  duration: Duration;
  refDate: string; // 기준 날짜(외부 주입 가능 — 시즌 검증용)
  stops: CourseStop[];
  seasonNotes: string[];
}
