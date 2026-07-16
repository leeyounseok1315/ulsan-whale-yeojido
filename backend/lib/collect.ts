import type { RawTourItem } from "./types";
import { MOCK_RAW_ITEMS } from "./mock/spots";
import { areaBasedListPage, detailCommon, searchKeyword, type CallOpts } from "./tourapi";
import { normalizeRaw, type NormalizeStats } from "./normalize";
import { CORE_FETCH_IDS, LINKED_FETCH_IDS } from "./coreSpots";

// 전수 수집 파이프라인 — areaCode=7 지역 목록 + 고래 키워드 검색 + 핵심 스팟 단건조회를 병합.
// serviceKey 미발급/USE_MOCK_DATA=true면 mock 픽스처로 동작 (W1~W2 무중단 병행 개발).

const CONTENT_TYPES = ["12", "14", "15", "25", "39", "32"]; // 관광지·문화시설·축제·여행코스·음식점·숙박
const WHALE_KEYWORDS = ["고래", "장생포"]; // 28/38(레포츠·쇼핑) 등 지역 목록 밖 항목까지 보강
const PAGE_SIZE = 100;
const MAX_PAGES = 30; // 안전장치
const POLITENESS_MS = 120; // 레이트리밋 배려
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** serviceKey 미발급이거나 USE_MOCK_DATA=true면 mock 모드. */
export function isMockMode(): boolean {
  return process.env.USE_MOCK_DATA === "true" || !process.env.TOUR_API_SERVICE_KEY;
}

async function collectType(contentTypeId: string): Promise<RawTourItem[]> {
  const out: RawTourItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { items, totalCount } = await areaBasedListPage(contentTypeId, page, PAGE_SIZE);
    out.push(...items);
    if (items.length < PAGE_SIZE || items.length === 0 || out.length >= totalCount) break;
    await sleep(POLITENESS_MS);
  }
  return out;
}

// 핵심 스팟은 detailCommon2로 직접 조회 → areaCode 목록에 안 잡히는 반구대까지 보장 + overview 확보.
async function fetchCoreDetails(): Promise<RawTourItem[]> {
  const out: RawTourItem[] = [];
  for (const id of CORE_FETCH_IDS) {
    try {
      const it = await detailCommon(id);
      if (it) out.push(it);
    } catch (e) {
      // 개별 실패는 진행하되 무경고로 두지 않는다(쿼터 초과 시 핵심 누락 감지).
      console.warn(`[collect] 핵심 스팟 ${id} detailCommon 실패:`, e instanceof Error ? e.message : e);
    }
    await sleep(POLITENESS_MS);
  }
  return out;
}

async function fetchKeywords(): Promise<RawTourItem[]> {
  const out: RawTourItem[] = [];
  for (const kw of WHALE_KEYWORDS) {
    try {
      out.push(...(await searchKeyword(kw)));
    } catch (e) {
      console.warn(`[collect] 키워드 "${kw}" 검색 실패:`, e instanceof Error ? e.message : e);
    }
    await sleep(POLITENESS_MS);
  }
  return out;
}

export async function collectAllRaw(): Promise<RawTourItem[]> {
  if (isMockMode()) return MOCK_RAW_ITEMS;
  // 순서 중요: 핵심 단건(overview 포함)을 앞에 둬서 중복 제거 시 풍부한 레코드가 우선되게 한다.
  const core = await fetchCoreDetails();
  const area: RawTourItem[] = [];
  for (const ct of CONTENT_TYPES) {
    area.push(...(await collectType(ct)));
    await sleep(POLITENESS_MS);
  }
  const kw = await fetchKeywords();
  return [...core, ...area, ...kw];
}

export async function collectAndNormalize(): Promise<{ items: RawTourItem[]; stats: NormalizeStats }> {
  return normalizeRaw(await collectAllRaw());
}

// 빠른 수집(요청 경로·예열용) — 전수 areaBasedList 스캔 대신 핵심·연계 단건 + 고래 키워드만 '병렬'로.
// 큐레이션 출력 집합은 전수 수집과 동일하지만 호출 수가 적고 동시 실행이라 콜드 지연을 크게 줄인다.
// (전수 수집 collectAllRaw는 야간 배치 refreshSpots에서 유지)
// 요청 경로 설정.
// 동시성 3: 실측으로 순차 17.4초 → 3.3초, 실패 0건. (예전 주석의 '병렬 버스트 스로틀링'은
// 9건을 한꺼번에 쏘던 때 얘기다. 3건씩은 data.go.kr가 문제없이 받는다)
// 예산은 '조용히 잘라내는 상한'이 아니라 '병목 시 실패시키는 안전장치'다 —
// 부분 수집을 성공으로 캐시하면 큐레이션 스팟이 빠진 지도가 그대로 굳는다(실제로 12건→6건이 됐다).
const FAST_CONCURRENCY = 3;
const FAST_BUDGET_MS = 15_000;
const FAST_CALL: CallOpts = { timeoutMs: 5000, maxTries: 2 };

/** 고정 동시성 풀 — 순서 무관, 각 작업은 스스로 성패를 기록한다. */
async function runPool(tasks: Array<() => Promise<void>>, size: number): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) await tasks[next++]();
    }),
  );
}

export type FastResult = { items: RawTourItem[]; stats: NormalizeStats; missing: string[] };

export async function collectFast(): Promise<FastResult> {
  if (isMockMode()) return { ...normalizeRaw(MOCK_RAW_ITEMS), missing: [] };

  const raw: RawTourItem[] = [];
  const missing: string[] = [];
  const tasks: Array<() => Promise<void>> = [
    ...[...CORE_FETCH_IDS, ...LINKED_FETCH_IDS].map((id) => async () => {
      try {
        const it = await detailCommon(id, FAST_CALL);
        if (it) raw.push(it);
        else missing.push(id);
      } catch (e) {
        console.warn(`[collectFast] 단건 ${id} 실패:`, e instanceof Error ? e.message : e);
        missing.push(id);
      }
    }),
    ...WHALE_KEYWORDS.map((kw) => async () => {
      try {
        raw.push(...(await searchKeyword(kw, FAST_CALL)));
      } catch (e) {
        console.warn(`[collectFast] 키워드 "${kw}" 실패:`, e instanceof Error ? e.message : e);
        missing.push(`kw:${kw}`);
      }
    }),
  ];

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const budget = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`[collectFast] 수집 예산 ${FAST_BUDGET_MS}ms 초과`)), FAST_BUDGET_MS);
    });
    await Promise.race([runPool(tasks, FAST_CONCURRENCY), budget]);
  } finally {
    clearTimeout(timer);
  }
  return { ...normalizeRaw(raw), missing };
}
