// 캐싱 레이어 v0 — 인메모리 구현. Redis(Upstash)로 교체 가능하도록 인터페이스 분리.
// 키 버저닝 / TTL / 배치 실패 시 직전 정상 스냅샷 폴백을 담는다. (PLAN.md 캐시 전략)

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
const snapshots = new Map<string, unknown>(); // 배치/원격 실패 폴백용 직전 정상본

/** 캐시 우선 조회 → 미스 시 producer 실행. 실패하면 직전 스냅샷으로 폴백. */
export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;

  try {
    const value = await producer();
    store.set(key, { value, expires: now + ttlMs });
    snapshots.set(key, value); // 정상본 스냅샷 보관
    return value;
  } catch (err) {
    // 데모 당일 빈 화면 방지: 직전 정상 스냅샷이 있으면 그것으로 폴백
    if (snapshots.has(key)) return snapshots.get(key) as T;
    throw err;
  }
}

/** 캐시 무효화 (태그 퍼지/키 버저닝 자리). */
export function purge(key?: string): void {
  if (key) store.delete(key);
  else store.clear();
}

export function cacheStats() {
  return { keys: store.size, snapshots: snapshots.size };
}
