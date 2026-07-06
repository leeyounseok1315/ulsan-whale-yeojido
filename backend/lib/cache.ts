// 캐싱 레이어 v2 — Upstash Redis(REST) 우선, 미설정 시 인메모리 폴백.
// W4 캐시 전략: 키 버저닝 · SWR(stale-while-revalidate) · 태그 퍼지 · 배치/원격 실패 스냅샷 폴백.
// 비밀값(Upstash 토큰)은 서버에서만 사용 — 절대규칙 #2.

export const CACHE_VERSION = "v2"; // 올리면 전체 캐시 무효화(배포 시 큐레이션 강제 갱신)
const STALE_RATIO = 0.5; // fresh 만료 후 freshMs*STALE_RATIO 동안은 stale 허용(백그라운드 갱신)

type Envelope<T> = { v: T; staleAt: number };
type MemEntry = { env: Envelope<unknown>; hardExpires: number };

const mem = new Map<string, MemEntry>();
const snapshots = new Map<string, unknown>(); // 원격/생산 실패 폴백용 직전 정상본(백엔드 무관 인메모리)
const memTags = new Map<string, Set<string>>(); // tag -> vkey 집합(인메모리 태그 퍼지용)
const inflight = new Map<string, Promise<unknown>>(); // 동시 생산/갱신 중복 제거

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(UP_URL && UP_TOKEN);

export function cacheBackend(): "redis" | "memory" {
  return useRedis ? "redis" : "memory";
}

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

const vkey = (key: string) => `${CACHE_VERSION}:${key}`;
const tagKey = (tag: string) => `${CACHE_VERSION}:tag:${tag}`;

async function rawGet<T>(vk: string): Promise<Envelope<T> | undefined> {
  if (useRedis) {
    const r = await redisCmd(["GET", vk]);
    return r == null ? undefined : (JSON.parse(r as string) as Envelope<T>);
  }
  const e = mem.get(vk);
  if (e && e.hardExpires > Date.now()) return e.env as Envelope<T>;
  return undefined;
}

async function rawSet<T>(vk: string, env: Envelope<T>, hardMs: number, tags: string[]): Promise<void> {
  if (useRedis) {
    await redisCmd(["SET", vk, JSON.stringify(env), "EX", String(Math.ceil(hardMs / 1000))]);
    for (const t of tags) {
      await redisCmd(["SADD", tagKey(t), vk]).catch(() => {});
      await redisCmd(["EXPIRE", tagKey(t), String(Math.ceil((hardMs / 1000) * 4))]).catch(() => {});
    }
  } else {
    mem.set(vk, { env, hardExpires: Date.now() + hardMs });
    for (const t of tags) {
      const s = memTags.get(t) ?? new Set<string>();
      s.add(vk);
      memTags.set(t, s);
    }
  }
}

function revalidate<T>(vk: string, freshMs: number, hardMs: number, producer: () => Promise<T>, tags: string[]) {
  if (inflight.has(vk)) return;
  const pr = (async () => {
    try {
      const v = await producer();
      await rawSet(vk, { v, staleAt: Date.now() + freshMs }, hardMs, tags);
      snapshots.set(vk, v);
    } catch {
      /* 갱신 실패 시 기존 stale 유지 */
    } finally {
      inflight.delete(vk);
    }
  })();
  inflight.set(vk, pr);
}

/**
 * 캐시 우선 조회. fresh면 즉시 반환, stale이면 즉시 반환 + 백그라운드 갱신(SWR),
 * miss면 생산(동시 요청 dedup). 생산 실패 시 직전 정상 스냅샷으로 폴백.
 */
export async function cached<T>(
  key: string,
  freshMs: number,
  producer: () => Promise<T>,
  opts?: { tags?: string[] },
): Promise<T> {
  const vk = vkey(key);
  const tags = opts?.tags ?? [];
  const hardMs = Math.round(freshMs * (1 + STALE_RATIO));

  let env: Envelope<T> | undefined;
  try {
    env = await rawGet<T>(vk);
  } catch {
    /* 캐시 백엔드 장애 → 생산으로 진행 */
  }
  if (env) {
    if (Date.now() < env.staleAt) return env.v; // fresh
    revalidate(vk, freshMs, hardMs, producer, tags); // stale → 즉시 반환 + 뒤에서 갱신
    return env.v;
  }

  // miss — 동시 요청 합치기
  if (inflight.has(vk)) return inflight.get(vk) as Promise<T>;
  const pr = (async () => {
    try {
      const v = await producer();
      await rawSet(vk, { v, staleAt: Date.now() + freshMs }, hardMs, tags).catch(() => {});
      snapshots.set(vk, v);
      return v;
    } catch (err) {
      if (snapshots.has(vk)) return snapshots.get(vk) as T; // 데모 당일 빈 화면 방지
      throw err;
    } finally {
      inflight.delete(vk);
    }
  })();
  inflight.set(vk, pr);
  return pr as Promise<T>;
}

/** 강제 갱신(배치) — 결과를 직접 캐시에 기록. */
export async function setCache<T>(key: string, freshMs: number, value: T, opts?: { tags?: string[] }): Promise<void> {
  const vk = vkey(key);
  const hardMs = Math.round(freshMs * (1 + STALE_RATIO));
  await rawSet(vk, { v: value, staleAt: Date.now() + freshMs }, hardMs, opts?.tags ?? []).catch(() => {});
  snapshots.set(vk, value);
}

/** 단일 키 무효화. */
export async function purge(key?: string): Promise<void> {
  if (key) {
    const vk = vkey(key);
    if (useRedis) await redisCmd(["DEL", vk]).catch(() => {});
    mem.delete(vk);
  } else if (!useRedis) {
    mem.clear();
  }
}

/** 태그 퍼지 — 해당 태그로 저장된 모든 키 무효화(큐레이션 변경 즉시 반영). 삭제 개수 반환. */
export async function purgeTag(tag: string): Promise<number> {
  if (useRedis) {
    const members = ((await redisCmd(["SMEMBERS", tagKey(tag)])) as string[]) ?? [];
    if (members.length) await redisCmd(["DEL", ...members]).catch(() => {});
    await redisCmd(["DEL", tagKey(tag)]).catch(() => {});
    for (const vk of members) mem.delete(vk);
    return members.length;
  }
  const s = memTags.get(tag);
  let n = 0;
  if (s) {
    for (const vk of s) {
      mem.delete(vk);
      n += 1;
    }
    memTags.delete(tag);
  }
  return n;
}

export function cacheStats() {
  return {
    backend: cacheBackend(),
    version: CACHE_VERSION,
    memKeys: mem.size,
    snapshots: snapshots.size,
    inflight: inflight.size,
  };
}
