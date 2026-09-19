// 울산고래여지도 — Illustrated Ocean Travel Map
// 실제 스팟 좌표 투영(projectToMap)은 유지하고,
// 지도 그래픽만 관광 앱용 일러스트 스타일로 표현합니다.

export const MAP_W = 1500;
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

/* 울산 해안선 */
const COAST =
  "M38 44 " +
  "L690 40 " +
  "C708 100 715 162 720 220 " +
  "C724 274 720 315 738 344 " +
  "C750 362 744 382 723 400 " +
  "C739 419 754 438 750 459 " +
  "C744 481 722 489 710 503 " +
  "C724 522 742 540 744 585 " +
  "C745 631 738 671 744 716 " +
  "L38 716 Z";

function tree(
  x: number,
  y: number,
  s: number,
) {
  return (
    <g
      key={`${x}-${y}-${s}`}
      transform={`translate(${x} ${y}) scale(${s})`}
    >
      <path
        d="M0 15 L0 25"
        stroke="#6ca792"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0 0 L-9 15 H9 Z"
        fill="#5fb59f"
      />
      <path
        d="M0 7 L-11 22 H11 Z"
        fill="#76c4ad"
      />
    </g>
  );
}

function hill(
  x: number,
  y: number,
  w: number,
  h: number,
  tone = "#9fd1bb",
) {
  return (
    <g
      key={`${x}-${y}-${w}-${h}`}
      transform={`translate(${x} ${y})`}
    >
      <path
        d={`M0 ${h} Q${w * 0.5} ${-h * 0.28} ${w} ${h} Z`}
        fill={tone}
      />
      <path
        d={`M${w * 0.5} ${h * 0.12}
            Q${w * 0.63} ${h * 0.32}
            ${w * 0.72} ${h * 0.57}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.38"
      />
    </g>
  );
}

const FOREST: Array<
  [number, number, number]
> = [
    [82, 265, 0.8],
    [112, 295, 0.7],
    [145, 250, 0.95],
    [176, 300, 0.75],
    [208, 268, 0.7],
    [242, 310, 0.85],
    [279, 257, 0.72],
    [316, 295, 0.82],
    [350, 264, 0.68],

    [72, 365, 0.74],
    [105, 400, 0.92],
    [143, 348, 0.72],
    [180, 390, 0.86],
    [222, 354, 0.72],
    [260, 402, 0.82],
    [305, 365, 0.7],
    [344, 411, 0.8],

    [78, 485, 0.72],
    [112, 524, 0.9],
    [152, 472, 0.72],
    [190, 515, 0.82],
    [230, 478, 0.68],
    [275, 532, 0.82],
    [320, 488, 0.7],
    [360, 530, 0.78],

    [395, 285, 0.65],
    [433, 326, 0.72],
    [470, 288, 0.62],
    [505, 325, 0.68],
    [545, 292, 0.64],
    [583, 330, 0.72],
    [624, 300, 0.62],

    [395, 470, 0.65],
    [438, 506, 0.72],
    [480, 470, 0.64],
    [525, 516, 0.7],
    [570, 485, 0.63],
    [615, 524, 0.72],
    [655, 478, 0.65],

    [120, 590, 0.7],
    [170, 620, 0.78],
    [220, 585, 0.68],
    [275, 620, 0.74],
    [330, 585, 0.66],
    [390, 620, 0.72],
    [450, 585, 0.65],
    [515, 620, 0.72],
    [580, 585, 0.65],
    [640, 620, 0.7],
  ];

const ROADS = [
  "M92 532 C190 497 278 480 370 474 C465 468 568 449 682 412",
  "M118 586 C218 551 318 541 420 548 C518 554 596 538 680 500",
  "M175 235 C229 294 270 350 307 429",
  "M288 194 C352 244 412 295 482 340",
  "M412 222 C475 260 545 301 649 335",
];

const MINOR_ROADS = [
  "M362 370 C405 395 444 420 486 455",
  "M430 340 C475 365 522 385 572 399",
  "M505 330 C555 347 602 359 655 356",
  "M410 500 C466 510 526 510 596 494",
];

export function UlsanBaseMap() {
  return (
    <>
      <defs>
        <linearGradient
          id="map-land"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0"
            stopColor="#dff2df"
          />
          <stop
            offset="0.55"
            stopColor="#d4eee1"
          />
          <stop
            offset="1"
            stopColor="#cae8df"
          />
        </linearGradient>

        <linearGradient
          id="map-sea"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            stopColor="#72d1e7"
          />
          <stop
            offset="0.5"
            stopColor="#55b9df"
          />
          <stop
            offset="1"
            stopColor="#3f9fd5"
          />
        </linearGradient>

        <linearGradient
          id="map-river"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop
            offset="0"
            stopColor="#58cbd0"
          />
          <stop
            offset="1"
            stopColor="#42b6ce"
          />
        </linearGradient>

        <filter
          id="map-soft-shadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="5"
            floodColor="#1b6898"
            floodOpacity="0.13"
          />
        </filter>
      </defs>

      {/* 전체 배경 */}
      <rect
        width={MAP_W}
        height={MAP_H}
        fill="#e9f8f5"
      />

      {/* 바다 */}
      <path
        d={
          COAST.replace("Z", "") +
          ` L${MAP_W} 716 L${MAP_W} 44 Z`
        }
        fill="url(#map-sea)"
      />

      {/* 바다 빛 */}
      <path
        d="M780 60
           C860 150 872 245 812 315
           C770 365 776 452 842 520
           C900 579 930 641 920 716"
        fill="none"
        stroke="#ffffff"
        strokeWidth="110"
        opacity="0.06"
      />

      {/* 바다 잔물결 */}
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        opacity="0.28"
        strokeLinecap="round"
      >
        <path d="M770 108 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M760 165 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M772 226 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M768 286 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M778 350 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M770 417 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M780 484 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M775 552 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
        <path d="M780 622 q18 -11 36 0 q18 11 36 0 q18 -11 36 0 q18 11 36 0" />
      </g>

      {/* 육지 */}
      <path
        d={COAST}
        fill="url(#map-land)"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* 해안 안쪽 라인 */}
      <path
        d={COAST}
        fill="none"
        stroke="#8dc9bf"
        strokeWidth="1.5"
        opacity="0.55"
      />

      {/* 서쪽 산악지형 */}
      <g opacity="0.96">
        {hill(
          36,
          260,
          130,
          70,
          "#9ed5c1",
        )}
        {hill(
          108,
          230,
          150,
          92,
          "#8fc9b6",
        )}
        {hill(
          198,
          270,
          138,
          72,
          "#a9d9c4",
        )}
        {hill(
          62,
          354,
          142,
          84,
          "#8dc7b1",
        )}
        {hill(
          155,
          342,
          164,
          105,
          "#7ebda9",
        )}
        {hill(
          252,
          360,
          126,
          76,
          "#9ed1bd",
        )}
      </g>

      {/* 산 뒤쪽 능선 */}
      <path
        d="M42 265
           C105 203 165 192 225 233
           C270 264 312 247 354 215"
        fill="none"
        stroke="#7fbcae"
        strokeWidth="8"
        opacity="0.11"
        strokeLinecap="round"
      />

      {/* 숲 */}
      <g opacity="0.83">
        {FOREST.map(
          ([x, y, s]) =>
            tree(x, y, s),
        )}
      </g>

      {/* 녹지 군집 */}
      <g opacity="0.27">
        <ellipse
          cx="170"
          cy="470"
          rx="74"
          ry="42"
          fill="#83cbb0"
        />
        <ellipse
          cx="338"
          cy="545"
          rx="64"
          ry="34"
          fill="#8bd1b6"
        />
        <ellipse
          cx="560"
          cy="458"
          rx="58"
          ry="33"
          fill="#8bd1b6"
        />
      </g>

      {/* 주요 도로 — 시안처럼 얇고 자연스럽게 */}
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ROADS.map(
          (road, index) => (
            <g key={index}>
              <path
                d={road}
                stroke="#9ecbc5"
                strokeWidth="6"
                opacity="0.5"
              />
              <path
                d={road}
                stroke="#fffdf8"
                strokeWidth="3.5"
                opacity="0.98"
              />
            </g>
          ),
        )}

        {MINOR_ROADS.map(
          (road, index) => (
            <path
              key={index}
              d={road}
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.72"
            />
          ),
        )}
      </g>

      {/* 태화강 */}
      <g
        fill="none"
        strokeLinecap="round"
      >
        <path
          d="M95 466
             C190 448 274 463 360 444
             C430 429 488 397 552 394
             C612 391 668 394 712 426
             C726 436 735 445 742 456"
          stroke="#ffffff"
          strokeWidth="13"
          opacity="0.78"
        />

        <path
          d="M95 466
             C190 448 274 463 360 444
             C430 429 488 397 552 394
             C612 391 668 394 712 426
             C726 436 735 445 742 456"
          stroke="url(#map-river)"
          strokeWidth="7"
        />

        <path
          d="M95 466
             C190 448 274 463 360 444
             C430 429 488 397 552 394
             C612 391 668 394 712 426"
          stroke="#bdf6ef"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* 반구대 쪽 지류 */}
        <path
          d="M360 442
             C356 394 344 350 328 306
             C320 281 310 258 294 238"
          stroke="#59c7cb"
          strokeWidth="4"
          opacity="0.82"
        />
      </g>

      {/* 강변 산책길 */}
      <path
        d="M108 482
           C205 467 282 482 369 460
           C447 440 505 414 570 411
           C624 410 668 414 708 441"
        fill="none"
        stroke="#5db5a8"
        strokeWidth="2"
        strokeDasharray="6 7"
        opacity="0.58"
      />

      {/* 다리 */}
      <g
        strokeLinecap="round"
      >
        <g>
          <line
            x1="315"
            y1="458"
            x2="328"
            y2="443"
            stroke="#5a8794"
            strokeWidth="6"
            opacity="0.22"
          />
          <line
            x1="315"
            y1="458"
            x2="328"
            y2="443"
            stroke="#ffffff"
            strokeWidth="3"
          />
        </g>

        <g>
          <line
            x1="475"
            y1="418"
            x2="493"
            y2="407"
            stroke="#5a8794"
            strokeWidth="6"
            opacity="0.22"
          />
          <line
            x1="475"
            y1="418"
            x2="493"
            y2="407"
            stroke="#ffffff"
            strokeWidth="3"
          />
        </g>

        <g>
          <line
            x1="620"
            y1="398"
            x2="640"
            y2="399"
            stroke="#5a8794"
            strokeWidth="6"
            opacity="0.22"
          />
          <line
            x1="620"
            y1="398"
            x2="640"
            y2="399"
            stroke="#ffffff"
            strokeWidth="3"
          />
        </g>
      </g>

      {/* 반구대 암각화 상징 */}
      <g
        transform="translate(322 220)"
        filter="url(#map-soft-shadow)"
      >
        <path
          d="M0 40
             L5 7
             L27 0
             L48 10
             L64 5
             L69 34
             L58 54
             L10 56 Z"
          fill="#aab8af"
          stroke="#81918a"
          strokeWidth="2"
        />

        <path
          d="M17 18 q8 -6 16 0"
          fill="none"
          stroke="#73847c"
          strokeWidth="1.4"
        />

        <path
          d="M33 33 q8 -5 17 1"
          fill="none"
          stroke="#73847c"
          strokeWidth="1.4"
        />
      </g>

      {/* 작은 공원/도심 포인트 */}
      <g opacity="0.9">
        <ellipse
          cx="495"
          cy="455"
          rx="38"
          ry="24"
          fill="#b9e4c9"
        />
        <ellipse
          cx="590"
          cy="440"
          rx="30"
          ry="20"
          fill="#b9e4c9"
        />

        <g
          fill="#f7fcfb"
          stroke="#b5d8d1"
          strokeWidth="1"
        >
          <rect
            x="424"
            y="348"
            width="30"
            height="18"
            rx="7"
          />
          <rect
            x="465"
            y="335"
            width="34"
            height="20"
            rx="7"
          />
          <rect
            x="515"
            y="356"
            width="30"
            height="18"
            rx="7"
          />
          <rect
            x="558"
            y="340"
            width="38"
            height="22"
            rx="8"
          />
          <rect
            x="605"
            y="361"
            width="30"
            height="18"
            rx="7"
          />

          <rect
            x="438"
            y="468"
            width="32"
            height="18"
            rx="7"
          />
          <rect
            x="486"
            y="456"
            width="34"
            height="19"
            rx="7"
          />
          <rect
            x="535"
            y="470"
            width="38"
            height="20"
            rx="7"
          />
          <rect
            x="590"
            y="455"
            width="32"
            height="18"
            rx="7"
          />
        </g>
      </g>

      {/* 장생포 항만 */}
      <g
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M696 488 L750 488"
          stroke="#ffffff"
          strokeWidth="4"
        />
        <path
          d="M710 510 L764 510"
          stroke="#ffffff"
          strokeWidth="3"
        />

        <rect
          x="674"
          y="476"
          width="22"
          height="16"
          rx="5"
          fill="#edf9f9"
          stroke="#a8d0d3"
        />

        <rect
          x="686"
          y="503"
          width="26"
          height="17"
          rx="5"
          fill="#edf9f9"
          stroke="#a8d0d3"
        />
      </g>

      {/* 해안 산책길 */}
      <path
        d="M706 506
           C729 535 736 570 735 608
           C734 648 730 675 736 701"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeDasharray="7 7"
        opacity="0.75"
      />

      {/* 고래의 길 */}
      <path
        d="M333 268
           C402 294 465 327 523 364
           C586 404 654 433 730 469"
        fill="none"
        stroke="#5d63e8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 10"
        opacity="0.48"
      />

      <g
        fill="#ffffff"
        stroke="#686ef0"
        strokeWidth="2"
        opacity="0.85"
      >
        <circle
          cx="401"
          cy="299"
          r="5"
        />
        <circle
          cx="516"
          cy="360"
          r="5"
        />
        <circle
          cx="632"
          cy="424"
          r="5"
        />
      </g>

      {/* 나침반 */}
      <g
        transform="translate(872 112)"
        filter="url(#map-soft-shadow)"
      >
        <circle
          r="32"
          fill="#ffffff"
          fillOpacity="0.94"
          stroke="#c6e2e8"
          strokeWidth="2"
        />
        <circle
          r="23"
          fill="none"
          stroke="#dceef1"
        />

        <path
          d="M0 -24 L6 0 L0 24 L-6 0 Z"
          fill="#ff765f"
        />

        <path
          d="M-24 0 L0 6 L24 0 L0 -6 Z"
          fill="#328ac7"
        />

        <circle
          r="4"
          fill="#164c78"
        />

        <text
          x="0"
          y="-38"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#456e80"
          fontFamily="var(--font-body)"
        >
          N
        </text>
      </g>

      {/* 작은 등대 */}
      <g
        transform="translate(914 278)"
        opacity="0.92"
      >
        <path
          d="M-6 31 L-2 0 H2 L6 31 Z"
          fill="#ffffff"
          stroke="#3e89ae"
          strokeWidth="1.4"
        />

        <rect
          x="-7"
          y="-7"
          width="14"
          height="8"
          rx="2"
          fill="#ff9f43"
        />

        <path
          d="M-12 -7 H12"
          stroke="#3e89ae"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* 요트 */}
      <g
        transform="translate(840 443)"
        opacity="0.92"
      >
        <path
          d="M0 16 H30 L24 24 H6 Z"
          fill="#ffffff"
          stroke="#2f82ad"
          strokeWidth="1.5"
        />

        <path
          d="M14 15 V-12"
          stroke="#2f82ad"
          strokeWidth="2"
        />

        <path
          d="M16 -9 L30 11 H16 Z"
          fill="#e7fbff"
          stroke="#72c5dc"
          strokeWidth="1"
        />
      </g>

      {/* 작은 배 */}
      <g
        transform="translate(900 518)"
        opacity="0.85"
      >
        <path
          d="M0 3
             Q13 -8 27 3
             L21 11 H7 Z"
          fill="#ffffff"
          stroke="#3988af"
          strokeWidth="1.5"
        />
      </g>

      {/* 바다 고래 — 이전보다 작게 */}
      <g
        transform="translate(806 592) scale(0.58)"
        opacity="0.76"
      >
        <g
          stroke="#9aeef0"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M38 -18 C35 -37 34 -45 42 -60" />
          <path d="M53 -18 C53 -34 58 -46 65 -56" />
        </g>

        <path
          d="M8 -2
             C40 -30 120 -34 168 -18
             C150 -8 150 12 168 22
             C120 40 40 34 8 6
             C2 3 2 1 8 -2 Z"
          fill="#459adf"
          stroke="#226c9f"
          strokeWidth="3"
        />

        <path
          d="M164 -16
             C188 -30 202 -28 210 -38
             C206 -14 206 20 210 40
             C202 26 188 26 164 20 Z"
          fill="#3d8fd5"
          stroke="#226c9f"
          strokeWidth="3"
        />

        <path
          d="M30 14 C70 31 120 29 151 15"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
          opacity="0.75"
        />

        <circle
          cx="34"
          cy="-4"
          r="4"
          fill="#164f7b"
        />
      </g>

      {/* 구름 */}
      <g
        fill="#ffffff"
        opacity="0.63"
      >
        <path d="M90 105 q11 -13 28 -6 q11 -11 25 0 q15 -2 15 11 q0 8 -15 8 h-44 q-13 0 -9 -13 Z" />
        <path d="M520 92 q10 -11 24 -5 q9 -9 21 0 q13 -2 13 9 q0 7 -13 7 h-38 q-11 0 -7 -11 Z" />
      </g>

      {/* 지역명 — 아주 은은하게 */}
      <g
        fontFamily="var(--font-body)"
        fontWeight="800"
        fill="#4c827f"
        opacity="0.38"
        pointerEvents="none"
      >
        <text
          x="178"
          y="223"
          textAnchor="middle"
          fontSize="12"
          letterSpacing="1.4"
        >
          영남알프스
        </text>

        <text
          x="520"
          y="385"
          textAnchor="middle"
          fontSize="11"
          letterSpacing="1.2"
        >
          태화강
        </text>

        <text
          x="705"
          y="542"
          textAnchor="middle"
          fontSize="11"
          letterSpacing="1.2"
        >
          장생포
        </text>

        <text
          x="842"
          y="350"
          textAnchor="middle"
          fontSize="12"
          letterSpacing="2"
          fill="#ffffff"
          opacity="0.75"
        >
          동해
        </text>
      </g>
    </>
  );
}