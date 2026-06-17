import type { RawTourItem, WhaleSpot } from "./types";
import { MOCK_RAW_ITEMS } from "./mock/spots";
import { toWhaleSpot } from "./adapter";
import { cached } from "./cache";
import { areaBasedList } from "./tourapi";

// BFF 데이터 서비스 레이어 — 캐시 우선 조회 → 미스 시 mock 또는 원격 수집 → 테마 태깅.
// app/api(BFF)에서만 import. 캐시 키 버저닝으로 큐레이션 변경을 반영한다.

const CONTENT_TYPES = ["12", "14", "15", "25", "39", "32"];
const CACHE_KEY = "spots:all:v1";
const TTL_MS = 1000 * 60 * 30; // 30분 (야간 배치 갱신 주기 내 캐시 적중)

/** serviceKey 미발급이거나 USE_MOCK_DATA=true면 mock으로 동작 (W1~W2). */
export function isMockMode(): boolean {
  return process.env.USE_MOCK_DATA === "true" || !process.env.TOUR_API_SERVICE_KEY;
}

async function collectRaw(): Promise<RawTourItem[]> {
  if (isMockMode()) return MOCK_RAW_ITEMS;
  const all: RawTourItem[] = [];
  for (const ct of CONTENT_TYPES) {
    // W2: 전 페이지 순회로 확장. 현재는 1페이지(100건).
    const items = await areaBasedList(ct, 1, 100);
    all.push(...items);
  }
  return all;
}

/** 고래 테마 스팟 전체 (core 또는 연관도 0.3 이상). 핵심 스팟 우선 정렬. */
export async function getSpots(): Promise<WhaleSpot[]> {
  return cached(CACHE_KEY, TTL_MS, async () => {
    const raw = await collectRaw();
    return raw
      .map(toWhaleSpot)
      .filter((s) => s.isCore || s.relevance >= 0.3)
      .sort((a, b) => Number(b.isCore) - Number(a.isCore) || b.relevance - a.relevance);
  });
}

export async function getSpot(id: string): Promise<WhaleSpot | null> {
  return (await getSpots()).find((s) => s.id === id) ?? null;
}
