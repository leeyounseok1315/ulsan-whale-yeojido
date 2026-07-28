import type { ReactNode } from "react";

// 베벨 플레이트 — 콘솔 페이스플레이트의 기본 단위(getdesign.md).
// 배경 톤 + 위 하이라이트/아래 크롬-인디고 그림자선. chamfer로 45° 각진 모서리.
type Tone = "canvas" | "periwinkle" | "platinum" | "surface" | "lavender" | "ice" | "sky";

const TONE: Record<Tone, string> = {
  canvas: "bg-canvas text-ink",
  periwinkle: "bg-periwinkle text-ink",
  platinum: "bg-platinum text-ink",
  surface: "bg-white text-ink",
  lavender: "bg-lavender text-ink",
  ice: "bg-ice text-ink",
  sky: "bg-canvas-soft text-ink",
};

export function Plate({
  tone = "canvas",
  chamfer = false,
  inset = false,
  className = "",
  children,
}: {
  tone?: Tone;
  chamfer?: boolean;
  inset?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${inset ? "wy-inset" : "wy-plate"} ${TONE[tone]} ${chamfer ? "wy-chamfer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
