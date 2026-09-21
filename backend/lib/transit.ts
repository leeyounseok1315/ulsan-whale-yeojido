// 대중교통(버스) 경로 조회 — 외부 대중교통 OpenAPI(ODsay) 클라이언트.
// 서버 전용: API 키는 절대 클라이언트 번들로 내보내지 않는다(절대규칙 #2).
// 프론트는 /api/transit(BFF)만 호출한다.
//
// ⚠️ 이 API는 무료 한도가 하루 30회뿐이고 초과분은 과금된다. 그래서:
//   ① 결과를 Redis에 7일 캐시 — 방문자 전체가 공유한다(브라우저 캐시는 1인분일 뿐).
//      스팟 조합이 한정적이라 한 번 데워지면 그 뒤로는 외부 호출이 거의 없다.
//   ② 경로 없음(available:false)도 캐시한다 — 안 그러면 같은 구간을 매번 다시 묻는다.
//   ③ 일일 호출 상한을 넘기면 호출하지 않고 즉시 미사용 처리한다(fail-closed).
//      호출이 막혀도 화면은 택시 예상요금으로 자연스럽게 대체된다.
import { redisAvailable, redisCommand } from "./cache";

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
  /**
   * 코스의 기본 이동수단으로 삼아도 좋은 경로인지.
   * 울산은 배차 간격이 길어 '버스가 있긴 하다'와 '버스로 가는 게 낫다'가 다르다.
   * false면 화면에는 참고 정보로만 보여주고 일정은 택시 기준으로 유지한다.
   */
  recommended?: boolean;
  /** 미사용 사유 — "quota"면 한도 소진(경로가 없다는 뜻이 아니다). 진단·헬스용. */
  reason?: "no-key" | "no-route" | "quota" | "error";
}

export interface LatLon {
  lon: number;
  lat: number;
}

const UNAVAILABLE: TransitResult = { available: false };

/** 무료 한도. 초과분은 과금되므로 기본값을 한도와 같게 두고 env로만 올린다. */
const DAILY_LIMIT = Number(process.env.ODSAY_DAILY_LIMIT ?? 30);
const HIT_TTL_SEC = 7 * 24 * 60 * 60; // 경로 있음 — 버스 노선은 자주 바뀌지 않는다
const MISS_TTL_SEC = 24 * 60 * 60; // 경로 없음 — 하루 뒤 재확인
const KEY_PREFIX = "transit:v2"; // recommended 필드 추가 — 예전 캐시와 섞이지 않게

/** 환승이 이보다 많으면 관광객에게 권하기 어렵다 — 후보에서 제외. */
const MAX_TRANSFERS = 2;
/** 여기까지면 코스의 기본 이동수단으로 삼는다. 그 밖은 참고 정보로만. */
const GOOD_TRANSFERS = 1;
const GOOD_INTERVAL_MIN = 40;

/** ODsay 애플리케이션에 등록한 서비스 URI. 이 값이 Referer 로 전송된다. */
const REFERER =
  process.env.ODSAY_REFERER ?? process.env.BASE_URL ?? "http://localhost:3000";

/** 좌표는 약 11m 격자로 반올림 — 같은 스팟 쌍이 부동소수 오차로 캐시를 빗나가지 않게. */
const grid = (n: number) => n.toFixed(4);

const cacheKey = (from: LatLon, to: LatLon) =>
  `${KEY_PREFIX}:${grid(from.lon)},${grid(from.lat)}>${grid(to.lon)},${grid(to.lat)}`;

const quotaKey = () => `${KEY_PREFIX}:calls:${new Date().toISOString().slice(0, 10)}`;

// Redis가 없을 때(로컬 개발)를 위한 인메모리 폴백. 프로세스 단위라 정확하진 않지만
// 한도를 아예 놓치는 것보다는 낫다.
let memDay = "";
let memCalls = 0;
const memCache = new Map<string, { at: number; ttl: number; value: TransitResult }>();

async function readCache(key: string): Promise<TransitResult | null> {
  if (redisAvailable()) {
    try {
      const raw = await redisCommand(["GET", key]);
      return raw ? (JSON.parse(raw as string) as TransitResult) : null;
    } catch {
      // Redis 장애 — 인메모리 캐시로 내려간다(아래 공통 경로).
      // 여기서 그냥 null을 돌려주면 캐시가 통째로 사라져 외부 호출이 매번 나간다.
    }
  }

  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > hit.ttl * 1000) {
    memCache.delete(key);
    return null;
  }
  return hit.value;
}

async function writeCache(key: string, value: TransitResult, ttlSec: number) {
  if (redisAvailable()) {
    try {
      await redisCommand(["SET", key, JSON.stringify(value), "EX", ttlSec]);
      return;
    } catch {
      // Redis 장애 — 인메모리에라도 남겨 같은 구간을 다시 묻지 않게 한다.
    }
  }
  memCache.set(key, { at: Date.now(), ttl: ttlSec, value });
}

