// 디자인 시스템 — 패널(카르투슈/첩 框). 제목 띠 + 본문. (범례·상세 등 떠 있는 박스)
export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "p-3",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`rounded-[3px] border border-ink/25 bg-paper-light/92 shadow-md backdrop-blur-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-baseline justify-between gap-2 border-b border-ink/15 px-3 py-1.5">
          {title && <span className="font-display text-sm font-bold text-ink">{title}</span>}
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
