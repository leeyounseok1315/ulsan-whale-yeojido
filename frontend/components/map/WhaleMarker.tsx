import { themeColor } from "@/backend/lib/theme";
import type { WhaleSpot } from "@/backend/lib/types";
import { WHALE_BODY_PATH, WHALE_FIN_PATH } from "@/frontend/components/ui/PetroglyphWhale";

// 지도 위 고래 스팟 마커 — 인주 도장(낙관) 풍. 핵심 스팟은 사각 낙관 프레임을 두른다.
// k(현재 줌)의 역수로 카운터 스케일해 줌과 무관하게 일정 크기를 유지한다.
export function WhaleMarker({
  x,
  y,
  k,
  spot,
  selected,
  onSelect,
}: {
  x: number;
  y: number;
  k: number;
  spot: WhaleSpot;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = themeColor(spot.theme);
  const r = spot.isCore ? 17 : 13;
  const glyphScale = (r * 1.35) / 220;
  const labelW = spot.title.length * 12.5 + 16;

  return (
    <g transform={`translate(${x} ${y}) scale(${1 / k})`}>
      <g
        role="button"
        tabIndex={0}
        aria-label={`${spot.title} 상세 보기`}
        aria-pressed={selected}
        className="cursor-pointer outline-none"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <ellipse cx={0} cy={r + 3} rx={r * 0.8} ry={3} fill="var(--color-ink)" opacity={0.18} />

        {selected && <circle r={r + 9} fill="none" stroke="var(--color-seal)" strokeWidth={2.2} opacity={0.9} />}

        {spot.isCore && (
          <rect
            x={-r - 5}
            y={-r - 5}
            width={(r + 5) * 2}
            height={(r + 5) * 2}
            rx={3}
            fill="none"
            stroke="var(--color-seal)"
            strokeWidth={selected ? 2.4 : 1.5}
            opacity={0.85}
          />
        )}

        <circle r={r} fill={color} stroke="var(--color-ink)" strokeWidth={1.2} opacity={0.96} />

        {/* 고래 글리프 (도장 안) */}
        <g transform={`scale(${glyphScale}) translate(-110 -55)`} className="pointer-events-none">
          <path d={WHALE_BODY_PATH} fill="var(--color-paper-light)" />
          <path d={WHALE_FIN_PATH} fill="var(--color-paper-light)" />
        </g>

        {/* 라벨 */}
        <g transform={`translate(0 ${r + 7})`} className="pointer-events-none">
          <rect
            x={-labelW / 2}
            y={2}
            width={labelW}
            height={20}
            rx={3}
            fill="var(--color-paper-light)"
            stroke={spot.isCore ? "var(--color-seal)" : "var(--color-ink)"}
            strokeOpacity={spot.isCore ? 0.5 : 0.18}
            opacity={0.94}
          />
          <text
            x={0}
            y={16}
            textAnchor="middle"
            fontSize={13}
            fontFamily="var(--font-display)"
            fontWeight={spot.isCore ? "bold" : "normal"}
            fill="var(--color-ink)"
          >
            {spot.title}
          </text>
        </g>
      </g>
    </g>
  );
}
