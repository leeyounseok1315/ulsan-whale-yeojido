// 울산 여지도(고지도) 일러스트 — 목판 고지도 관습(먹선 해안·굽이 하천·층층 산줄기·물결 바다)을
// 손으로 새긴 SVG. 지리적 정밀도가 아니라 '고지도의 시선'이 목적. (절대규칙 #4: 지도 우선)
// 실 스팟 위치(projectToMap)에 맞춰 지형 배치: 서쪽 영남알프스 · 북서 반구대 · 중앙 태화강 ·
// 동남 장생포 만 · 동쪽 바다(귀신고래 회유). 콘솔-크롬 해도 팔레트.

export const MAP_W = 1000;
export const MAP_H = 760;

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

// 해안선/육지 경계 — 우측에 울산만·장생포 만(灣) 노치. 육지는 이 선의 왼쪽.
const COAST =
  "M60 66 L716 52 C 742 140, 726 232, 748 318 C 756 352, 742 366, 720 372 " +
  "C 742 392, 762 420, 748 452 C 738 476, 712 470, 700 486 " +
  "C 720 506, 754 528, 748 604 C 745 650, 738 686, 750 706 L 60 716 Z";

function ridge(x: number, y: number, n: number, w: number, h: number): string {
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` l${w / 2} ${-h} l${w / 2} ${h}`;
  return d;
}
function peak(x: number, y: number, w: number, h: number): string {
  return `M${x} ${y} L${x + w * 0.5} ${y - h} L${x + w} ${y} Z`;
}
function tree(x: number, y: number, s: number): string {
  return `M${x} ${y} l${-s * 0.6} ${s} l${s * 0.35} 0 l${-s * 0.5} ${s * 0.8} l${s * 0.75} 0 l${-s * 0.5} ${s * 0.8} l${s * 1.3} 0 l${-s * 0.5} ${-s * 0.8} l${s * 0.75} 0 l${-s * 0.5} ${-s * 0.8} l${s * 0.35} 0 Z`;
}
function waveRow(y: number, x0: number, x1: number): string {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += 40) d += ` q10 -9 20 0 q10 9 20 0`;
  return d;
}

const TREES: [number, number, number][] = [
  [175, 300, 9], [210, 335, 8], [150, 360, 8], [255, 300, 9], [300, 350, 8],
  [235, 420, 8], [190, 455, 9], [330, 300, 8], [360, 250, 9], [300, 235, 8],
  [470, 330, 8], [520, 300, 9], [430, 470, 8], [500, 500, 9], [560, 470, 8],
  [250, 520, 8], [320, 540, 9], [180, 540, 8], [420, 560, 8], [600, 560, 9],
  [140, 470, 8], [560, 350, 8], [640, 470, 9],
];
const WAVE_ROWS = Array.from({ length: 13 }, (_, i) => 120 + i * 46);

