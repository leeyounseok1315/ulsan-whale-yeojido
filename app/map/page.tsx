"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { YeojidoMap } from "@/components/map/YeojidoMap";
import { MapLegend } from "@/components/map/MapLegend";
import { SpotDetailPanel } from "@/components/map/SpotDetailPanel";
import { PetroglyphWhale } from "@/components/ui/PetroglyphWhale";
import { SourceLabel } from "@/components/ui/SourceLabel";
import { THEME_ORDER, WHALE_THEMES, themeColor } from "@/lib/theme";
import type { WhaleSpot, WhaleThemeId } from "@/lib/types";

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
        <MapLegend spots={spots} active={active} onToggle={setActive} />
      </div>

      {/* 모바일 테마 칩 */}
      <div
        role="group"
        aria-label="고래 테마 필터"
        className="absolute inset-x-0 top-14 z-20 flex gap-2 overflow-x-auto px-4 py-1 md:hidden"
      >
        <Chip on={active === null} onClick={() => setActive(null)} label={`전체 ${spots.length}`} />
        {THEME_ORDER.map((t) => (
          <Chip
            key={t}
            on={active === t}
            color={themeColor(t)}
            onClick={() => setActive(active === t ? null : t)}
            label={WHALE_THEMES[t].label}
          />
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
        <YeojidoMap spots={shown} selectedId={selected?.id ?? null} onSelect={setSelected} />
      )}

      {selected && <SpotDetailPanel spot={selected} onClose={() => setSelected(null)} />}

      <div className="pointer-events-none absolute bottom-3 left-4 z-10">
        <SourceLabel />
      </div>
    </main>
  );
}

function Chip({ on, onClick, label, color }: { on: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        on ? "border-ink bg-ink text-paper-light" : "border-ink/25 bg-paper-light/85 text-ink"
      }`}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}

function StatusScreen({ children }: { children: React.ReactNode }) {
  return <div className="paper-grain flex h-full w-full flex-col items-center justify-center">{children}</div>;
}
