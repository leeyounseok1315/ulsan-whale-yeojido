import type { RawTourItem, WhaleSpot } from "./types";
import { attachSeasonRules, eventPeriodOf, toWhaleSpot } from "./adapter";
import { detailIntro } from "./tourapi";
import { extractIntro } from "./introFields";
import { parseOpening } from "./operating";
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

/**
 * 불완전한 수집 결과를 '성공'으로 캐시·스냅샷에 굳히지 않는다.
 * 굳히면 TTL 내내 200 OK로 서빙되고, 빈화면 방지 스냅샷까지 덮어써 폴백이 무력화된다.
 *  - 0건: 원격 전면 장애
 *  - missing: 큐레이션 스팟/키워드 수집 누락 → 고래 스팟이 빠진 지도가 그대로 굳는다
 * 실패로 던지면 cached()가 직전 정상 스냅샷으로 폴백하고, 없으면 에러를 내 다음 요청이 다시 시도한다.
 */
function assertComplete(spots: WhaleSpot[], missing: string[] = []): WhaleSpot[] {
  if (missing.length) {
    throw new Error(`수집 누락(${missing.join(", ")}) — 부분 데이터를 캐시하지 않음`);
  }
  if (spots.length === 0) {
    throw new Error("수집 결과 0건 — 원격 장애로 판단해 캐시하지 않음(직전 스냅샷으로 폴백)");
  }
  return spots;
}

const INTRO_CONCURRENCY = 3; // data.go.kr 동시요청 제한 안에서 (collectFast와 동일 근거)
const INTRO_CALL = { timeoutMs: 4000, maxTries: 2 }; // 운영정보는 보강값 — 요청 경로를 오래 잡지 않는다

/**
 * 운영정보 사전 부착 (W7) — 스팟마다 detailIntro2를 1회 조회해
 *  · 축제(15) 개최기간(eventstartdate/enddate)
 *  · 운영시간·휴무(useTime/restDate) → OpeningInfo
 * 를 붙인다. 이 값들은 수집 응답엔 없고 detailIntro2에만 있어(실측) 별도 조회가 필요하다.
 * 추천 엔진이 '문 닫은 곳'을 코스에서 빼려면 요청 시점이 아니라 수집(캐시) 단계에 미리 부착돼야 한다.
 * 개별 intro 실패는 관용한다 — 운영정보는 보강값이라, 없으면 그 스팟은 '규칙 모름 = 여는 것으로' 다룬다.
 */
async function withOperatingInfo(spots: WhaleSpot[]): Promise<WhaleSpot[]> {
  if (isMockMode()) {
    // mock 픽스처는 useTime/restDate를 이미 detail에 포함 — 그걸로 운영정보 파싱.
    return spots.map((s) => attachSeasonRules({ ...s, opening: parseOpening(s.detail?.useTime, s.detail?.restDate) }));
  }

  const intros = new Map<string, Record<string, unknown> | null>();
  const queue = [...spots];
  const worker = async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      try {
        intros.set(s.id, await detailIntro(s.id, s.contentTypeId, INTRO_CALL));
      } catch (e) {
        console.warn(`[data] ${s.id} 운영정보(detailIntro) 실패:`, e instanceof Error ? e.message : e);
      }
    }
  };
  await Promise.all(Array.from({ length: INTRO_CONCURRENCY }, worker));

  // eventPeriod·opening이 생기면 제철(peak)도 다시 파생돼야 하므로 attachSeasonRules를 다시 태운다.
  return spots.map((s) => {
    const intro = intros.get(s.id) ?? null;
    const ex = extractIntro(intro);
    return attachSeasonRules({
      ...s,
      eventPeriod: s.contentTypeId === "15" ? eventPeriodOf(intro) : undefined,
      opening: parseOpening(ex.useTime, ex.restDate),
      detail: { useTime: ex.useTime, restDate: ex.restDate, useFee: ex.useFee },
    });
  });
}

// 읽기 경로: 빠른 수집(동시성 3). 동시 요청 중복 제거·SWR은 cache 레이어가 담당.
async function produceFast(): Promise<WhaleSpot[]> {
  const { items, missing } = await collectFast();
  return withOperatingInfo(assertComplete(buildSpots(items), missing));
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
    // 0건이면 캐시·스냅샷을 덮어쓰지 않는다 — 배치가 빈 데이터로 정상본을 파괴하면 복구가 어렵다.
    const spots = await withOperatingInfo(assertComplete(buildSpots(items)));
    await setCache(CACHE_KEY, TTL_MS, spots, { tags: [CACHE_TAG] });
    recordBatch(true, spots.length);
    return { ok: true as const, count: spots.length, normalize: stats, durationMs: Date.now() - start };
  } catch (err) {
    recordBatch(false, 0);
    throw err;
  }
}

export { isMockMode };
