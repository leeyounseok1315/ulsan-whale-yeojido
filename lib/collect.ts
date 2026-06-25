import type { RawTourItem } from "./types";
import { MOCK_RAW_ITEMS } from "./mock/spots";
import { areaBasedListPage, detailCommon, searchKeyword } from "./tourapi";
import { normalizeRaw, type NormalizeStats } from "./normalize";
import { CORE_FETCH_IDS } from "./coreSpots";

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
