// 여지도(고지도) 톤의 울산 베이스 지도 — 목판 인쇄 관습(먹선 해안·쌍선 하천·톱니 산줄기)을
// 손으로 새긴 SVG. 지리적 정밀도가 아니라 '고지도의 시선'이 목적. (절대규칙 #4: 지도 우선)
// W2에서 MapLibre/카카오맵 평가 시, 좌표 투영(projectToMap)만 교체하면 마커 레이어는 유지된다.

export const MAP_W = 1000;
export const MAP_H = 760;

// 울산 대략 bbox → viewBox 선형 투영. 실데이터(mapx/mapy)도 동일 규칙으로 배치된다.
const LON0 = 129.0;
const LON1 = 129.45;
const LAT0 = 35.4;
const LAT1 = 35.7;
const X0 = 80;
const X1 = 900;
const Y0 = 90;
const Y1 = 680;

export function projectToMap(lon: number, lat: number): { x: number; y: number } {
  const x = X0 + ((lon - LON0) / (LON1 - LON0)) * (X1 - X0);
  const y = Y0 + ((LAT1 - lat) / (LAT1 - LAT0)) * (Y1 - Y0);
  return {
    x: Math.max(40, Math.min(MAP_W - 40, x)),
    y: Math.max(40, Math.min(MAP_H - 40, y)),
  };
}

function ridge(x: number, y: number, n: number, w: number, h: number): string {
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` l${w / 2} ${-h} l${w / 2} ${h}`;
  return d;
}

export function UlsanBaseMap() {
  const waves = Array.from({ length: 11 }, (_, i) => 150 + i * 46);

  return (
    <>
      {/* 바다(동해) — 쪽빛 톤 + 잔물결 */}
      <path d="M735 60 C760 200 745 360 770 520 C760 620 775 680 760 720 L1000 720 L1000 60 Z" fill="var(--color-teal)" opacity="0.16" />
      <g stroke="var(--color-teal)" strokeWidth="1.5" opacity="0.28" fill="none" strokeLinecap="round">
        {waves.map((y) => (
          <path key={y} d={`M820 ${y} q20 -8 40 0 q20 8 40 0 q20 -8 40 0`} />
        ))}
      </g>

      {/* 육지 — 한지보다 살짝 짙은 톤 */}
      <path
        d="M80 90 L735 60 C760 200 745 360 770 520 C760 620 775 680 760 720 L80 700 Z"
        fill="var(--color-canvas-soft)"
        opacity="0.8"
      />

      {/* 해안선 (먹선) + 장생포 만(灣) 노치 */}
      <path
        d="M735 60 C760 200 745 360 768 470 C772 500 760 512 742 516 C726 520 720 532 730 548 C748 575 770 600 760 720"
        fill="none"
        stroke="var(--color-carbon)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* 태화강 — 쌍선 하천 */}
      <g fill="none" stroke="var(--color-teal)" strokeLinecap="round">
        <path d="M150 430 C300 405 460 430 600 405 C660 396 710 410 742 430" strokeWidth="3.4" opacity="0.55" />
        <path d="M150 446 C300 421 460 446 600 421 C660 412 710 426 742 446" strokeWidth="2" opacity="0.35" />
      </g>

      {/* 영남알프스 — 톱니 산줄기 (서쪽) */}
      <g fill="none" stroke="var(--color-chrome)" strokeWidth="2" strokeLinejoin="round" opacity="0.6">
        <path d={ridge(110, 360, 6, 34, 26)} />
        <path d={ridge(125, 410, 5, 38, 30)} />
        <path d={ridge(140, 470, 4, 34, 22)} />
        <path d={ridge(220, 300, 4, 30, 20)} opacity={0.8} />
      </g>

      {/* 외곽 카르투슈 테두리 (쌍선) */}
      <rect x="20" y="20" width={MAP_W - 40} height={MAP_H - 40} fill="none" stroke="var(--color-carbon)" strokeWidth="1.6" opacity="0.5" />
      <rect x="30" y="30" width={MAP_W - 60} height={MAP_H - 60} fill="none" stroke="var(--color-carbon)" strokeWidth="0.8" opacity="0.35" />

      {/* 방위표 (좌상) */}
      <g transform="translate(78 110)" stroke="var(--color-carbon)" strokeWidth="1.4" fill="none" opacity="0.55">
        <circle r="16" />
        <path d="M0 -22 L4 0 L0 22 L-4 0 Z" fill="var(--color-signal)" stroke="none" opacity="0.85" />
        <text x="0" y="-26" textAnchor="middle" fontSize="13" fill="var(--color-carbon)" stroke="none" fontFamily="var(--font-display)">北</text>
      </g>
    </>
  );
}
