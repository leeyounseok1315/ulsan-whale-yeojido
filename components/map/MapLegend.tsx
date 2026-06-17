"use client";

import { THEME_ORDER, WHALE_THEMES, themeColor } from "@/lib/theme";
import type { WhaleSpot, WhaleThemeId } from "@/lib/types";

// 범례 카르투슈 — 고래 테마(행정구역 아님)로 묶은 분류. 클릭하면 해당 테마만 본다.
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
    <div className="w-[208px] rounded-[3px] border border-ink/25 bg-paper-light/92 p-3 shadow-md backdrop-blur-sm">
      <div className="mb-2 flex items-baseline justify-between border-b border-ink/15 pb-1.5">
        <span className="font-display text-sm font-bold text-ink">범례 · 고래 테마</span>
        <button
          onClick={() => onToggle(null)}
          aria-pressed={active === null}
          className={`text-[11px] underline-offset-2 hover:underline ${active === null ? "font-semibold text-seal" : "text-ink-faint"}`}
        >
          전체 {spots.length}
        </button>
      </div>
      <ul className="space-y-0.5">
        {THEME_ORDER.map((t) => {
          const th = WHALE_THEMES[t];
          const isActive = active === t;
          return (
            <li key={t}>
              <button
                onClick={() => onToggle(isActive ? null : t)}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-2 rounded-[2px] px-1.5 py-1 text-left transition-colors hover:bg-ink/5 ${
                  active && !isActive ? "opacity-45" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full border border-ink/30"
                  style={{ backgroundColor: themeColor(t) }}
                />
                <span className="flex-1 text-[13px] text-ink">{th.label}</span>
                <span className="font-mono text-[11px] text-ink-faint">{count(t)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 border-t border-ink/15 pt-1.5 text-[10.5px] leading-snug text-ink-faint">
        구·군이 아닌 고래의 길로 묶었어요.
      </p>
    </div>
  );
}
