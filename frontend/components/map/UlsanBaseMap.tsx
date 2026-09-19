// 울산고래여지도 — Modern Ocean Map
// 실제 스팟 좌표 투영(projectToMap)은 그대로 유지하고,
// 지도 비주얼만 현대적인 관광지도 + 고래/바다 감성으로 표현합니다.

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

export function projectToMap(
  lon: number,
  lat: number,
): { x: number; y: number } {
  const x =
    X0 +
    ((lon - LON0) / (LON1 - LON0)) *
    (X1 - X0);

  const y =
    Y0 +
    ((LAT1 - lat) / (LAT1 - LAT0)) *
    (Y1 - Y0);

  return {
    x: Math.max(
      40,
      Math.min(MAP_W - 40, x),
    ),
    y: Math.max(
      40,
      Math.min(MAP_H - 40, y),
    ),
  };
}

/*
 * 울산 해안선
 * 실제 관광지 좌표와 기존 지도 배치를 유지하기 위해
 * 형태와 위치는 기존 지도와 동일한 기준을 사용합니다.
 */
const COAST =
  "M60 66 L716 52 " +
  "C742 140 726 232 748 318 " +
  "C756 352 742 366 720 372 " +
  "C742 392 762 420 748 452 " +
  "C738 476 712 470 700 486 " +
  "C720 506 754 528 748 604 " +
  "C745 650 738 686 750 706 " +
  "L60 716 Z";

function peak(
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  return `
    M${x} ${y}
    L${x + w * 0.5} ${y - h}
    L${x + w} ${y}
    Z
  `;
}

function tree(
  x: number,
  y: number,
  s: number,
): string {
  return `
    M${x} ${y}
    l${-s * 0.55} ${s}
    l${s * 0.34} 0
    l${-s * 0.42} ${s * 0.72}
    l${s * 0.63} 0
    l${-s * 0.34} ${s * 0.66}
    l${s * 1.08} 0
    l${-s * 0.34} ${-s * 0.66}
    l${s * 0.63} 0
    l${-s * 0.42} ${-s * 0.72}
    l${s * 0.34} 0
    Z
  `;
}

function waveRow(
  y: number,
  x0: number,
  x1: number,
): string {
  let d = `M${x0} ${y}`;

  for (
    let x = x0;
    x < x1;
    x += 48
  ) {
    d +=
      " q12 -8 24 0 q12 8 24 0";
  }

  return d;
}

const TREES: [
  number,
  number,
  number,
][] = [
    [175, 300, 9],
    [210, 335, 8],
    [150, 360, 8],
    [255, 300, 9],
    [300, 350, 8],
    [235, 420, 8],
    [190, 455, 9],
    [330, 300, 8],
    [360, 250, 9],
    [300, 235, 8],
    [470, 330, 8],
    [520, 300, 9],
    [430, 470, 8],
    [500, 500, 9],
    [560, 470, 8],
    [250, 520, 8],
    [320, 540, 9],
    [180, 540, 8],
    [420, 560, 8],
    [600, 560, 9],
    [140, 470, 8],
    [560, 350, 8],
    [640, 470, 9],
    [105, 285, 8],
    [130, 325, 7],
    [190, 270, 7],
    [235, 275, 7],
    [285, 285, 8],
    [335, 325, 7],

    [110, 395, 7],
    [155, 410, 8],
    [215, 390, 7],
    [265, 405, 8],
    [315, 390, 7],
    [365, 405, 7],

    [115, 505, 8],
    [165, 500, 7],
    [220, 485, 8],
    [275, 500, 7],
    [345, 490, 8],

    [380, 335, 7],
    [410, 370, 7],
    [450, 320, 7],
    [495, 345, 7],
    [545, 325, 7],

    [390, 520, 7],
    [455, 535, 7],
    [525, 545, 7],
    [590, 525, 7],
  ];

const WAVE_ROWS =
  Array.from(
    { length: 12 },
    (_, i) => 105 + i * 50,
  );

const ROAD_PATHS = [
  "M120 520 C220 500 320 510 410 480 C510 445 600 440 690 455",
  "M180 570 C260 530 350 520 450 525 C540 530 615 500 685 475",
  "M250 240 C310 290 355 350 390 430",
  "M350 200 C410 250 470 300 535 350",
  "M470 260 C540 300 600 335 680 360",
];

