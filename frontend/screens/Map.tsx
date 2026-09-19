"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { YeojidoMap } from "@/frontend/components/map/YeojidoMap";
import { SpotVisit } from "@/frontend/components/map/SpotVisit";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import {
  NavBar,
  SubnavStrip,
} from "@/frontend/components/chrome/NavBar";
import { ChromeButton } from "@/frontend/components/chrome/ChromeButton";

import { THEME_ORDER, WHALE_THEMES } from "@/backend/lib/theme";

import {
  SPOT_CATEGORY_LABEL,
  type SpotCategory,
  type WhaleSpot,
  type WhaleThemeId,
} from "@/backend/lib/types";

type MapScope = "whale" | "all";

const CATEGORY_ORDER: SpotCategory[] = [
  "nature",
  "heritage",
  "culture",
  "experience",
  "festival",
  "other",
];

async function fetchSpots(scope: MapScope): Promise<WhaleSpot[]> {
  const url = scope === "all" ? "/api/spots?scope=all" : "/api/spots";

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("스팟을 불러오지 못했어요.");
  }

  return (await res.json()).spots as WhaleSpot[];
}

function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
    Math.cos(toRad(b.lat)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function pillClass(active: boolean) {
  return [
    "shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition-all duration-200",
    active
      ? "border-water/20 bg-water text-white shadow-[0_6px_16px_rgba(74,144,226,0.22)]"
      : "border-hairline bg-white/80 text-ink-soft hover:border-water/30 hover:bg-ice hover:text-carbon",
  ].join(" ");
}

function MapContent() {
  const searchParams = useSearchParams();
  const requestedSpotId = searchParams.get("spot");
  const handledSpotRef = useRef<string | null>(null);

  const [scope, setScope] = useState<MapScope>(
    searchParams.get("scope") === "all" ? "all" : "whale",
  );

  const [active, setActive] = useState<WhaleThemeId | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<SpotCategory | null>(null);

  const [selected, setSelected] = useState<WhaleSpot | null>(null);
  const [query, setQuery] = useState("");
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["spots", scope],
    queryFn: () => fetchSpots(scope),
  });

  const spots = data ?? [];

  useEffect(() => {
    if (!requestedSpotId) return;
    if (handledSpotRef.current === requestedSpotId) return;

    const target = spots.find(
      (spot) => String(spot.id) === requestedSpotId,
    );

    if (!target) return;

    handledSpotRef.current = requestedSpotId;
    setSelected(target);
  }, [requestedSpotId, spots]);

  const shown = useMemo(() => {
    const q = query.trim();

    return spots.filter((s) => {
      const matchesTheme =
        scope === "whale" ? !active || s.theme === active : true;

      const matchesCategory =
        scope === "all"
          ? !activeCategory || s.category === activeCategory
          : true;

      const matchesQuery =
        !q || s.title.includes(q);

      return matchesTheme && matchesCategory && matchesQuery;
    });
  }, [spots, scope, active, activeCategory, query]);

  const changeScope = (nextScope: MapScope) => {
    setScope(nextScope);
    setActive(null);
    setActiveCategory(null);
    setSelected(null);
    setQuery("");
    setGeoMsg(null);
  };

  const filterTheme = (t: WhaleThemeId | null) => {
    setActive(t);

    if (t && selected && selected.theme !== t) {
      setSelected(null);
    }
  };

  const filterCategory = (category: SpotCategory | null) => {
    setActiveCategory(category);

    if (
      category &&
      selected &&
      selected.category !== category
    ) {
      setSelected(null);
    }
  };

  const locateNearest = () => {
    if (!navigator.geolocation) {
      setGeoMsg("이 브라우저는 위치를 지원하지 않아요.");
      return;
    }

    setLocating(true);
    setGeoMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);

        const me = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };

        let best: WhaleSpot | null = null;
        let bestKm = Infinity;

        for (const s of shown) {
          const km = haversineKm(me, s);

          if (km < bestKm) {
            bestKm = km;
            best = s;
          }
        }

        if (best) {
          setActive(null);
          setActiveCategory(null);
          setSelected(best);

          const distance =
            bestKm < 1
              ? `${Math.round(bestKm * 1000)}m`
              : `${bestKm.toFixed(1)}km`;

          setGeoMsg(
            scope === "whale"
              ? `가장 가까운 고래 스팟: ${best.title} · ${distance}`
              : `가장 가까운 울산 관광지: ${best.title} · ${distance}`,
          );
        } else {
          setGeoMsg(
            "현재 검색·필터 조건에 맞는 관광지가 없어요.",
          );
        }
      },
      () => {
        setLocating(false);
        setGeoMsg(
          "위치를 가져오지 못했어요. 권한을 확인해 주세요.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-canvas-soft">
      <NavBar />
      <SubnavStrip crumb="여지도" />

      <div className="relative flex-1 overflow-hidden bg-[#eaf5ff]">
        {/* 실제 지도 */}
        {!isLoading && !isError && (
          <YeojidoMap
            spots={shown}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        )}

        {/* ─────────────────────────────
            지도 범위 전환
           ───────────────────────────── */}
        {!isLoading && !isError && (
          <div className="absolute left-1/2 top-3 z-40 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-full border border-white/90 bg-white/88 p-1 shadow-[0_10px_30px_rgba(40,87,140,0.12)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => changeScope("whale")}
                className={[
                  "rounded-full px-4 py-2 text-[11px] font-extrabold transition-all duration-200",
                  scope === "whale"
                    ? "bg-carbon text-white shadow-md"
                    : "text-ink-soft hover:bg-ice hover:text-carbon",
                ].join(" ")}
              >
                🐋 고래의 길
              </button>

              <button
                type="button"
                onClick={() => changeScope("all")}
                className={[
                  "rounded-full px-4 py-2 text-[11px] font-extrabold transition-all duration-200",
                  scope === "all"
                    ? "bg-carbon text-white shadow-md"
                    : "text-ink-soft hover:bg-ice hover:text-carbon",
                ].join(" ")}
              >
                🗺️ 울산 전체
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────
            데스크톱 탐색 패널
           ───────────────────────────── */}
        {!isLoading && !isError && (
          <aside className="absolute bottom-4 left-4 top-4 z-30 hidden w-[292px] md:block">
            <div className="flex max-h-full flex-col overflow-hidden rounded-[26px] border border-white/90 bg-white/88 shadow-[0_18px_45px_rgba(32,78,132,0.14)] backdrop-blur-xl">
              <div className="border-b border-hairline/70 p-4">
                <p className="wy-legend text-[9px] text-water">
                  EXPLORE ULSAN
                </p>

                <h1 className="mt-1 text-[20px] font-extrabold tracking-[-0.04em] text-carbon">
                  울산을 탐험해보세요
                </h1>

                <p className="mt-1.5 text-[10.5px] leading-5 text-ink-soft">
                  {scope === "whale"
                    ? "고래의 흔적이 남은 장소를 지도에서 찾아보세요."
                    : "울산의 다양한 관광지를 한눈에 둘러보세요."}
                </p>

                <div className="relative mt-4">
                  <svg
                    aria-hidden
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="6.5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m16 16 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      scope === "whale"
                        ? "고래 스팟을 검색해보세요"
                        : "울산 관광지를 검색해보세요"
                    }
                    aria-label="관광지 이름 검색"
                    className="h-11 w-full rounded-[14px] border border-hairline bg-canvas-soft/80 pl-9 pr-3 text-[12px] text-ink outline-none transition placeholder:text-ink-faint focus:border-water/40 focus:bg-white focus:ring-4 focus:ring-water/10"
                  />
                </div>

                <button
                  type="button"
                  onClick={locateNearest}
                  disabled={locating}
                  className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#397fd2] to-[#57a7ed] px-4 text-[11px] font-extrabold text-white shadow-[0_8px_20px_rgba(57,127,210,0.2)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                >
                  <span aria-hidden>📍</span>

                  {locating
                    ? "현재 위치 찾는 중…"
                    : scope === "whale"
                      ? "내 주변 고래 스팟"
                      : "내 주변 관광지"}
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-extrabold text-carbon">
                    {scope === "whale"
                      ? "고래 여행 테마"
                      : "관광지 유형"}
                  </p>

                  <span className="rounded-full bg-ice px-2 py-1 text-[9px] font-bold text-water">
                    {shown.length}곳
                  </span>
                </div>

                {scope === "whale" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => filterTheme(null)}
                      className={pillClass(active === null)}
                    >
                      전체 {spots.length}
                    </button>

                    {THEME_ORDER.map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() =>
                          filterTheme(
                            active === theme ? null : theme,
                          )
                        }
                        className={pillClass(active === theme)}
                      >
                        {WHALE_THEMES[theme].label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => filterCategory(null)}
                      className={pillClass(
                        activeCategory === null,
                      )}
                    >
                      전체 {spots.length}
                    </button>

                    {CATEGORY_ORDER.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          filterCategory(
                            activeCategory === category
                              ? null
                              : category,
                          )
                        }
                        className={pillClass(
                          activeCategory === category,
                        )}
                      >
                        {SPOT_CATEGORY_LABEL[category]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5 rounded-[18px] bg-gradient-to-br from-ice to-lavender/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                      🐋
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold text-carbon">
                        고래의 길 TIP
                      </p>

                      <p className="mt-1 text-[10px] leading-4.5 text-ink-soft">
                        지도의 마커를 누르면 관광지 정보와
                        GPS 방문 인증 기능을 확인할 수 있어요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ─────────────────────────────
            모바일 탐색 툴바
           ───────────────────────────── */}
        {!isLoading && !isError && (
          <div className="absolute inset-x-0 top-[60px] z-30 px-2 md:hidden">
            <div className="rounded-[20px] border border-white/90 bg-white/90 p-2 shadow-[0_12px_30px_rgba(32,78,132,0.13)] backdrop-blur-xl">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="6.5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m16 16 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      scope === "whale"
                        ? "고래 스팟 검색"
                        : "울산 관광지 검색"
                    }
                    aria-label="관광지 이름 검색"
                    className="h-10 w-full rounded-[13px] border border-hairline bg-canvas-soft pl-8 pr-2 text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-water/40 focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={locateNearest}
                  disabled={locating}
                  aria-label="내 주변 관광지 찾기"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-water text-base text-white shadow-sm transition active:scale-95 disabled:opacity-60"
                >
                  📍
                </button>
              </div>

              <div
                role="group"
                aria-label={
                  scope === "whale"
                    ? "고래 테마 필터"
                    : "관광지 분류 필터"
                }
                className="mt-2 flex gap-1.5 overflow-x-auto pb-1"
              >
                {scope === "whale" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => filterTheme(null)}
                      className={pillClass(active === null)}
                    >
                      전체 {spots.length}
                    </button>

                    {THEME_ORDER.map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() =>
                          filterTheme(
                            active === theme ? null : theme,
                          )
                        }
                        className={pillClass(active === theme)}
                      >
                        {WHALE_THEMES[theme].label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => filterCategory(null)}
                      className={pillClass(
                        activeCategory === null,
                      )}
                    >
                      전체 {spots.length}
                    </button>

                    {CATEGORY_ORDER.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          filterCategory(
                            activeCategory === category
                              ? null
                              : category,
                          )
                        }
                        className={pillClass(
                          activeCategory === category,
                        )}
                      >
                        {SPOT_CATEGORY_LABEL[category]}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 현재 표시 중인 장소 수 */}
        {!isLoading && !isError && (
          <div className="absolute bottom-4 left-4 z-20 hidden md:block md:left-[312px]">
            <div className="rounded-full border border-white/90 bg-white/88 px-3 py-2 text-[10px] font-bold text-ink-soft shadow-lg backdrop-blur-lg">
              <span className="text-water">
                {shown.length}
              </span>
              곳 표시 중
            </div>
          </div>
        )}

        {/* 위치 안내 */}
        {geoMsg && (
          <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-3">
            <div className="max-w-md rounded-full border border-white/90 bg-white/92 px-4 py-2.5 shadow-[0_10px_28px_rgba(32,78,132,0.15)] backdrop-blur-xl">
              <span className="text-[11px] font-bold text-carbon">
                {geoMsg}
              </span>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <StatusScreen>
            <WhaleMascot animate className="h-24 w-auto" />

            <p className="mt-4 text-[13px] font-extrabold text-carbon">
              울산의 고래길을 펼치는 중…
            </p>

            <p className="mt-1 text-[10px] text-ink-soft">
              잠시만 기다려주세요.
            </p>
          </StatusScreen>
        )}

        {/* 에러 */}
        {isError && (
          <StatusScreen>
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-ice text-3xl">
              🌊
            </div>

            <p className="mt-4 font-extrabold text-carbon">
              지도를 불러오지 못했어요.
            </p>

            <p className="mt-1 text-[11px] text-ink-soft">
              네트워크 상태를 확인한 뒤 다시 시도해주세요.
            </p>

            <ChromeButton
              variant="submit"
              className="mt-4"
              onClick={() => refetch()}
            >
              다시 시도
            </ChromeButton>
          </StatusScreen>
        )}

        {/* 관광지 상세 */}
        {selected && (
          <SpotVisit
            spot={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapContent />
    </Suspense>
  );
}

function StatusScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(205,231,255,0.9),transparent_24rem),linear-gradient(180deg,#f7fbff,#edf6ff)]">
      {children}
    </div>
  );
}