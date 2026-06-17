// 반구대 암각화에서 끌어온 고래 라인아트 — 서비스의 시그니처 모티프.
// animate=true면 잉크가 새겨지듯 선이 그려진다(stroke-dashoffset).

export function PetroglyphWhale({
  className,
  animate = false,
  stroke = "var(--color-ink)",
  strokeWidth = 2.5,
}: {
  className?: string;
  animate?: boolean;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 220 110" fill="none" className={className} aria-hidden="true">
      <g
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "wy-draw" : undefined}
      >
        {/* 몸통 */}
        <path
          pathLength={1}
          d="M196 55 C190 36 158 22 110 22 C66 22 28 30 16 50 C12 58 16 66 28 70 C44 75 78 80 116 79 C152 78 184 70 196 55 Z"
        />
        {/* 꼬리지느러미 */}
        <path pathLength={1} d="M196 55 C204 46 214 40 219 35 M196 55 C206 63 214 71 218 78" />
        {/* 가슴지느러미 */}
        <path pathLength={1} d="M86 78 C84 90 92 99 104 100" />
        {/* 입선 */}
        <path pathLength={1} d="M16 50 C30 54 44 55 60 55" />
        {/* 등의 새김선 */}
        <path pathLength={1} d="M150 33 L150 70 M126 29 L126 74 M102 29 L102 76" opacity="0.45" />
      </g>
      {/* 눈 */}
      <circle cx="34" cy="44" r="2.6" fill={stroke} />
    </svg>
  );
}

// 채움형 고래 글리프 path (마커 등에서 공유). 한 곳에서만 정의해 어긋남을 막는다.
export const WHALE_BODY_PATH =
  "M196 55 C190 36 158 22 110 22 C66 22 28 30 16 50 C12 58 16 66 28 70 C44 75 78 80 116 79 C152 78 184 70 196 55 C204 46 214 40 219 35 C214 48 212 52 210 55 C212 60 214 66 218 78 C210 70 204 63 196 55 Z";
export const WHALE_FIN_PATH = "M86 78 C84 90 92 99 104 100 C96 92 92 86 92 78 Z";
