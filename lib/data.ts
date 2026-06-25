import type { RawTourItem, WhaleSpot } from "./types";
import { toWhaleSpot } from "./adapter";
import { cached, setCache } from "./cache";
import { collectAndNormalize, collectFast, isMockMode } from "./collect";
import { recordBatch } from "./metrics";

// BFF 데이터 서비스 레이어 — 캐시 우선 조회 → 미스 시 수집 파이프라인 → 테마 태깅.
// app/api(BFF)에서만 import. 캐시 키 버저닝으로 큐레이션 변경을 반영한다.

const CACHE_KEY = "spots:all:v1";
const TTL_MS = 1000 * 60 * 30; // 30분 (야간 배치 갱신 주기 내 캐시 적중)

/** 정규화된 원시 → 고래 테마 스팟. core 또는 연관도 0.3 이상만, 핵심 스팟 우선 정렬. */
function buildSpots(items: RawTourItem[]): WhaleSpot[] {
  return items
    .map(toWhaleSpot)
    // 여행코스(25)는 지점이 아닌 일정 글귀(주소 결측)라 지도 핀에서 제외 — 추천 엔진이 별도로 코스 생성.
    .filter((s) => s.contentTypeId !== "25")
    .filter((s) => s.isCore || s.relevance >= 0.3)
    .sort((a, b) => Number(b.isCore) - Number(a.isCore) || b.relevance - a.relevance);
}

// 읽기 경로: 빠른 수집(순차) + in-flight 합치기 — 예열과 동시 요청이 수집을 중복 실행하지 않게 한다.
let inflight: Promise<WhaleSpot[]> | null = null;
async function produceFast(): Promise<WhaleSpot[]> {
  return buildSpots((await collectFast()).items);
}
export async function getSpots(): Promise<WhaleSpot[]> {
  return cached(CACHE_KEY, TTL_MS, () => {
    if (!inflight) inflight = produceFast().finally(() => (inflight = null));
    return inflight;
  });
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
    await setCache(CACHE_KEY, TTL_MS, spots);
    recordBatch(true, spots.length);
    return { ok: true as const, count: spots.length, normalize: stats, durationMs: Date.now() - start };
  } catch (err) {
    recordBatch(false, 0);
    throw err;
  }
}

export { isMockMode };
