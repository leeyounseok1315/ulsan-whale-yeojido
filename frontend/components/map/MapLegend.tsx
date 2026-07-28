"use client";

import { Plate } from "@/frontend/components/chrome/Plate";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";
import { THEME_ORDER, WHALE_THEMES, themeColor } from "@/backend/lib/theme";
import type { WhaleSpot, WhaleThemeId } from "@/backend/lib/types";

// 범례 — 고래 테마(행정구역 아님)로 묶은 분류. 클릭하면 해당 테마만.
export function MapLegend({
  spots,
  active,
  onToggle,
}: {
  spots: WhaleSpot[];
  active: WhaleThemeId | null;
  onToggle: (t: WhaleThemeId | null) => void;
}) {
  const count = (t: WhaleThemeId) => spots.filter((s) => s.theme === t).length;

  return (
    <div className="w-[210px]">
      <SectionLabelBar
        title="범례 · 고래 테마"
        right={
          <button
            onClick={() => onToggle(null)}
            aria-pressed={active === null}
            className={`wy-legend text-[10px] ${active === null ? "text-signal" : "text-carbon/60 hover:text-carbon"}`}
          >
            전체 {spots.length}
          </button>
        }
      />
      <Plate tone="canvas" className="mt-1 p-1.5">
        <ul className="space-y-0.5">
          {THEME_ORDER.map((t) => {
            const th = WHALE_THEMES[t];
            const isActive = active === t;
            return (
              <li key={t}>
                <button
                  onClick={() => onToggle(isActive ? null : t)}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-2 rounded-[2px] px-1.5 py-1.5 text-left transition ${
                    isActive ? "wy-carbon text-white" : "hover:bg-white/30"
                  } ${active && !isActive ? "opacity-50" : ""}`}
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full border border-carbon/40"
                    style={{ backgroundColor: themeColor(t) }}
                  />
                  <span className={`flex-1 text-[12px] font-semibold ${isActive ? "text-white" : "text-ink"}`}>{th.label}</span>
                  <span className={`font-mono text-[11px] ${isActive ? "text-white/80" : "text-carbon/60"}`}>{count(t)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="wy-dotline mt-1.5 px-1 pt-1.5 text-[10px] leading-snug text-carbon/70">
          구·군이 아닌 고래의 길로 묶었어요.
        </p>
      </Plate>
    </div>
  );
}
