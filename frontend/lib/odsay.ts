import type { WhaleSpot } from "@/backend/lib/types";
import type { TransitResult } from "@/backend/lib/transit";

// 대중교통 경로는 서버 BFF(/api/transit)로만 조회한다.
// 외부 API 키는 서버에만 두므로 클라이언트 번들에 들어가지 않는다(절대규칙 #2).
// 여기서는 결과를 브라우저에 24시간 캐시해 같은 구간 재조회를 줄인다.

export type { TransitResult };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

interface TransitCache {
    savedAt: number;
    result: TransitResult;
}

function cacheKey(from: WhaleSpot, to: WhaleSpot) {
    return `odsay:${from.id}:${to.id}`;
}

function readTransitCache(
    from: WhaleSpot,
    to: WhaleSpot,
): TransitResult | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem(cacheKey(from, to));
        if (!raw) return null;

        const cached = JSON.parse(raw) as TransitCache;

        if (Date.now() - cached.savedAt > CACHE_TTL_MS) {
            localStorage.removeItem(cacheKey(from, to));
            return null;
        }

        return cached.result;
    } catch {
        // 사생활 보호 모드 등 localStorage 접근 자체가 막히는 경우까지 삼킨다.
        return null;
    }
}

function writeTransitCache(
    from: WhaleSpot,
    to: WhaleSpot,
    result: TransitResult,
) {
    if (typeof window === "undefined") return;

    const cached: TransitCache = {
        savedAt: Date.now(),
        result,
    };

    try {
        localStorage.setItem(cacheKey(from, to), JSON.stringify(cached));
    } catch {
        // 용량 초과·접근 차단 시 캐시만 포기하고 기능은 계속 동작시킨다.
    }
}

export async function getBusTransit(
    from: WhaleSpot,
    to: WhaleSpot,
): Promise<TransitResult> {
    const cached = readTransitCache(from, to);

    if (cached) {
        return cached;
    }

    const params = new URLSearchParams({
        sx: String(from.lon),
        sy: String(from.lat),
        ex: String(to.lon),
        ey: String(to.lat),
    });

    try {
        const res = await fetch(`/api/transit?${params.toString()}`);

        if (!res.ok) {
            // 일시적 오류일 수 있으므로 캐시하지 않는다.
            return { available: false };
        }

        const result = (await res.json()) as TransitResult;

        writeTransitCache(from, to, result);

        return result;
    } catch {
        return { available: false };
    }
}
