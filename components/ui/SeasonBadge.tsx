// 시즌 배지 — 고래바다여행선 운항/비운항 등 시기성 안내.

export function SeasonBadge({ open, label }: { open: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        open
          ? "border-water/40 bg-water/10 text-water"
          : "border-ink-faint/40 bg-ink-faint/10 text-ink-soft"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${open ? "bg-water" : "bg-ink-faint"}`}
      />
      {open ? `${label} 중` : `${label} 휴지기`}
    </span>
  );
}
