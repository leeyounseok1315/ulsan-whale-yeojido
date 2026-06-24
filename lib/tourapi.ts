import type { RawTourItem } from "./types";
import { canCall, quotaStatus, recordCall } from "./metrics";

// 관광 OpenAPI(국문관광정보 서비스 KorService2, *2 시리즈) 서버 전용 클라이언트.
// serviceKey 등 비밀값은 여기(서버)에서만 사용 — 절대규칙 #2. app/api(BFF)에서만 import.
// ⚠️ 생태관광정보 서비스(GreenTourService) 지역기반 API는 사용하지 않는다 — 절대규칙 #5.

const BASE = process.env.TOUR_API_BASE_URL ?? "https://apis.data.go.kr/B551011/KorService2";
const KEY = process.env.TOUR_API_SERVICE_KEY ?? "";
const AREA = process.env.TOUR_API_AREA_CODE ?? "7"; // 울산 고정

const COMMON: Record<string, string> = {
  MobileOS: "ETC",
  MobileApp: "WhaleYeojido",
  _type: "json",
  areaCode: AREA,
};

const TIMEOUT_MS = 8000;
const MAX_TRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ApiPage = { items: RawTourItem[]; totalCount: number };

async function callBody(endpoint: string, params: Record<string, string>): Promise<ApiPage> {
  if (!KEY) throw new Error("TOUR_API_SERVICE_KEY 미설정 — mock 모드로 동작해야 합니다.");
  if (!canCall()) {
    const q = quotaStatus();
    throw new Error(`일일 호출 한도 도달(${q.used}/${q.quota}) — 캐시/스냅샷으로 폴백`);
  }

  // 주의: data.go.kr 발급 키는 URL 인코딩된 형태일 수 있음. .env에는 '디코딩된' 키를 넣는다.
  const qs = new URLSearchParams({ serviceKey: KEY, ...COMMON, ...params });
  const url = `${BASE}/${endpoint}?${qs.toString()}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      recordCall(endpoint, true);
      const body = json?.response?.body;
      const item = body?.items?.item;
      return {
        items: Array.isArray(item) ? item : item ? [item] : [],
        totalCount: Number(body?.totalCount ?? 0),
      };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      recordCall(endpoint, false);
      await sleep(300 * attempt); // 지수 백오프 (레이트리밋/일시 장애 대비)
    }
  }
  throw new Error(`[TourAPI:${endpoint}] ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}

/** areaCode=7 전수 수집 한 페이지. */
export function areaBasedListPage(contentTypeId: string, pageNo = 1, numOfRows = 100): Promise<ApiPage> {
  return callBody("areaBasedList2", {
    contentTypeId,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    arrange: "C",
  });
}

/** '고래/장생포/반구대' 키워드 매칭 → 테마 태깅 보강. */
export async function searchKeyword(keyword: string): Promise<RawTourItem[]> {
  return (await callBody("searchKeyword2", { keyword, pageNo: "1", numOfRows: "100" })).items;
}
