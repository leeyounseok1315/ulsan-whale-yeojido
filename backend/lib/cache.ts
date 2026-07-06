// 캐싱 레이어 v1 — Upstash Redis(REST) 우선, 미설정 시 인메모리로 자동 폴백.
// 키 버저닝 / TTL / 배치·원격 실패 시 직전 정상 스냅샷 폴백을 담는다. (PLAN.md 캐시 전략)
// 비밀값(Upstash 토큰)은 서버에서만 사용 — 절대규칙 #2.

type Entry = { value: unknown; expires: number };

const mem = new Map<string, Entry>();
const snapshots = new Map<string, unknown>(); // 배치/원격 실패 폴백용 직전 정상본 (백엔드와 무관하게 인메모리 보관)

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(UP_URL && UP_TOKEN);

export function cacheBackend(): "redis" | "memory" {
  return useRedis ? "redis" : "memory";
}

// Upstash REST: 단일 명령 배열을 POST. 값은 JSON 문자열로 저장한다.
async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(UP_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${UP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  return (await res.json()).result;
}

/** 다른 모듈(메트릭 등)이 같은 Upstash 연결을 재사용하도록 노출. */
export function redisAvailable(): boolean {
  return useRedis;
}
export async function redisCommand(cmd: (string | number)[]): Promise<unknown> {
  return redisCmd(cmd);
}

async function backendGet<T>(key: string): Promise<T | undefined> {
  if (useRedis) {
    const r = await redisCmd(["GET", key]);
    return r == null ? undefined : (JSON.parse(r as string) as T);
  }
  const e = mem.get(key);
  if (e && e.expires > Date.now()) return e.value as T;
  return undefined;
}

async function backendSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  if (useRedis) {
    await redisCmd(["SET", key, JSON.stringify(value), "EX", Math.ceil(ttlMs / 1000)]);
  } else {
    mem.set(key, { value, expires: Date.now() + ttlMs });
  }
}

/** 캐시 우선 조회 → 미스 시 producer 실행. 실패하면 직전 정상 스냅샷으로 폴백. */
export async function cached<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  try {
    const hit = await backendGet<T>(key);
    if (hit !== undefined) return hit;
  } catch {
    // 캐시 백엔드 장애는 무시하고 producer로 진행 (가용성 우선)
  }
  try {
    const value = await producer();
    await backendSet(key, value, ttlMs).catch(() => {});
    snapshots.set(key, value); // 정상본 스냅샷 보관
    return value;
  } catch (err) {
    if (snapshots.has(key)) return snapshots.get(key) as T; // 데모 당일 빈 화면 방지
    throw err;
  }
}

/** 강제 갱신(배치) — producer 결과를 직접 캐시에 기록. */
export async function setCache<T>(key: string, ttlMs: number, value: T): Promise<void> {
  await backendSet(key, value, ttlMs).catch(() => {});
  snapshots.set(key, value);
}

/** 캐시 무효화 (키 버저닝/태그 퍼지 자리). */
export async function purge(key?: string): Promise<void> {
  if (useRedis && key) await redisCmd(["DEL", key]).catch(() => {});
  if (key) mem.delete(key);
  else mem.clear();
}

export function cacheStats() {
  return { backend: cacheBackend(), memKeys: mem.size, snapshots: snapshots.size };
}
