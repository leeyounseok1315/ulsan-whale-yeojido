import type { RawTourItem, WhaleSpot } from "./types";
import { attachSeasonRules, toWhaleSpot } from "./adapter";
import { cached, setCache } from "./cache";
import { collectAndNormalize, collectFast, isMockMode } from "./collect";
import { recordBatch } from "./metrics";

// BFF 데이터 서비스 레이어 — 캐시 우선 조회 → 미스 시 수집 파이프라인 → 테마 태깅.
// app/api(BFF)에서만 import. 캐시 키 버저닝으로 큐레이션 변경을 반영한다.

const CACHE_KEY = "spots:all"; // 버전은 cache의 CACHE_VERSION 프리픽스가 담당
const CACHE_TAG = "spots"; // 태그 퍼지 대상 (큐레이션 변경 시 purgeTag("spots"))
const TTL_MS = 1000 * 60 * 30; // 30분 fresh (이후 SWR stale 구간에서 백그라운드 갱신)

/** 정규화된 원시 → 고래 테마 스팟. core 또는 연관도 0.3 이상만, 핵심 스팟 우선 정렬. */
function buildSpots(items: RawTourItem[]): WhaleSpot[] {
  return items
    .map(toWhaleSpot)
    // 여행코스(25)는 지점이 아닌 일정 글귀(주소 결측)라 지도 핀에서 제외 — 추천 엔진이 별도로 코스 생성.
    .filter((s) => s.contentTypeId !== "25")
    .filter((s) => s.isWhaleThemed)
    .sort((a, b) => Number(b.isCore) - Number(a.isCore) || b.relevance - a.relevance);
}

// 읽기 경로: 빠른 수집(순차). 동시 요청 중복 제거·SWR은 cache 레이어가 담당.
async function produceFast(): Promise<WhaleSpot[]> {
  return buildSpots((await collectFast()).items);
}
export async function getSpots(): Promise<WhaleSpot[]> {
  // 시즌 규칙은 캐시된 payload가 아닌 현재 코드 기준으로 다시 부착 — 규칙·문구 수정이 즉시 반영된다.
  return (await cached(CACHE_KEY, TTL_MS, produceFast, { tags: [CACHE_TAG] })).map(attachSeasonRules);
}

export async function getSpot(id: string): Promise<WhaleSpot | null> {
  return (await getSpots()).find((s) => s.id === id) ?? null;
}

/** 배치/수집 트리거 — 강제 재수집 → 캐시 갱신 → 배치 이력 기록. (Vercel Cron·수집 스크립트가 호출) */
export async function refreshSpots() {
  const start = Date.now();
  try {
    const { items, stats } = await collectAndNormalize();
    const spots = buildSpots(items);
    await setCache(CACHE_KEY, TTL_MS, spots, { tags: [CACHE_TAG] });
    recordBatch(true, spots.length);
    return { ok: true as const, count: spots.length, normalize: stats, durationMs: Date.now() - start };
  } catch (err) {
    recordBatch(false, 0);
    throw err;
  }
}

export { isMockMode };
