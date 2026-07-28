import { CONTENT_TYPE_LABEL, type NearbySpot, type RawTourItem } from "./types";
import { locationBasedList, type CallOpts } from "./tourapi";
import { cached } from "./cache";
import { sanitize } from "./sanitize";
import { isMockMode } from "./collect";

// 주변 연계(W8) — 스팟 좌표 기준 먹거리·숙박을 locationBasedList2로 큐레이션.
// 거리순 정렬 + 반경 필터. 캐시 우선 + 생산 실패 시 직전 스냅샷 폴백(cache 레이어가 담당).
// 절대규칙 #1: 사용자 노출 필드(title·address)는 파싱 경계에서 sanitize(공사 표기 차단).

export type NearbyType = "food" | "lodging" | "tour";
const TYPE_CONTENT: Record<NearbyType, string> = { food: "39", lodging: "32", tour: "12" };
export function isNearbyType(v: string | null | undefined): v is NearbyType {
  return v === "food" || v === "lodging" || v === "tour";
}

const TTL_MS = 1000 * 60 * 60; // 1시간
const NEARBY_CALL: CallOpts = { timeoutMs: 4000, maxTries: 2 }; // 요청 경로 — 오래 잡지 않는다
const MAX_FETCH = 30; // 캐시에는 넉넉히 담고 요청별 limit로 잘라 낸다

function toNearby(raw: RawTourItem): NearbySpot {
  return {
    id: raw.contentid,
    title: sanitize(raw.title),
    contentTypeId: raw.contenttypeid,
    contentTypeLabel: CONTENT_TYPE_LABEL[raw.contenttypeid] ?? "관광",
    address: sanitize(raw.addr1 ?? ""),
    lon: Number(raw.mapx ?? 0),
    lat: Number(raw.mapy ?? 0),
    distanceM: Math.round(Number(raw.dist ?? 0)),
    image: raw.firstimage ? raw.firstimage.replace(/^http:\/\//i, "https://") : null,
    tel: raw.tel ? sanitize(raw.tel) : null,
  };
}

/**
 * 좌표 주변의 특정 타입 스팟을 거리순으로. 위치 기반이라 mock 모드에선 [](라이브 전용 보강).
 * 캐시는 좌표(소수 4자리)·타입·반경 기준 1벌, 요청별 limit로 슬라이스.
 */
export async function getNearby(
  lon: number,
  lat: number,
  opts: { type: NearbyType; radius?: number; limit?: number },
): Promise<NearbySpot[]> {
  if (isMockMode()) return [];
  if (!lon || !lat) return [];
  const radius = Math.min(Math.max(opts.radius ?? 2000, 100), 20000);
  const limit = Math.min(Math.max(opts.limit ?? 6, 1), 20);

  const list = await cached(
    `nearby:${lon.toFixed(4)}:${lat.toFixed(4)}:${opts.type}:${radius}`,
    TTL_MS,
    async () => {
      const raw = await locationBasedList(
        lon,
        lat,
        { radius, contentTypeId: TYPE_CONTENT[opts.type], numOfRows: MAX_FETCH },
        NEARBY_CALL,
      );
      return raw
        .map(toNearby)
        .filter((n) => n.lon && n.lat)
        .sort((a, b) => a.distanceM - b.distanceM);
    },
    { tags: ["nearby"] },
  );
  return list.slice(0, limit);
}
