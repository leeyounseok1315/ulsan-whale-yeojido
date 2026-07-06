// 디자인 시스템 — 카드. 한지 톤 위 먹선 테두리 면. (코스 타임라인·정보 블록 등)
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[4px] border border-ink/15 bg-paper-light/70 ${className}`}>{children}</div>
  );
}
