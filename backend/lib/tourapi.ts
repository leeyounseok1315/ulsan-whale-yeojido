import type { RawTourItem } from "./types";
import { canCall, quotaStatus, recordCall } from "./metrics";

// 관광 OpenAPI(국문관광정보 서비스 KorService2, *2 시리즈) 서버 전용 클라이언트.
// serviceKey 등 비밀값은 여기(서버)에서만 사용 — 절대규칙 #2. app/api(BFF)에서만 import.
// ⚠️ 생태관광정보 서비스(GreenTourService) 지역기반 API는 사용하지 않는다 — 절대규칙 #5.

const BASE = process.env.TOUR_API_BASE_URL ?? "https://apis.data.go.kr/B551011/KorService2";
const AREA = process.env.TOUR_API_AREA_CODE ?? "7"; // 울산 고정

// data.go.kr는 Encoding/Decoding 두 형태의 키를 준다. URLSearchParams가 호출 시 한 번 인코딩하므로
// 원본(Decoding)이 필요한데, 인코딩 키(%2B 등 포함)를 넣어도 동작하도록 디코딩해 정규화한다.
// → 사용자는 둘 중 무엇을 넣어도 됨.
function normalizeKey(raw: string): string {
  if (!raw.includes("%")) return raw; // 디코딩 키(원본)
  try {
    return decodeURIComponent(raw); // 인코딩 키 → 원본으로 복원
  } catch {
    return raw;
  }
}
const KEY = normalizeKey(process.env.TOUR_API_SERVICE_KEY ?? "");

// KorService2는 엔드포인트별 허용 파라미터가 엄격하다. areaCode는 목록/검색에만 붙이고
// detailCommon2 같은 단건 조회엔 붙이지 않는다(붙이면 INVALID_REQUEST_PARAMETER_ERROR).
const BASE_COMMON: Record<string, string> = {
  MobileOS: "ETC",
  MobileApp: "WhaleYeojido",
  _type: "json",
};

const TIMEOUT_MS = 8000;
const MAX_TRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ApiPage = { items: RawTourItem[]; totalCount: number };
/** 요청 경로(콜드 수집)는 배치보다 짧은 타임아웃·적은 재시도를 쓴다 — 사용자를 기다리게 하지 않으려고. */
export type CallOpts = { timeoutMs?: number; maxTries?: number };

async function callBody(
  endpoint: string,
  params: Record<string, string>,
  withArea = true,
  opts: CallOpts = {},
): Promise<ApiPage> {
  if (!KEY) throw new Error("TOUR_API_SERVICE_KEY 미설정 — mock 모드로 동작해야 합니다.");
  if (!canCall()) {
    const q = quotaStatus();
    throw new Error(`일일 호출 한도 도달(${q.used}/${q.quota}) — 캐시/스냅샷으로 폴백`);
  }

  // 주의: data.go.kr 발급 키는 URL 인코딩된 형태일 수 있음. .env에는 '디코딩된' 키를 넣는다.
  const common = withArea ? { ...BASE_COMMON, areaCode: AREA } : BASE_COMMON;
  const qs = new URLSearchParams({ serviceKey: KEY, ...common, ...params });
  const url = `${BASE}/${endpoint}?${qs.toString()}`;

  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const maxTries = opts.maxTries ?? MAX_TRIES;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
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

/** '고래/장생포/반구대' 키워드 매칭 → 테마 태깅·수집 보강 (areaCode=7). */
export async function searchKeyword(keyword: string, opts?: CallOpts): Promise<RawTourItem[]> {
  return (await callBody("searchKeyword2", { keyword, pageNo: "1", numOfRows: "100" }, true, opts)).items;
}

/**
 * 좌표 기반 주변 목록 (W8). arrange="E"면 거리순 정렬 + 응답에 dist(m) 포함.
 * areaCode를 붙이지 않는다(위치 기반이라 불필요·오류). 절대규칙 #5의 GreenTour 지역기반과 무관 — KorService2다.
 */
export async function locationBasedList(
  lon: number,
  lat: number,
  params: { radius: number; contentTypeId?: string; numOfRows?: number },
  opts?: CallOpts,
): Promise<RawTourItem[]> {
  const p: Record<string, string> = {
    mapX: String(lon),
    mapY: String(lat),
    radius: String(params.radius),
    arrange: "E", // 거리순(+dist)
    pageNo: "1",
    numOfRows: String(params.numOfRows ?? 20),
  };
  if (params.contentTypeId) p.contentTypeId = params.contentTypeId;
  return (await callBody("locationBasedList2", p, false, opts)).items;
}

/** contentId 단건 상세 (areaCode 미포함). 지역 목록에 안 잡히는 핵심 스팟(예: 반구대) 보장 수집·overview 보강. */
export async function detailCommon(contentId: string, opts?: CallOpts): Promise<RawTourItem | null> {
  const { items } = await callBody("detailCommon2", { contentId }, false, opts);
  return items[0] ?? null;
}

// detailIntro2: 콘텐츠타입별 운영시간·휴무·요금 등(필드명이 타입마다 다름 — 호출부에서 매핑).
export async function detailIntro(
  contentId: string,
  contentTypeId: string,
  opts?: CallOpts,
): Promise<Record<string, unknown> | null> {
  const { items } = await callBody("detailIntro2", { contentId, contentTypeId }, false, opts);
  return (items[0] as unknown as Record<string, unknown>) ?? null;
}

// detailImage2: 추가 이미지 갤러리(originimgurl). http→https 보정.
export async function detailImages(contentId: string): Promise<string[]> {
  const { items } = await callBody("detailImage2", { contentId, imageYN: "Y", numOfRows: "10" }, false);
  return (items as unknown as Array<{ originimgurl?: string }>)
    .map((it) => it.originimgurl)
    .filter((u): u is string => Boolean(u))
    .map((u) => u.replace(/^http:\/\//i, "https://"));
}
