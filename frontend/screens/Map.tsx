"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { YeojidoMap } from "@/frontend/components/map/YeojidoMap";
import { MapLegend } from "@/frontend/components/map/MapLegend";
import { SpotDetailPanel } from "@/frontend/components/map/SpotDetailPanel";
import { PetroglyphWhale } from "@/frontend/components/ui/PetroglyphWhale";
import { SourceLabel } from "@/frontend/components/ui/SourceLabel";
import { ToggleButton } from "@/frontend/components/ui/ToggleButton";
import { THEME_ORDER, WHALE_THEMES, themeColor } from "@/backend/lib/theme";
import type { WhaleSpot, WhaleThemeId } from "@/backend/lib/types";

async function fetchSpots(): Promise<WhaleSpot[]> {
  const res = await fetch("/api/spots");
  if (!res.ok) throw new Error("스팟을 불러오지 못했어요.");
  const json = await res.json();
  return json.spots as WhaleSpot[];
}

export default function MapPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["spots"], queryFn: fetchSpots });
  const [active, setActive] = useState<WhaleThemeId | null>(null);
  const [selected, setSelected] = useState<WhaleSpot | null>(null);

  const spots = data ?? [];
  const shown = useMemo(() => (active ? spots.filter((s) => s.theme === active) : spots), [spots, active]);

  // 테마를 바꿔 선택 스팟이 지도에서 사라지면 상세 패널도 닫는다 —
  // 지도에 없는 마커의 패널만 덩그러니 남아 지도와 패널 상태가 어긋나던 문제.
  const filterTheme = (t: WhaleThemeId | null) => {
    setActive(t);
    if (t && selected && selected.theme !== t) setSelected(null);
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-paper/95 to-transparent px-4 py-3">
        <Link href="/" className="pointer-events-auto font-display text-lg font-bold text-ink">
          ← 울산고래여지도
        </Link>
        <Link
          href="/recommend"
          className="pointer-events-auto rounded-[3px] border border-ink/25 bg-paper-light/80 px-3 py-2.5 text-sm font-semibold text-ink hover:bg-paper-light"
        >
          코스 추천
        </Link>
      </header>

      {/* 데스크톱 범례 */}
      <div className="absolute left-4 top-16 z-20 hidden md:block">
        <MapLegend spots={spots} active={active} onToggle={filterTheme} />
      </div>

      {/* 모바일 테마 칩 */}
      <div
        role="group"
        aria-label="고래 테마 필터"
        className="absolute inset-x-0 top-14 z-20 flex gap-2 overflow-x-auto px-4 py-1 md:hidden"
      >
        <ToggleButton active={active === null} tone="ink" onClick={() => filterTheme(null)}>
          전체 {spots.length}
        </ToggleButton>
        {THEME_ORDER.map((t) => (
          <ToggleButton
            key={t}
            active={active === t}
            tone="ink"
            color={themeColor(t)}
            onClick={() => filterTheme(active === t ? null : t)}
          >
            {WHALE_THEMES[t].label}
          </ToggleButton>
        ))}
      </div>

      {isLoading ? (
        <StatusScreen>
          <PetroglyphWhale className="h-16 w-auto animate-pulse opacity-40" />
          <p className="mt-4 text-ink-soft">여지도를 펼치는 중…</p>
        </StatusScreen>
      ) : isError ? (
        <StatusScreen>
          <p className="text-ink">지도를 불러오지 못했어요.</p>
          <button onClick={() => refetch()} className="mt-3 rounded-[3px] border border-ink/30 px-4 py-2 text-sm hover:bg-ink/5">
            다시 시도
          </button>
        </StatusScreen>
      ) : (
        <YeojidoMap spots={shown} selectedId={selected?.id ?? null} onSelect={setSelected} panelOpen={Boolean(selected)} />
      )}

      {selected && <SpotDetailPanel spot={selected} onClose={() => setSelected(null)} />}

      <div className="pointer-events-none absolute bottom-3 left-4 z-10">
        <SourceLabel />
      </div>
    </main>
  );
}

function StatusScreen({ children }: { children: React.ReactNode }) {
  return <div className="paper-grain flex h-full w-full flex-col items-center justify-center">{children}</div>;
}
