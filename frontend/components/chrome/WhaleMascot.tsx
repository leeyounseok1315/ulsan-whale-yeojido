// 울산고래여지도 마스코트 — 반구대 고래를 게임 마스코트풍(통통·굵은 아웃라인·큰 눈)으로.
// 우리 오리지널 캐릭터(닌텐도 캐릭터 미사용). 히어로·상세·빈 상태에서 브랜드 개성 담당.
export function WhaleMascot({
  className = "",
  animate = false,
  title = "고래",
}: {
  className?: string;
  animate?: boolean;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 240 200" className={`${className} ${animate ? "wy-swim" : ""}`} role="img" aria-label={title}>
      {/* 물기둥 */}
      <g stroke="var(--color-carbon)" strokeWidth={5} strokeLinecap="round">
        <path d="M96 46 C 92 30, 90 24, 96 14" fill="none" />
        <path d="M112 46 C 112 28, 116 22, 122 16" fill="none" />
        <path d="M104 44 C 104 26, 104 20, 104 10" fill="none" />
      </g>

      {/* 꼬리 지느러미 */}
      <path
        d="M188 96 C 214 70, 230 72, 236 60 C 232 92, 232 104, 236 136 C 230 124, 214 126, 188 100 Z"
        fill="var(--color-chrome)"
        stroke="var(--color-carbon)"
        strokeWidth={6}
        strokeLinejoin="round"
      />

      {/* 몸통 */}
      <path
        d="M118 52 C 66 52, 30 78, 30 108 C 30 140, 70 162, 118 162 C 158 162, 196 140, 196 108 C 196 78, 162 52, 118 52 Z"
        fill="var(--color-periwinkle)"
        stroke="var(--color-carbon)"
        strokeWidth={6}
        strokeLinejoin="round"
      />

      {/* 배(흰 무늬) */}
      <path
        d="M60 132 C 78 156, 150 158, 176 132 C 168 150, 138 160, 116 160 C 92 160, 70 150, 60 132 Z"
        fill="#eef2fb"
      />

      {/* 옆 지느러미 */}
      <path
        d="M96 150 C 92 172, 108 176, 122 168 C 116 160, 106 156, 96 150 Z"
        fill="var(--color-chrome)"
        stroke="var(--color-carbon)"
        strokeWidth={5}
        strokeLinejoin="round"
      />

      {/* 볼 홍조 */}
      <ellipse cx="58" cy="120" rx="10" ry="7" fill="#f6a6a0" opacity="0.85" />

      {/* 눈 */}
      <circle cx="72" cy="98" r="17" fill="#fff" stroke="var(--color-carbon)" strokeWidth={5} />
      <circle cx="76" cy="100" r="8.5" fill="var(--color-carbon)" />
      <circle cx="72.5" cy="96" r="3" fill="#fff" />

      {/* 미소 */}
      <path d="M52 118 C 60 130, 76 130, 84 122" fill="none" stroke="var(--color-carbon)" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}
