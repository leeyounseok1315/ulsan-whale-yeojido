// 대중교통(버스) 경로 조회 — 외부 대중교통 OpenAPI(ODsay) 클라이언트.
// 서버 전용: API 키는 절대 클라이언트 번들로 내보내지 않는다(절대규칙 #2).
// 프론트는 /api/transit(BFF)만 호출한다.

interface ODsayPathInfo {
  totalTime: number;
  totalWalk: number;
  busTransitCount: number;
  totalIntervalTime: number;
  checkIntervalTimeOverYn?: string;
  payment?: number;
}

interface ODsayPath {
  pathType: number;
  info: ODsayPathInfo;
}

interface ODsayResponse {
  result?: { path?: ODsayPath[] };
  error?: Array<{ code: string; message: string }>;
}

export interface TransitResult {
  available: boolean;
  travelMin?: number;
  transfers?: number;
  walkM?: number;
  intervalMin?: number;
  payment?: number;
}

export interface LatLon {
  lon: number;
  lat: number;
}

const UNAVAILABLE: TransitResult = { available: false };

/** 키가 없으면 기능을 조용히 끈다(운영 중 장애로 번지지 않게). */
export function hasTransitKey(): boolean {
  return Boolean(process.env.ODSAY_API_KEY);
}

export async function fetchBusTransit(
  from: LatLon,
  to: LatLon,
): Promise<TransitResult> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) return UNAVAILABLE;

  const params = new URLSearchParams({
    SX: String(from.lon),
    SY: String(from.lat),
    EX: String(to.lon),
    EY: String(to.lat),
    SearchType: "0",
    SearchPathType: "2",
    OPT: "0",
    apiKey,
  });

  try {
    const res = await fetch(
      `https://api.odsay.com/v1/api/searchPubTransPathT?${params.toString()}`,
      { cache: "no-store" },
    );

    const data = (await res.json()) as ODsayResponse;

    // API 자체 오류는 일시적일 수 있으므로 '경로 없음'과 구분한다.
    if (!res.ok || data.error) return UNAVAILABLE;
    if (!data.result?.path?.length) return UNAVAILABLE;

    // 환승 1회 이하 · 배차 간격 40분 이하만 실제로 탈 만한 경로로 본다.
    const best = data.result.path
      .map((path) => path.info)
      .filter((info) => info.busTransitCount <= 1 && info.totalIntervalTime <= 40)
      .sort((a, b) => a.totalTime - b.totalTime)[0];

    if (!best) return UNAVAILABLE;

    return {
      available: true,
      travelMin: best.totalTime,
      transfers: best.busTransitCount,
      walkM: best.totalWalk,
      intervalMin: best.totalIntervalTime,
      payment: best.payment,
    };
  } catch {
    return UNAVAILABLE;
  }
}
