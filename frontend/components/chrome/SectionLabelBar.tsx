import type { ReactNode } from "react";

// 패널 헤더 스트립 (getdesign.md) — 캔버스 헤더 + 그리드 글리프 + 대문자 라벨.
// 모든 콘텐츠 모듈을 이 바가 캡한다.
export function SectionLabelBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="wy-chip flex items-center gap-2 bg-canvas px-3 py-1.5">
      <span aria-hidden className="grid grid-cols-2 gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-[5px] w-[5px] bg-carbon/70" />
        ))}
      </span>
      <span className="wy-legend text-[11px] text-carbon">{title}</span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}
