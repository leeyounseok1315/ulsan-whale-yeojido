// 중립 데이터 출처 표기 — 절대규칙 #1. 공사 명칭/로고 대신 '공공데이터'만 노출.

export function SourceLabel({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-ink-faint ${className}`}
    >
      <span aria-hidden className="inline-block h-1 w-1 rounded-full bg-ink-faint/70" />
      자료 · 공공데이터
    </span>
  );
}
