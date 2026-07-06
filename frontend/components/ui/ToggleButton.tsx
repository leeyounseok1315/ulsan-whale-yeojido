// 디자인 시스템 — 토글 버튼. 지도 필터(알약·다중)와 추천 위저드(블록·라디오)를 한 컴포넌트로.
// shape: pill | block, role: button(aria-pressed) | radio(aria-checked), tone: seal | ink

export function ToggleButton({
  active,
  onClick,
  children,
  color,
  shape = "pill",
  tone = "seal",
  role = "button",
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  shape?: "pill" | "block";
  tone?: "seal" | "ink";
  role?: "button" | "radio";
  ariaLabel?: string;
}) {
  const aria =
    role === "radio" ? { role: "radio", "aria-checked": active } : { "aria-pressed": active };
  const shapeCls =
    shape === "pill" ? "rounded-full px-3.5 py-2 text-[13px]" : "w-full rounded-[3px] px-3 py-3 text-sm";
  const activeCls = tone === "ink" ? "border-ink bg-ink text-paper-light" : "border-seal bg-seal text-paper-light";
  const idleCls = "border-ink/25 bg-paper-light/60 text-ink hover:border-ink/50";

  return (
    <button
      {...aria}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 border font-semibold transition-colors ${shapeCls} ${active ? activeCls : idleCls}`}
    >
      {color && <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {active && role === "radio" && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}
