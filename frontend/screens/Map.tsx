"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { YeojidoMap } from "@/frontend/components/map/YeojidoMap";
import { MapLegend } from "@/frontend/components/map/MapLegend";
import { SpotVisit } from "@/frontend/components/map/SpotVisit";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import { NavBar, SubnavStrip } from "@/frontend/components/chrome/NavBar";
import { Plate } from "@/frontend/components/chrome/Plate";
import { ChromeButton } from "@/frontend/components/chrome/ChromeButton";
import { ToggleChip } from "@/frontend/components/chrome/ToggleChip";
import { THEME_ORDER, WHALE_THEMES } from "@/backend/lib/theme";
import type { WhaleSpot, WhaleThemeId } from "@/backend/lib/types";

async function fetchSpots(): Promise<WhaleSpot[]> {
  const res = await fetch("/api/spots");
  if (!res.ok) throw new Error("스팟을 불러오지 못했어요.");
  return (await res.json()).spots as WhaleSpot[];
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function MapPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["spots"], queryFn: fetchSpots });
  const [active, setActive] = useState<WhaleThemeId | null>(null);
  const [selected, setSelected] = useState<WhaleSpot | null>(null);
  const [query, setQuery] = useState(""); // W7 — 이름 검색
  const [geoMsg, setGeoMsg] = useState<string | null>(null); // W8 — 내 주변
  const [locating, setLocating] = useState(false);

  const spots = data ?? [];
  const shown = useMemo(() => {
    const q = query.trim();
    return spots.filter((s) => (!active || s.theme === active) && (!q || s.title.includes(q)));
  }, [spots, active, query]);

  const filterTheme = (t: WhaleThemeId | null) => {
    setActive(t);
    if (t && selected && selected.theme !== t) setSelected(null);
  };

  // W8 — 현 위치 기반 가장 가까운 고래 스팟으로.
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
        const me = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        let best: WhaleSpot | null = null;
        let bestKm = Infinity;
        for (const s of spots) {
          const km = haversineKm(me, s);
          if (km < bestKm) {
            bestKm = km;
            best = s;
          }
        }
        if (best) {
          setActive(null);
          setSelected(best);
          setGeoMsg(`가장 가까운 고래 스팟: ${best.title} · ${bestKm < 1 ? `${Math.round(bestKm * 1000)}m` : `${bestKm.toFixed(1)}km`}`);
        }
      },
      () => {
        setLocating(false);
        setGeoMsg("위치를 가져오지 못했어요. 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <NavBar />
      <SubnavStrip crumb="여지도 지도" />

      <div className="relative flex-1 overflow-hidden bg-canvas">
        {/* 데스크톱 좌측 레일 — 검색 + 내 주변 + 범례 */}
        <div className="absolute left-3 top-3 z-30 hidden w-[210px] md:block">
          <Plate tone="sky" className="p-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="고래 스팟 이름 검색"
              aria-label="고래 스팟 이름 검색"
              className="wy-inset h-9 w-full rounded-[2px] bg-white px-2 text-[12px] text-ink outline-none"
            />
            <ChromeButton variant="primary" className="mt-2 w-full" onClick={locateNearest} disabled={locating}>
              {locating ? "위치 찾는 중…" : "📍 내 주변 고래 스팟"}
            </ChromeButton>
          </Plate>
          <div className="mt-2">
            <MapLegend spots={spots} active={active} onToggle={filterTheme} />
          </div>
        </div>

        {/* 모바일 상단 툴바 */}
        <div className="absolute inset-x-0 top-2 z-30 space-y-1.5 px-2 md:hidden">
          <div className="flex gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 검색"
              aria-label="고래 스팟 이름 검색"
              className="wy-inset h-10 flex-1 rounded-[2px] bg-white px-2.5 text-[13px] text-ink outline-none"
            />
            <ChromeButton variant="primary" className="shrink-0 px-3" onClick={locateNearest} disabled={locating}>
              📍
            </ChromeButton>
          </div>
          <div role="group" aria-label="고래 테마 필터" className="flex gap-1.5 overflow-x-auto pb-1">
            <ToggleChip active={active === null} onClick={() => filterTheme(null)} className="shrink-0">
              전체 {spots.length}
            </ToggleChip>
            {THEME_ORDER.map((t) => (
              <ToggleChip key={t} active={active === t} onClick={() => filterTheme(active === t ? null : t)} className="shrink-0">
                {WHALE_THEMES[t].label}
              </ToggleChip>
            ))}
          </div>
        </div>

        {/* W8 위치 안내 토스트 */}
        {geoMsg && (
          <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
            <Plate tone="surface" className="max-w-md px-3 py-2">
              <span className="text-[12px] font-semibold text-ink">{geoMsg}</span>
            </Plate>
          </div>
        )}

        {isLoading ? (
          <StatusScreen>
            <WhaleMascot animate className="h-20 w-auto" />
            <p className="wy-legend mt-3 text-[12px] text-carbon">여지도를 펼치는 중…</p>
          </StatusScreen>
        ) : isError ? (
          <StatusScreen>
            <p className="font-bold text-ink">지도를 불러오지 못했어요.</p>
            <ChromeButton variant="submit" className="mt-3" onClick={() => refetch()}>
              다시 시도
            </ChromeButton>
          </StatusScreen>
        ) : (
          <YeojidoMap spots={shown} selectedId={selected?.id ?? null} onSelect={setSelected} />
        )}

        {/* 마커를 누르면 그 장소에 '도착'한 전체화면으로 입장 */}
        {selected && <SpotVisit spot={selected} onClose={() => setSelected(null)} />}
      </div>
    </main>
  );
}

function StatusScreen({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full w-full flex-col items-center justify-center bg-canvas">{children}</div>;
}
