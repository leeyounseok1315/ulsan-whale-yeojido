import type { ReactNode } from "react";

// 폼 선택 칩 (getdesign.md) — 선택 시 카본 슬랩(눌린 상태), 비선택 시 페일-스카이.
// 터치 타깃 44px 확보.
export function ToggleChip({
  active,
  className = "",
  children,
  ...rest
}: { active: boolean; className?: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-pressed={active}
      className={`wy-chip wy-legend inline-flex min-h-11 items-center justify-center rounded-[2px] px-3 text-[12px] transition-colors ${
        active ? "wy-carbon text-white" : "bg-canvas-soft text-carbon hover:brightness-[1.03]"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
