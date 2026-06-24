import type { RawTourItem } from "./types";
import { MOCK_RAW_ITEMS } from "./mock/spots";
import { areaBasedListPage } from "./tourapi";
import { normalizeRaw, type NormalizeStats } from "./normalize";

// 전수 수집 파이프라인 — areaCode=7 기준 6개 contentTypeId를 전 페이지 순회로 수집 → 정규화·정제.
// serviceKey 미발급/USE_MOCK_DATA=true면 mock 픽스처로 동작 (W1~W2 무중단 병행 개발).

const CONTENT_TYPES = ["12", "14", "15", "25", "39", "32"]; // 관광지·문화시설·축제·여행코스·음식점·숙박
const PAGE_SIZE = 100;
const MAX_PAGES = 30; // 안전장치 (무한 루프 방지)
const POLITENESS_MS = 120; // 레이트리밋 배려: 페이지 호출 간 간격
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

export async function collectAllRaw(): Promise<RawTourItem[]> {
  if (isMockMode()) return MOCK_RAW_ITEMS;
  const all: RawTourItem[] = [];
  for (const ct of CONTENT_TYPES) {
    all.push(...(await collectType(ct)));
    await sleep(POLITENESS_MS);
  }
  return all;
}

export async function collectAndNormalize(): Promise<{ items: RawTourItem[]; stats: NormalizeStats }> {
  return normalizeRaw(await collectAllRaw());
}