/** 호출 직전에 원자적으로 한 칸 잡는다. 한도를 넘었으면 되돌리고 false. */
async function claimCall(): Promise<boolean> {
  if (DAILY_LIMIT <= 0) return false;

  if (redisAvailable()) {
    try {
      const key = quotaKey();
      const n = Number(await redisCommand(["INCR", key]));
      if (n === 1) await redisCommand(["EXPIRE", key, 2 * 24 * 60 * 60]);
      if (n > DAILY_LIMIT) {
        await redisCommand(["DECR", key]); // 쓰지 않았으니 카운트를 되돌린다
        return false;
      }
      return true;
    } catch {
      // Redis 장애 — 공유 카운터를 못 쓴다. 기능을 통째로 끄는 대신
      // 프로세스 단위 인메모리 카운터로 내려간다(아래 공통 경로).
      // 인스턴스가 여럿이면 합이 한도를 넘을 수 있으므로, 이 상태에서는
      // 한도를 절반으로 낮춰 과금 위험을 줄인다.
      return claimInMemory(Math.max(1, Math.floor(DAILY_LIMIT / 2)));
    }
  }

  return claimInMemory(DAILY_LIMIT);
}

function claimInMemory(limit: number): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (memDay !== today) {
    memDay = today;
    memCalls = 0;
  }
  if (memCalls >= limit) return false;
  memCalls += 1;
  return true;
}

/** 오늘 외부 호출을 몇 번 썼는지 — /api/health 표시용. */
export async function transitQuotaStatus(): Promise<{
  used: number;
  limit: number;
  exceeded: boolean;
}> {
  let used = memCalls;

  if (redisAvailable()) {
    try {
      used = Number((await redisCommand(["GET", quotaKey()])) ?? 0);
    } catch {
      /* 읽기 실패 시 인메모리 값으로 */
    }
  }

  return { used, limit: DAILY_LIMIT, exceeded: used >= DAILY_LIMIT };
}

/** 키가 없으면 기능을 조용히 끈다(운영 중 장애로 번지지 않게). */
export function hasTransitKey(): boolean {
  return Boolean(process.env.ODSAY_API_KEY);
}

export async function fetchBusTransit(
  from: LatLon,
  to: LatLon,
): Promise<TransitResult> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) return { available: false, reason: "no-key" };

  // ① 공유 캐시 — 여기서 걸리면 외부 호출 0회.
  const key = cacheKey(from, to);
  const cached = await readCache(key);
  if (cached) return cached;

  // ② 한도 — 넘었으면 호출하지 않는다. 화면은 택시 예상요금으로 대체된다.
  if (!(await claimCall())) return { available: false, reason: "quota" };

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
      {
        cache: "no-store",
        // ODsay는 등록된 서비스 URI 와 Referer 를 대조해 인증한다.
        // 서버에서 부르면 브라우저처럼 Referer 가 자동으로 붙지 않아
        // ApiKeyAuthFailed 로 거부된다 — 등록한 도메인을 명시해 준다.
        headers: { Referer: REFERER },
      },
    );

    const data = (await res.json()) as ODsayResponse;

    // API 자체 오류는 일시적일 수 있으므로 캐시하지 않는다(다음에 다시 물어본다).
    if (!res.ok || data.error) return { available: false, reason: "error" };

    // 경로를 버리지 않고 '가장 나은 것'을 고른다. 예전엔 환승<=1·배차<=40분으로
    // 걸렀는데, 울산 배차 간격이 길어 실제로는 전부 탈락해 버스가 영영 안 떴다.
    // 대신 그 기준을 'recommended' 판정으로 옮겨, 기본 이동수단으로 쓸지만 가른다.
    const best = (data.result?.path ?? [])
      .map((path) => path.info)
      .filter((info) => info.busTransitCount <= MAX_TRANSFERS)
      .sort(
        (a, b) =>
          a.busTransitCount - b.busTransitCount || a.totalTime - b.totalTime,
      )[0];

    if (!best) {
      const miss: TransitResult = { available: false, reason: "no-route" };
      await writeCache(key, miss, MISS_TTL_SEC);
      return miss;
    }

    const result: TransitResult = {
      available: true,
      travelMin: best.totalTime,
      transfers: best.busTransitCount,
      walkM: best.totalWalk,
      intervalMin: best.totalIntervalTime,
      payment: best.payment,
      recommended:
        best.busTransitCount <= GOOD_TRANSFERS &&
        best.totalIntervalTime <= GOOD_INTERVAL_MIN,
    };

    await writeCache(key, result, HIT_TTL_SEC);

    return result;
  } catch {
    return { available: false, reason: "error" };
  }
}
