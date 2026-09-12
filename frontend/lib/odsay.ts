import type { WhaleSpot } from "@/backend/lib/types";

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
    result?: {
        path?: ODsayPath[];
    };
    error?: Array<{
        code: string;
        message: string;
    }>;
}

export interface TransitResult {
    available: boolean;
    travelMin?: number;
    transfers?: number;
    walkM?: number;
    intervalMin?: number;
    payment?: number;
}

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

    const raw = localStorage.getItem(cacheKey(from, to));
    if (!raw) return null;

    try {
        const cached = JSON.parse(raw) as TransitCache;

        if (Date.now() - cached.savedAt > CACHE_TTL_MS) {
            localStorage.removeItem(cacheKey(from, to));
            return null;
        }

        return cached.result;
    } catch {
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

    localStorage.setItem(
        cacheKey(from, to),
        JSON.stringify(cached),
    );
}

export async function getBusTransit(
    from: WhaleSpot,
    to: WhaleSpot,
): Promise<TransitResult> {
    const cached = readTransitCache(from, to);

    if (cached) {
        return cached;
    }

    const apiKey = process.env.NEXT_PUBLIC_ODSAY_API_KEY;

    if (!apiKey) {
        return { available: false };
    }

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
        );

        const data = (await res.json()) as ODsayResponse;

        // API 자체 오류는 일시적일 수 있으므로 캐시하지 않는다.
        if (!res.ok || data.error) {
            return { available: false };
        }

        // 정상 응답이지만 대중교통 경로가 없는 경우만 캐시한다.
        if (!data.result?.path?.length) {
            const result: TransitResult = { available: false };
            writeTransitCache(from, to, result);
            return result;
        }

        const usable = data.result.path
            .map((path) => path.info)
            .filter(
                (info) =>
                    info.busTransitCount <= 1 &&
                    info.totalIntervalTime <= 40,
            )
            .sort((a, b) => a.totalTime - b.totalTime);

        const best = usable[0];

        if (!best) {
            const result: TransitResult = { available: false };
            writeTransitCache(from, to, result);
            return result;
        }

        const result: TransitResult = {
            available: true,
            travelMin: best.totalTime,
            transfers: best.busTransitCount,
            walkM: best.totalWalk,
            intervalMin: best.totalIntervalTime,
            payment: best.payment,
        };

        writeTransitCache(from, to, result);

        return result;
    } catch {
        return { available: false };
    }
}