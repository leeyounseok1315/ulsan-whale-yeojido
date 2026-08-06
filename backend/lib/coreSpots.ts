import type { WhaleThemeId } from "./types";

// 핵심 5대 고래 스팟 큐레이션 — 실제 관광 OpenAPI contentid 기준.
// mock 모드 호환을 위해 mock 픽스처의 임시 ID(C-*)도 함께 매핑한다.
// (PLAN.md: 핵심 스팟 화이트리스트·큐레이션 데이터셋 / 절대규칙 #3: 고래 테마 고정)

// lat/lon: 단건 조회 실패·좌표 결측 시 폴백(핵심 스팟이 정규화에서 드롭되지 않도록).
export type CoreSpot = { id: string; mockId?: string; theme: WhaleThemeId; seasonal?: boolean; lon: number; lat: number };

export const CORE_SPOTS: CoreSpot[] = [
  { id: "130649", mockId: "C-MUSEUM", theme: "culture", lon: 129.3808374607, lat: 35.5032009945 }, // 장생포 고래박물관
  { id: "2754480", mockId: "C-ECO", theme: "culture", lon: 129.3821429257, lat: 35.5023705573 }, // 장생포 고래생태체험관
  { id: "3495467", mockId: "C-VILLAGE", theme: "culture", lon: 129.3808374607, lat: 35.5032009945 }, // 장생포고래문화특구
  { id: "769495", mockId: "C-CRUISE", theme: "observe", seasonal: true, lon: 129.3808541361, lat: 35.5028149271 }, // 고래바다여행선(시즌)
  { id: "128184", mockId: "C-PETROGLYPH", theme: "heritage", lon: 129.1784, lat: 35.6039 }, // 울주 대곡리 반구대 암각화
];

// 고래 테마 '연계' 자연 자원(고래 키워드는 없지만 큐레이션으로 포함). '고래의 강·산'.
export const LINKED_SPOTS: Record<string, WhaleThemeId> = {
  "128202": "nature", // 태화강 국가정원
  "2674942": "nature", // 영남알프스 복합웰컴센터
  "S-TAEHWA": "nature", // (mock)
  "S-YEONGNAM": "nature", // (mock)
  // 울산고래축제 — 소개글의 '고래 관찰' 문구 때문에 observe로 오분류되던 것을 문화로 고정.
  "553263": "culture",
};

// id 또는 mockId로 조회
export const CORE_BY_ID: Record<string, CoreSpot> = Object.fromEntries(
  CORE_SPOTS.flatMap((c) => (c.mockId ? [[c.id, c], [c.mockId, c]] : [[c.id, c]])),
);

// areaCode=7 지역 목록에 안 잡히는 스팟(예: 반구대)까지 보장 수집하기 위한 detailCommon2 대상 ID.
export const CORE_FETCH_IDS = CORE_SPOTS.map((c) => c.id);

/**
 * 연계 자연 자원 + 축제 단건 조회 대상 — 빠른 수집 경로에서 보장 포함.
 * 축제(553263 울산고래축제)는 회차가 끝나면 searchKeyword2 결과에서 빠지는데(실측),
 * detailCommon2로는 계속 조회된다. 키워드 검색에만 기대면 스팟이 통째로 사라지므로 단건으로 보장한다.
 * (기간 밖 축제는 추천 엔진이 코스에서 제외하고, 지도에는 남아 '언제 열리는지'를 보여준다)
 */
export const LINKED_FETCH_IDS = ["128202", "2674942", "553263"];