const WALK_PATHS = [
  "M150 490 C250 475 330 480 430 450 C520 420 610 418 700 430",
  "M525 390 C560 370 610 360 660 365",
];

const CITY_BLOCKS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
}> = [
    { x: 430, y: 365, w: 34, h: 22, r: 5 },
    { x: 470, y: 350, w: 40, h: 25, r: 5 },
    { x: 520, y: 372, w: 32, h: 20, r: 5 },
    { x: 555, y: 345, w: 42, h: 27, r: 6 },
    { x: 605, y: 372, w: 36, h: 23, r: 5 },
    { x: 640, y: 338, w: 30, h: 20, r: 5 },

    { x: 460, y: 440, w: 40, h: 24, r: 5 },
    { x: 510, y: 430, w: 34, h: 22, r: 5 },
    { x: 555, y: 455, w: 45, h: 25, r: 6 },
    { x: 610, y: 445, w: 36, h: 22, r: 5 },
  ];

const PARK_AREAS = [
  {
    cx: 505,
    cy: 455,
    rx: 42,
    ry: 26,
  },
  {
    cx: 575,
    cy: 410,
    rx: 36,
    ry: 23,
  },
  {
    cx: 635,
    cy: 505,
    rx: 34,
    ry: 22,
  },
];

const BRIDGES = [
  {
    x1: 360,
    y1: 455,
    x2: 375,
    y2: 442,
  },
  {
    x1: 500,
    y1: 420,
    x2: 518,
    y2: 412,
  },
  {
    x1: 620,
    y1: 401,
    x2: 640,
    y2: 401,
  },
];

const MAP_LABELS = [
  {
    x: 185,
    y: 270,
    text: "영남알프스",
  },
  {
    x: 520,
    y: 392,
    text: "태화강",
  },
  {
    x: 705,
    y: 510,
    text: "울산만",
  },
  {
    x: 865,
    y: 370,
    text: "동해",
  },
];

