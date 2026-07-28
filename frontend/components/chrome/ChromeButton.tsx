import Link from "next/link";
import type { ReactNode } from "react";

// 베벨 버튼 (getdesign.md) — 따뜻한 색은 '방향 신호'로만.
//  primary(amber)=유틸/Go · submit(signal)=전진/제출 · secondary(carbon)=커맨드 슬랩
type Variant = "primary" | "submit" | "secondary";

const VARIANT: Record<Variant, string> = {
  primary: "bg-amber text-carbon wy-chip",
  submit: "bg-signal text-white wy-chip",
  secondary: "wy-carbon text-white wy-chip",
};

// 터치 타깃 44px 확보(현대 포트) + 실크스크린 레전드 라벨.
const BASE =
  "wy-legend inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] px-4 text-[13px] " +
  "transition-[filter,transform] hover:brightness-105 disabled:opacity-50 disabled:pointer-events-none";

export function ChromeButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: { variant?: Variant; className?: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ChromeLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}

// 원형 시그널 화살표 — 히어로/섹션 링크의 대표 '전진' 어포던스.
export function ArrowBadge({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`wy-chip inline-flex shrink-0 items-center justify-center rounded-full bg-signal text-white ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none">
        <path d="M8 4l10 8-10 8" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