export function UlsanBaseMap() {
  return (
    <>
      <defs>
        <linearGradient id="wy-sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ba1d4" />
          <stop offset="1" stopColor="#5f7bb0" />
        </linearGradient>
        <linearGradient id="wy-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6cdec" />
          <stop offset="1" stopColor="#9fbee7" />
        </linearGradient>
      </defs>

      {/* ── 바다(동해) ── */}
      <path d={COAST.replace("Z", "") + " L1000 706 L1000 66 Z"} fill="url(#wy-sea)" opacity={0.5} />
      <g stroke="var(--color-teal)" strokeWidth={1.4} opacity={0.34} fill="none" strokeLinecap="round">
        {WAVE_ROWS.map((y) => (
          <path key={y} d={waveRow(y, 770, 985)} />
        ))}
      </g>
      <g fill="var(--color-canvas-soft)" stroke="var(--color-carbon)" strokeWidth={1.4} opacity={0.6}>
        <path d="M905 250 q14 -10 28 0 q6 8 -4 12 q-14 5 -26 -2 q-6 -5 2 -10 Z" />
        <path d="M860 610 q10 -7 20 0 q4 6 -3 9 q-10 4 -19 -1 q-4 -4 2 -8 Z" />
      </g>

      {/* ── 육지 ── */}
      <path d={COAST} fill="url(#wy-land)" />

      {/* 영남알프스 — 서쪽 층층 산줄기 */}
      <g strokeLinejoin="round">
        <g fill="var(--color-chrome)" opacity={0.5} stroke="var(--color-carbon)" strokeWidth={1.2}>
          <path d={peak(90, 360, 90, 62)} />
          <path d={peak(150, 340, 100, 78)} />
          <path d={peak(230, 366, 96, 66)} />
          <path d={peak(300, 348, 84, 58)} />
        </g>
        <g fill="var(--color-mutedindigo)" opacity={0.85} stroke="var(--color-carbon)" strokeWidth={1.4}>
          <path d={peak(110, 430, 96, 70)} />
          <path d={peak(180, 452, 110, 84)} />
          <path d={peak(270, 440, 92, 64)} />
        </g>
        <g fill="none" stroke="var(--color-carbon)" strokeWidth={1.3} opacity={0.4}>
          <path d={ridge(120, 300, 5, 34, 20)} />
          <path d={ridge(240, 280, 4, 30, 18)} />
        </g>
      </g>

      {/* 반구대 암각화 — 절벽 바위(북서) */}
      <g transform="translate(372 250)" stroke="var(--color-carbon)" strokeWidth={1.6} strokeLinejoin="round">
        <path d="M0 40 L6 4 L26 0 L44 8 L58 2 L66 34 L60 52 L10 56 Z" fill="var(--color-mutedindigo)" opacity={0.85} />
        <g stroke="var(--color-carbon)" strokeWidth={1.1} opacity={0.55} fill="none">
          <path d="M14 18 q6 -4 12 0" />
          <path d="M34 14 q6 4 12 0" />
          <path d="M20 34 q8 -3 16 2" />
        </g>
      </g>

      {/* 숲 */}
      <g fill="var(--color-teal)" opacity={0.42}>
        {TREES.map(([x, y, s], i) => (
          <path key={i} d={tree(x, y, s)} />
        ))}
      </g>

      {/* 태화강 — 서쪽 산에서 중앙을 지나 장생포 하구로 + 지류(반구대) */}
      <g fill="none" stroke="var(--color-teal)" strokeLinecap="round">
        <path d="M150 470 C 260 452, 360 470, 460 430 C 540 398, 600 402, 660 400 C 700 398, 726 420, 738 452" strokeWidth={7} opacity={0.5} />
        <path d="M150 470 C 260 452, 360 470, 460 430 C 540 398, 600 402, 660 400 C 700 398, 726 420, 738 452" strokeWidth={3} opacity={0.7} />
        <path d="M452 434 C 440 380, 424 330, 406 292" strokeWidth={3.4} opacity={0.5} />
      </g>
      <g fill="var(--color-teal)" opacity={0.4}>
        {[480, 510, 540, 570, 600, 630].map((x, i) => (
          <circle key={i} cx={x} cy={412 - (i % 2) * 6} r={2.4} />
        ))}
      </g>

      {/* 장생포 만 — 작은 배 */}
      <g stroke="var(--color-carbon)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
        <g fill="var(--color-canvas-soft)">
          <path d="M772 486 l30 0 l-6 12 l-18 0 Z" />
          <path d="M812 470 l26 0 l-5 10 l-16 0 Z" />
        </g>
        <path d="M786 486 l0 -14" opacity={0.7} />
        <path d="M824 470 l0 -12" opacity={0.7} />
      </g>

      {/* 바다의 고래(시그니처) + 물기둥 — 클러스터 마커와 겹치지 않게 바다 아래쪽 열린 물로 */}
      <g transform="translate(800 585) scale(0.92)" strokeLinejoin="round">
        <g stroke="var(--color-teal)" strokeWidth={3} strokeLinecap="round" opacity={0.7} fill="none">
          <path d="M40 -18 C 36 -34, 34 -42, 40 -54" />
          <path d="M52 -18 C 52 -32, 56 -40, 62 -50" />
        </g>
        <path d="M8 -2 C 40 -30, 120 -34, 168 -18 C 150 -8, 150 12, 168 22 C 120 40, 40 34, 8 6 C 2 3, 2 1, 8 -2 Z" fill="var(--color-chrome)" stroke="var(--color-carbon)" strokeWidth={2.2} opacity={0.9} />
        <path d="M164 -16 C 188 -30, 202 -28, 210 -38 C 206 -14, 206 20, 210 40 C 202 26, 188 26, 164 20 Z" fill="var(--color-chrome)" stroke="var(--color-carbon)" strokeWidth={2.2} opacity={0.9} />
        <path d="M28 14 C 60 30, 118 30, 150 16" fill="none" stroke="var(--color-carbon)" strokeWidth={1.4} opacity={0.5} />
        <circle cx={34} cy={-4} r={3.4} fill="var(--color-carbon)" />
      </g>

      {/* '고래의 길' 점선 옛길 */}
      <g fill="none" stroke="var(--color-carbon)" strokeWidth={1.8} strokeLinecap="round" strokeDasharray="1 9" opacity={0.4}>
        <path d="M405 292 C 480 320, 560 350, 611 387 C 660 420, 720 452, 770 476" />
      </g>

      {/* 외곽 카르투슈(쌍선) */}
      <rect x={22} y={22} width={MAP_W - 44} height={MAP_H - 44} fill="none" stroke="var(--color-carbon)" strokeWidth={2} opacity={0.55} />
      <rect x={32} y={32} width={MAP_W - 64} height={MAP_H - 64} fill="none" stroke="var(--color-carbon)" strokeWidth={0.9} opacity={0.4} />

      {/* 나침반(동북 바다) */}
      <g transform="translate(892 128)" opacity={0.75}>
        <circle r={26} fill="var(--color-canvas-soft)" stroke="var(--color-carbon)" strokeWidth={1.4} />
        <path d="M0 -30 L6 0 L0 30 L-6 0 Z" fill="var(--color-signal)" stroke="var(--color-carbon)" strokeWidth={1} />
        <path d="M-30 0 L0 6 L30 0 L0 -6 Z" fill="var(--color-canvas-soft)" stroke="var(--color-carbon)" strokeWidth={1} />
        <text x={0} y={-32} textAnchor="middle" fontSize={13} fill="var(--color-carbon)" fontFamily="var(--font-display)">北</text>
      </g>

      {/* 제목 카르투슈(남서 육지) */}
      <g transform="translate(96 636)">
        <rect x={0} y={0} width={150} height={54} rx={2} fill="var(--color-canvas-soft)" stroke="var(--color-carbon)" strokeWidth={1.5} opacity={0.92} />
        <rect x={5} y={5} width={140} height={44} rx={1} fill="none" stroke="var(--color-carbon)" strokeWidth={0.7} opacity={0.5} />
        <text x={75} y={26} textAnchor="middle" fontSize={17} fill="var(--color-carbon)" fontFamily="var(--font-display)">蔚山鯨圖</text>
        <text x={75} y={42} textAnchor="middle" fontSize={10} fill="var(--color-carbon)" fontFamily="var(--font-body)" fontWeight={700} letterSpacing="2">고래의 길</text>
      </g>

      {/* 구름 */}
      <g fill="var(--color-canvas-soft)" opacity={0.5}>
        <path d="M120 130 q10 -12 26 -6 q10 -10 24 0 q14 -2 14 10 q0 8 -14 8 l-42 0 q-12 0 -8 -12 Z" />
        <path d="M560 120 q9 -10 22 -5 q9 -8 20 0 q12 -2 12 8 q0 7 -12 7 l-36 0 q-10 0 -6 -10 Z" />
      </g>
    </>
  );
}
