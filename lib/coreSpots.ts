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
};

// id 또는 mockId로 조회
export const CORE_BY_ID: Record<string, CoreSpot> = Object.fromEntries(
  CORE_SPOTS.flatMap((c) => (c.mockId ? [[c.id, c], [c.mockId, c]] : [[c.id, c]])),
);

// areaCode=7 지역 목록에 안 잡히는 스팟(예: 반구대)까지 보장 수집하기 위한 detailCommon2 대상 ID.
export const CORE_FETCH_IDS = CORE_SPOTS.map((c) => c.id);
