// 디자인 시스템 — 배지(알약형). tone으로 색을 정하고, dotColor로 점 표시.
// 텍스트는 대비를 위해 충분히 짙게 유지(자연 톤 등 옅은 색은 점으로만 표현).

type Tone = "neutral" | "seal" | "water" | "core";

const TONE: Record<Tone, string> = {
  neutral: "border-ink/20 bg-paper/50 text-ink-soft",
  seal: "border-seal/45 bg-seal/10 text-seal-deep",
  water: "border-water/45 bg-water/10 text-water",
  core: "border-seal/55 bg-seal/10 text-seal",
};

export function Badge({
  children,
  tone = "neutral",
  dotColor,
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  dotColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TONE[tone]} ${className}`}
    >
      {dotColor && <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />}
      {children}
    </span>
  );
}