export function UlsanBaseMap() {
  return (
    <>
      <defs>
        {/* 전체 지도 배경 */}
        <linearGradient
          id="wy-map-bg"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0"
            stopColor="#eaf8f5"
          />
          <stop
            offset="0.48"
            stopColor="#e7f6fb"
          />
          <stop
            offset="1"
            stopColor="#d9efff"
          />
        </linearGradient>

        {/* 바다 */}
        <linearGradient
          id="wy-sea-modern"
          x1="0"
          y1="0"
          x2="0.9"
          y2="1"
        >
          <stop
            offset="0"
            stopColor="#82d9e6"
          />
          <stop
            offset="0.55"
            stopColor="#63c4e4"
          />
          <stop
            offset="1"
            stopColor="#49a5dc"
          />
        </linearGradient>

        {/* 육지 */}
        <linearGradient
          id="wy-land-modern"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0"
            stopColor="#e2f4dd"
          />
          <stop
            offset="0.55"
            stopColor="#d5efde"
          />
          <stop
            offset="1"
            stopColor="#c8e8df"
          />
        </linearGradient>

        {/* 산 */}
        <linearGradient
          id="wy-mountain"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            stopColor="#8fc8bd"
          />
          <stop
            offset="1"
            stopColor="#72b2ac"
          />
        </linearGradient>

        {/* 바다 글로우 */}
        <radialGradient
          id="wy-sea-glow"
          cx="0.78"
          cy="0.45"
          r="0.65"
        >
          <stop
            offset="0"
            stopColor="#ffffff"
            stopOpacity="0.22"
          />
          <stop
            offset="1"
            stopColor="#ffffff"
            stopOpacity="0"
          />
        </radialGradient>

        <filter
          id="wy-soft-shadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="8"
            floodColor="#286b98"
            floodOpacity="0.12"
          />
        </filter>
      </defs>

      {/* ─────────────────────────────
          전체 배경
         ───────────────────────────── */}
      <rect
        width={MAP_W}
        height={MAP_H}
        fill="url(#wy-map-bg)"
      />

      {/* ─────────────────────────────
          바다
         ───────────────────────────── */}
      <path
        d={
          COAST.replace("Z", "") +
          " L1000 706 L1000 66 Z"
        }
        fill="url(#wy-sea-modern)"
      />

      <path
        d={
          COAST.replace("Z", "") +
          " L1000 706 L1000 66 Z"
        }
        fill="url(#wy-sea-glow)"
      />

      {/* 부드러운 파도 */}
      <g
        stroke="#ffffff"
        strokeWidth={1.5}
        opacity={0.27}
        fill="none"
        strokeLinecap="round"
      >
        {WAVE_ROWS.map((y) => (
          <path
            key={y}
            d={waveRow(
              y,
              765,
              1000,
            )}
          />
        ))}
      </g>

      {/* 작은 섬 */}
      <g
        fill="#dff3e9"
        stroke="#7fb5bd"
        strokeWidth={1.2}
        opacity={0.95}
      >
        <path d="M905 250 q14 -10 28 0 q6 8 -4 12 q-14 5 -26 -2 q-6 -5 2 -10 Z" />

        <path d="M860 610 q10 -7 20 0 q4 6 -3 9 q-10 4 -19 -1 q-4 -4 2 -8 Z" />
      </g>

      {/* ─────────────────────────────
          육지
         ───────────────────────────── */}
      <path
        d={COAST}
        fill="url(#wy-land-modern)"
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinejoin="round"
      />

      {/* 육지 내부 은은한 빛 */}
      <path
        d={COAST}
        fill="none"
        stroke="#a8d6d0"
        strokeWidth={1.3}
        opacity={0.6}
      />

      {/* ─────────────────────────────
          공원 · 녹지
         ───────────────────────────── */}
      <g opacity={0.82}>
        {PARK_AREAS.map((park, index) => (
          <g key={`park-${index}`}>
            <ellipse
              cx={park.cx}
              cy={park.cy}
              rx={park.rx}
              ry={park.ry}
              fill="#b9e5cc"
            />

            <ellipse
              cx={park.cx}
              cy={park.cy}
              rx={park.rx - 6}
              ry={park.ry - 5}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeDasharray="4 7"
              opacity={0.65}
            />
          </g>
        ))}
      </g>

      {/* ─────────────────────────────
          주요 도로
          실제 길안내용 도로가 아니라
          관광지도 시각화를 위한 일러스트 요소
         ───────────────────────────── */}
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ROAD_PATHS.map((road, index) => (
          <g key={`road-${index}`}>
            {/* 도로 외곽 */}
            <path
              d={road}
              stroke="#bfd9dc"
              strokeWidth={9}
              opacity={0.55}
            />

            {/* 흰 도로 */}
            <path
              d={road}
              stroke="#ffffff"
              strokeWidth={6}
              opacity={0.95}
            />

            {/* 가운데 은은한 선 */}
            <path
              d={road}
              stroke="#d6e8ed"
              strokeWidth={1}
              strokeDasharray="9 9"
              opacity={0.85}
            />
          </g>
        ))}
      </g>

      {/* ─────────────────────────────
          산책길 · 자전거길
         ───────────────────────────── */}
      <g
        fill="none"
        stroke="#69b9b4"
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeDasharray="5 7"
        opacity={0.72}
      >
        {WALK_PATHS.map((path, index) => (
          <path
            key={`walk-${index}`}
            d={path}
          />
        ))}
      </g>

      {/* ─────────────────────────────
          울산 도심 블록
         ───────────────────────────── */}
      <g>
        {CITY_BLOCKS.map((block, index) => (
          <g
            key={`city-${index}`}
            opacity={0.9}
          >
            {/* 건물 그림자 */}
            <rect
              x={block.x + 2}
              y={block.y + 3}
              width={block.w}
              height={block.h}
              rx={block.r ?? 5}
              fill="#9cc4cf"
              opacity={0.2}
            />

            {/* 건물 */}
            <rect
              x={block.x}
              y={block.y}
              width={block.w}
              height={block.h}
              rx={block.r ?? 5}
              fill="#f7fcff"
              stroke="#bad8df"
              strokeWidth={1.1}
            />

            {/* 옥상 포인트 */}
            <rect
              x={block.x + 6}
              y={block.y + 5}
              width={Math.max(8, block.w - 12)}
              height={3}
              rx={1.5}
              fill="#d9edf1"
            />
          </g>
        ))}
      </g>

      {/* ─────────────────────────────
          작은 생활도로
         ───────────────────────────── */}
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.72}
      >
        <path d="M445 340 C470 385 500 410 545 430" />
        <path d="M500 320 C525 350 570 375 620 390" />
        <path d="M550 315 C585 345 625 355 670 350" />
        <path d="M455 485 C510 490 560 485 615 470" />
      </g>

      {/* ─────────────────────────────
          장생포 · 항구 디테일
         ───────────────────────────── */}
      <g
        stroke="#4b91b5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 부두 */}
        <path
          d="M704 500 L758 500"
          strokeWidth={7}
          opacity={0.28}
        />

        <path
          d="M704 500 L758 500"
          stroke="#ffffff"
          strokeWidth={4}
        />

        <path
          d="M720 520 L765 520"
          strokeWidth={6}
          opacity={0.25}
        />

        <path
          d="M720 520 L765 520"
          stroke="#ffffff"
          strokeWidth={3}
        />

        {/* 항만 창고 */}
        <rect
          x={678}
          y={485}
          width={24}
          height={17}
          rx={4}
          fill="#f5fbff"
          stroke="#a8cedb"
          strokeWidth={1}
        />

        <rect
          x={688}
          y={510}
          width={28}
          height={18}
          rx={4}
          fill="#eef9fb"
          stroke="#a8cedb"
          strokeWidth={1}
        />
      </g>

      {/* ─────────────────────────────
          해안 산책로
         ───────────────────────────── */}
      <path
        d="M700 485 C724 500 744 530 744 570 C744 615 738 650 745 680"
        fill="none"
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="7 8"
        opacity={0.76}
      />

      {/* ─────────────────────────────
          바다의 작은 여행 요소
         ───────────────────────────── */}
      <g opacity={0.88}>
        {/* 요트 */}
        <g transform="translate(875 455)">
          <path
            d="M0 14 L28 14 L23 22 L6 22 Z"
            fill="#ffffff"
            stroke="#3682aa"
            strokeWidth={1.2}
          />
          <path
            d="M13 12 L13 -10"
            stroke="#3682aa"
            strokeWidth={2}
          />
          <path
            d="M15 -7 L29 10 L15 10 Z"
            fill="#dff6ff"
            stroke="#68b9d8"
            strokeWidth={1}
          />
        </g>

        {/* 작은 배 */}
        <g transform="translate(925 545)">
          <path
            d="M0 0 q12 -8 24 0 l-5 8 h-14 Z"
            fill="#ffffff"
            stroke="#3682aa"
            strokeWidth={1.2}
          />
        </g>
      </g>

      {/* ─────────────────────────────
          동해 등대
         ───────────────────────────── */}
      <g
        transform="translate(940 300)"
        opacity={0.9}
      >
        <path
          d="M-7 34 L-3 0 L3 0 L7 34 Z"
          fill="#ffffff"
          stroke="#3f86ad"
          strokeWidth={1.3}
        />

        <rect
          x={-7}
          y={-8}
          width={14}
          height={9}
          rx={2}
          fill="#ff9f43"
        />

        <path
          d="M-13 -8 L13 -8"
          stroke="#3f86ad"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>

      {/* ─────────────────────────────
          지역명
         ───────────────────────────── */}
      <g
        fontFamily="var(--font-body)"
        fontWeight={800}
        fill="#4d7d8b"
        opacity={0.55}
        pointerEvents="none"
      >
        {MAP_LABELS.map((label) => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fontSize={12}
            letterSpacing={1.5}
          >
            {label.text}
          </text>
        ))}
      </g>

      {/* ─────────────────────────────
          영남알프스
         ───────────────────────────── */}
      <g strokeLinejoin="round">
        <g
          fill="#a7d8cd"
          stroke="#76b3ad"
          strokeWidth={1.3}
          opacity={0.82}
        >
          <path
            d={peak(
              86,
              360,
              90,
              62,
            )}
          />
          <path
            d={peak(
              145,
              340,
              104,
              80,
            )}
          />
          <path
            d={peak(
              225,
              366,
              98,
              66,
            )}
          />
          <path
            d={peak(
              296,
              350,
              88,
              59,
            )}
          />
        </g>

        <g
          fill="url(#wy-mountain)"
          stroke="#5f9fa1"
          strokeWidth={1.4}
          opacity={0.78}
        >
          <path
            d={peak(
              108,
              430,
              98,
              70,
            )}
          />
          <path
            d={peak(
              180,
              452,
              112,
              84,
            )}
          />
          <path
            d={peak(
              270,
              440,
              94,
              64,
            )}
          />
        </g>

        {/* 산 정상 눈/빛 */}
        <g
          fill="#dff4ec"
          opacity={0.75}
        >
          <path d="M174 280 l18 28 l-12 -7 l-7 8 l-8 -8 l-10 7 Z" />
          <path d="M235 300 l15 24 l-9 -5 l-7 7 l-7 -7 l-8 5 Z" />
        </g>
      </g>

      {/* ─────────────────────────────
          반구대 바위
         ───────────────────────────── */}
      <g
        transform="translate(372 250)"
        stroke="#728a8f"
        strokeWidth={1.5}
        strokeLinejoin="round"
      >
        <path
          d="M0 40 L6 4 L26 0 L44 8 L58 2 L66 34 L60 52 L10 56 Z"
          fill="#b8c6c1"
          opacity={0.9}
        />

        <path
          d="M8 12 L26 7 L43 13 L55 9"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          opacity={0.4}
        />

        <g
          stroke="#6b8486"
          strokeWidth={1}
          opacity={0.45}
          fill="none"
        >
          <path d="M14 18 q6 -4 12 0" />
          <path d="M34 14 q6 4 12 0" />
          <path d="M20 34 q8 -3 16 2" />
        </g>
      </g>

      {/* ─────────────────────────────
          숲
         ───────────────────────────── */}
      <g
        fill="#58b7a3"
        opacity={0.48}
      >
        {TREES.map(
          ([x, y, s], i) => (
            <path
              key={i}
              d={tree(x, y, s)}
            />
          ),
        )}
      </g>

      {/* 숲 포인트 */}
      <g
        fill="#3fae9a"
        opacity={0.25}
      >
        <circle
          cx="195"
          cy="260"
          r="22"
        />
        <circle
          cx="322"
          cy="410"
          r="28"
        />
        <circle
          cx="510"
          cy="525"
          r="24"
        />
      </g>

      {/* ─────────────────────────────
          태화강
         ───────────────────────────── */}
      <g
        fill="none"
        strokeLinecap="round"
      >
        {/* 강 주변 글로우 */}
        <path
          d="M150 470 C260 452 360 470 460 430 C540 398 600 402 660 400 C700 398 726 420 738 452"
          stroke="#ffffff"
          strokeWidth={13}
          opacity={0.5}
        />

        {/* 강 본체 */}
        <path
          d="M150 470 C260 452 360 470 460 430 C540 398 600 402 660 400 C700 398 726 420 738 452"
          stroke="#4ec5cf"
          strokeWidth={7}
          opacity={0.9}
        />

        <path
          d="M150 470 C260 452 360 470 460 430 C540 398 600 402 660 400 C700 398 726 420 738 452"
          stroke="#8ee2e5"
          strokeWidth={2}
          opacity={0.9}
        />

        {/* 반구대 지류 */}
        <path
          d="M452 434 C440 380 424 330 406 292"
          stroke="#65cbd0"
          strokeWidth={4}
          opacity={0.7}
        />
      </g>

      {/* ─────────────────────────────
          태화강 다리
         ───────────────────────────── */}
      <g>
        {BRIDGES.map((bridge, index) => (
          <g key={`bridge-${index}`}>
            <line
              x1={bridge.x1}
              y1={bridge.y1}
              x2={bridge.x2}
              y2={bridge.y2}
              stroke="#527f9b"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.32}
            />

            <line
              x1={bridge.x1}
              y1={bridge.y1}
              x2={bridge.x2}
              y2={bridge.y2}
              stroke="#ffffff"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      {/* ─────────────────────────────
          고래의 여행길
         ───────────────────────────── */}
      <path
        d="M404 292 C472 318 532 340 590 374 C650 408 704 446 770 478"
        fill="none"
        stroke="#5478db"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="7 12"
        opacity={0.38}
      />

      {/* 여행길 포인트 */}
      <g
        fill="#ffffff"
        stroke="#5478db"
        strokeWidth={2}
        opacity={0.7}
      >
        <circle
          cx="445"
          cy="311"
          r="5"
        />
        <circle
          cx="545"
          cy="352"
          r="5"
        />
        <circle
          cx="646"
          cy="406"
          r="5"
        />
      </g>

      {/* ─────────────────────────────
          장생포 작은 배
         ───────────────────────────── */}
      <g
        stroke="#4589b6"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      >
        <g fill="#ffffff">
          <path d="M772 486 l30 0 l-6 12 l-18 0 Z" />
          <path d="M812 470 l26 0 l-5 10 l-16 0 Z" />
        </g>

        <path
          d="M786 486 l0 -14"
          opacity={0.7}
        />

        <path
          d="M824 470 l0 -12"
          opacity={0.7}
        />
      </g>

      {/* ─────────────────────────────
          바다 고래
         ───────────────────────────── */}
      <g
        transform="translate(800 585) scale(0.92)"
        strokeLinejoin="round"
        opacity={0.9}
      >
        {/* 물기둥 */}
        <g
          stroke="#8ee8ef"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        >
          <path d="M40 -18 C36 -34 34 -42 40 -54" />
          <path d="M52 -18 C52 -32 56 -40 62 -50" />
        </g>

        {/* 몸 */}
        <path
          d="M8 -2 C40 -30 120 -34 168 -18 C150 -8 150 12 168 22 C120 40 40 34 8 6 C2 3 2 1 8 -2 Z"
          fill="#4d9ee8"
          stroke="#27699f"
          strokeWidth={2.2}
        />

        {/* 꼬리 */}
        <path
          d="M164 -16 C188 -30 202 -28 210 -38 C206 -14 206 20 210 40 C202 26 188 26 164 20 Z"
          fill="#438dd6"
          stroke="#27699f"
          strokeWidth={2.2}
        />

        {/* 배 */}
        <path
          d="M28 14 C60 30 118 30 150 16"
          fill="none"
          stroke="#ffffff"
          strokeWidth={4}
          opacity={0.7}
        />

        {/* 눈 */}
        <circle
          cx={34}
          cy={-4}
          r={4}
          fill="#174e7c"
        />

        <circle
          cx={33}
          cy={-5}
          r={1.4}
          fill="#ffffff"
        />
      </g>

      {/* ─────────────────────────────
          나침반
         ───────────────────────────── */}
      <g
        transform="translate(890 125)"
        filter="url(#wy-soft-shadow)"
      >
        <circle
          r={29}
          fill="#ffffff"
          fillOpacity={0.9}
          stroke="#b8dbea"
          strokeWidth={1.5}
        />

        <circle
          r={22}
          fill="none"
          stroke="#d5e8f0"
          strokeWidth={1}
        />

        <path
          d="M0 -22 L5 0 L0 22 L-5 0 Z"
          fill="#ff9f43"
        />

        <path
          d="M-22 0 L0 5 L22 0 L0 -5 Z"
          fill="#67b9dc"
        />

        <circle
          r={3.5}
          fill="#174e7c"
        />

        <text
          x={0}
          y={-35}
          textAnchor="middle"
          fontSize={11}
          fontWeight={800}
          fill="#476c83"
          fontFamily="var(--font-body)"
        >
          N
        </text>
      </g>

      {/* ─────────────────────────────
          구름
         ───────────────────────────── */}
      <g
        fill="#ffffff"
        opacity={0.64}
      >
        <path d="M120 130 q10 -12 26 -6 q10 -10 24 0 q14 -2 14 10 q0 8 -14 8 l-42 0 q-12 0 -8 -12 Z" />

        <path d="M560 120 q9 -10 22 -5 q9 -8 20 0 q12 -2 12 8 q0 7 -12 7 l-36 0 q-10 0 -6 -10 Z" />
      </g>

      {/* ─────────────────────────────
          작은 지도 서명
          고지도 정체성을 완전히 없애지 않고
          아주 작게만 남깁니다.
         ───────────────────────────── */}
      <g
        transform="translate(88 655)"
        opacity={0.6}
      >
        <text
          x={0}
          y={0}
          fontSize={13}
          fontWeight={800}
          fill="#3c7892"
          fontFamily="var(--font-body)"
        >
          ULSAN WHALE ROAD
        </text>

        <path
          d="M0 11 C38 18 72 3 112 10"
          fill="none"
          stroke="#65c8d0"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
    </>
  );
}