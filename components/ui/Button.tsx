import Link from "next/link";
import type { ComponentProps } from "react";

// 여지도 톤 버튼 — primary는 인주(印朱) 도장 느낌, secondary는 먹선 테두리.

const base =
  "inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-3 text-sm font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-seal text-paper-light shadow-[0_2px_0_var(--color-seal-deep)] hover:bg-seal-deep",
  secondary: "border border-ink/30 bg-paper-light/60 text-ink hover:border-ink/60 hover:bg-paper-light",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5",
} as const;

type Variant = keyof typeof variants;

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
