import Link from "next/link";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import { SpotCarousel } from "@/frontend/components/home/SpotCarousel";
import {
  MAP_H,
  MAP_W,
  UlsanBaseMap,
} from "@/frontend/components/map/UlsanBaseMap";
import {
  NavBar,
  SubnavStrip,
} from "@/frontend/components/chrome/NavBar";

const FEATURES = [
  {
    icon: "🗺️",
    title: "고래의 도시 울산",
    desc: "고래와 울산의 이야기를 지도 위에서 만나보세요.",
  },
  {
    icon: "✨",
    title: "나에게 맞는 여행",
    desc: "동행·기간·관심사에 맞춰 여행 코스를 추천해요.",
  },
  {
    icon: "🐋",
    title: "나만의 고래여권",
    desc: "GPS 방문 인증으로 여행의 추억을 차곡차곡 모아요.",
  },
  {
    icon: "📍",
    title: "지금, 울산으로",
    desc: "실제 관광정보를 확인하고 바로 여행을 시작해보세요.",
  },
];

const JOURNEY = [
  {
    step: "01",
    icon: "🔎",
    title: "고래의 흔적을 찾고",
    desc: "지도에서 울산 곳곳의 고래 문화와 관광지를 발견해요.",
  },
  {
    step: "02",
    icon: "🌊",
    title: "나만의 길을 떠나고",
    desc: "취향과 일정에 맞는 추천 코스를 따라 울산을 여행해요.",
  },
  {
    step: "03",
    icon: "📍",
    title: "현장에서 인증하고",
    desc: "관광지에 도착하면 GPS로 실제 방문을 인증할 수 있어요.",
  },
  {
    step: "04",
    icon: "🏅",
    title: "탐험가로 성장해요",
    desc: "스탬프와 등급을 모아 나만의 고래여권을 완성해보세요.",
  },
];

const SPOTS = [
  {
    title: "장생포 고래문화마을",
    desc: "고래와 만나는 특별한 시간",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/05/3581305_image2_1.jpg",
    href: "/map",
  },
  {
    title: "반구대 암각화",
    desc: "시간이 새긴 이야기",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/24/4087624_image2_1.JPG",
    href: "/map",
  },
  {
    title: "대왕암공원",
    desc: "바다가 품은 풍경",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/16/3583516_image2_1.jpg",
    href: "/map",
  },
  {
    title: "울산대교 전망대",
    desc: "도시와 바다를 한눈에 담는 울산 전망",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/17/3422817_image2_1.png",
    href: "/map",
  },
  {
    title: "태화강 국가정원",
    desc: "도심 속에서 만나는 푸른 울산",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/31/3079831_image2_1.JPG",
    href: "/map",
  },
  {
    title: "장생포 고래생태체험관",
    desc: "고래를 더 가까이 만나는 체험 공간",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/34/3549034_image2_1.jpg",
    href: "/map",
  },
  {
    title: "간절곶",
    desc: "울산의 바다와 해맞이를 만나는 곳",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/50/3583350_image2_1.jpg",
    href: "/map",
  },
  {
    title: "주전몽돌해변",
    desc: "몽돌 소리와 함께 걷는 바닷길",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/42/3014942_image2_1.jpg",
    href: "/map",
  },
  {
    title: "강동 화암 주상절리",
    desc: "파도와 시간이 만든 울산의 해안 절경",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/89/3538989_image2_1.png",
    href: "/map",
  },
  {
    title: "나사해변",
    desc: "잔잔한 바다와 마주하는 울산의 해변",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/39/3534639_image2_1.jpg",
    href: "/map",
  },
  {
    title: "영남알프스 복합웰컴센터",
    desc: "산과 문화가 만나는 영남알프스의 시작",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/36/2674936_image2_1.jpg",
    href: "/map",
  },
  {
    title: "태화루",
    desc: "태화강을 바라보는 울산의 아름다운 누각",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/26/3341926_image2_1.jpg",
    href: "/map",
  },
  {
    title: "내원암 계곡",
    desc: "숲과 맑은 계곡이 어우러진 자연 여행",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/79/3377679_image2_1.jpg",
    href: "/map",
  },
  {
    title: "홍류폭포",
    desc: "영남알프스에서 만나는 시원한 폭포 풍경",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/07/3049207_image2_1.jpg",
    href: "/map",
  },
  {
    title: "화암추 등대",
    desc: "동해를 바라보며 걷는 울산의 등대길",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/06/3073206_image2_1.jpg",
    href: "/map",
  },
  {
    title: "태화강 십리대숲",
    desc: "대나무 사이로 걷는 울산의 초록빛 산책길",
    image:
      "https://tong.visitkorea.or.kr/cms/resource/01/3565101_image2_1.jpg",
    href: "/map",
  },
];

export default function Landing() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(180deg,#edf5ff_0%,#f7fbff_55%,#ffffff_100%)]">
      <NavBar />
      <SubnavStrip crumb="홈" />

      {/* ─────────────────────────────
          HERO
         ───────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-white/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-lavender/60 blur-3xl"
        />

        <div className="whale-shell relative px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10">
          <div className="hero-card relative overflow-hidden">
            {/* 배경 지도 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
            >
              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="h-full w-full"
                preserveAspectRatio="xMidYMid slice"
              >
                <UlsanBaseMap />
              </svg>
            </div>

            {/* 바다빛 배경 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_28%,rgba(148,206,255,0.5),transparent_28rem),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(230,243,255,0.84)_55%,rgba(230,227,255,0.75))]"
            />

            <div className="relative grid min-h-[460px] items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.12fr_0.88fr] lg:px-14">
              {/* LEFT */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md">
                  <span className="text-sm">🌊</span>
                  <span className="wy-legend text-[10px] text-water">
                    ULSAN WHALE TRAVEL MAP
                  </span>
                </div>

                <p className="mt-6 text-[14px] font-extrabold tracking-[-0.02em] text-[#4d8ce8]">
                  바다를 품은 도시, 울산
                </p>

                <h1 className="mt-2 text-[54px] font-black leading-[0.94] tracking-[-0.065em] text-[#1f4a8a] sm:text-[72px] lg:text-[84px]">
                  울산을
                  <br />
                  고래의 길로
                </h1>

                <p className="mt-6 max-w-xl text-[14px] font-medium leading-7 text-ink-soft sm:text-[15px]">
                  행정구역이 아니라, 고래를 따라 걷는 여행지도.
                  <br className="hidden sm:block" />
                  장생포에서 반구대까지 — 울산의 숨은 이야기를
                  고래의 길 위에서 만나보세요.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/map" className="primary-btn gap-2">
                    여지도 펼치기
                    <span aria-hidden>→</span>
                  </Link>

                  <Link href="/recommend" className="secondary-btn">
                    추천 코스 보기
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-ink-faint">
                  <span>✓ 한국관광공사 OpenAPI</span>
                  <span>✓ GPS 방문 인증</span>
                  <span>✓ 개인화 코스 추천</span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="relative hidden min-h-[380px] overflow-hidden lg:flex lg:items-center lg:justify-center">
                {/* 하늘빛 */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_55%_35%,rgba(255,255,255,0.9),transparent_17rem)]"
                />

                {/* 갈매기 */}
                <div
                  aria-hidden
                  className="absolute left-[12%] top-[17%] text-[28px] font-bold text-[#6ea9df]/70"
                >
                  ︿
                </div>

                <div
                  aria-hidden
                  className="absolute left-[24%] top-[25%] text-[20px] font-bold text-[#6ea9df]/55"
                >
                  ︿
                </div>

                {/* 울산 해안 + 대교 */}
                <svg
                  aria-hidden
                  viewBox="0 0 520 360"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* 먼 산 */}
                  <path
                    d="M0 235 C70 205 120 225 170 200 C225 173 275 215 330 191 C385 165 430 198 520 175 L520 360 L0 360 Z"
                    fill="#a9cdec"
                    opacity="0.42"
                  />

                  {/* 울산대교 */}
                  <g
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  >
                    <path d="M285 260 L285 200" />
                    <path d="M400 260 L400 188" />
                    <path d="M285 213 C320 241 365 241 400 205" />
                    <path d="M285 226 L400 226" />
                  </g>

                  {/* 해안 바위 */}
                  <path
                    d="M335 275 q25 -48 52 -7 q27 -38 55 4 q28 -26 58 5 L520 320 L320 320 Z"
                    fill="#759aba"
                    opacity="0.72"
                  />

                  {/* 등대 */}
                  <g transform="translate(448 188)">
                    <path
                      d="M9 68 L18 18 L27 68 Z"
                      fill="#f8fbff"
                      stroke="#5284b4"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="12"
                      y="8"
                      width="12"
                      height="12"
                      rx="2"
                      fill="#ff8c64"
                    />
                    <rect
                      x="8"
                      y="4"
                      width="20"
                      height="5"
                      rx="2"
                      fill="#305d90"
                    />
                  </g>

                  {/* 바다 */}
                  <path
                    d="M0 283 C60 270 110 298 165 282 C225 266 275 300 330 285 C390 268 440 292 520 272 L520 360 L0 360 Z"
                    fill="#72bce6"
                    opacity="0.52"
                  />

                  {/* 파도 */}
                  <path
                    d="M0 312 C70 290 130 325 200 310 C270 294 320 327 390 311 C440 299 482 302 520 296"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.72"
                  />

                  <path
                    d="M20 330 C90 310 145 342 215 327 C285 311 350 344 420 326"
                    fill="none"
                    stroke="#d9f2ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </svg>

                {/* 말풍선 */}
                <div className="absolute right-[9%] top-[8%] z-20 rounded-full border border-white/90 bg-white/85 px-5 py-2.5 shadow-[0_10px_24px_rgba(55,107,169,0.12)] backdrop-blur-md">
                  <p className="text-[12px] font-extrabold text-[#214a87]">
                    “고래가 알려주는 특별한 울산 여행!”
                  </p>

                  <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white/85" />
                </div>

                {/* 고래 */}
                <WhaleMascot
                  animate
                  className="wy-float relative z-10 mt-4 h-[230px] w-auto drop-shadow-[0_18px_20px_rgba(53,106,168,0.14)]"
                />

                {/* 손글씨 느낌 카피 */}
                <div className="absolute bottom-[6%] right-[9%] z-20 rotate-[-6deg] text-right">
                  <p className="text-[17px] font-bold italic leading-6 text-[#4d8ce8]">
                    고래가 알려주는
                    <br />
                    특별한 울산 여행!
                  </p>

                  <p className="mt-1 text-[12px] font-semibold tracking-[0.08em] text-[#74a3da]">
                    Ulsan Whale Road
                  </p>
                </div>
              </div>
            </div>

            {/* Feature strip */}
            <div className="relative z-10 grid gap-3 border-t border-white/70 bg-white/55 p-4 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex items-start gap-3 rounded-[22px] border border-[#dbe9f7] bg-white/80 px-4 py-4 shadow-[0_8px_20px_rgba(74,119,180,0.08)] transition duration-200 hover:-translate-y-1 hover:bg-white"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f4ff] text-xl shadow-sm transition-transform duration-200 group-hover:scale-110">
                    {feature.icon}
                  </div>

                  <div>
                    <p className="text-[12px] font-extrabold text-[#214a87]">
                      {feature.title}
                    </p>

                    <p className="mt-1 text-[10.5px] leading-relaxed text-[#6f8eb5]">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────
    JOURNEY
   ───────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <p className="wy-legend text-[10px] text-water">
            HOW TO ENJOY WHALE YEOJIDO
          </p>

          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-carbon sm:text-[36px]">
            고래를 따라,
            <br className="sm:hidden" /> 여행이 이야기가 되는 순간
          </h2>

          <p className="mt-3 text-[13px] leading-6 text-ink-soft">
            장소를 찾는 것에서 끝나지 않아요. 발견하고, 떠나고,
            인증하고, 나만의 여행 기록을 완성해보세요.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map((item) => (
            <div
              key={item.step}
              className="wy-plate group relative overflow-hidden bg-white/80 p-5 backdrop-blur-sm"
            >
              <div className="absolute right-4 top-3 text-[34px] font-black text-ice">
                {item.step}
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ice text-xl transition-transform duration-200 group-hover:-translate-y-1">
                {item.icon}
              </div>

              <h3 className="mt-5 text-[14px] font-extrabold text-carbon">
                {item.title}
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────
          SPOTS
         ───────────────────────────── */}
      <section className="wy-ocean-section border-y border-hairline/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="wy-legend text-[10px] text-water">
                DISCOVER ULSAN
              </p>

              <h2 className="mt-2 flex flex-wrap items-baseline gap-x-2 tracking-[-0.045em] text-[#123f78]">
                <span className="text-[28px] font-black sm:text-[34px]">
                  울산, 고래를 따라
                </span>

                <span className="text-[22px] font-extrabold sm:text-[27px]">
                  만나는 특별한 순간들
                </span>
              </h2>

              <p className="mt-2 text-[11px] font-medium leading-5 text-[#758ba8] sm:text-[12px]">
                바다도, 역사도, 사람도 — 모두가 여행이 되는 곳.
                <span className="ml-1">
                  울산고래여지도와 함께 새로운 울산을 발견해보세요.
                </span>
              </p>
            </div>

            <Link
              href="/map"
              className="text-[12px] font-bold text-water transition hover:text-carbon"
            >
              여지도에서 모두 보기 →
            </Link>
          </div>

          <SpotCarousel spots={SPOTS} />
        </div>
      </section>

      {/* ─────────────────────────────
        FINAL CTA
       ───────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="wy-carbon relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="absolute -right-10 -top-16 h-60 w-60 rounded-full bg-white/10 blur-2xl"
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="wy-legend text-[9px] text-canvas-soft">
                YOUR WHALE JOURNEY STARTS HERE
              </p>

              <h2 className="mt-2 text-[25px] font-extrabold tracking-[-0.04em] text-white sm:text-[31px]">
                오늘, 울산에서
                <br />
                나만의 고래길을 시작해보세요.
              </h2>

              <p className="mt-3 text-[11px] leading-5 text-white/70">
                여행할수록 쌓이는 스탬프와 고래탐험가의 기록까지.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/recommend"
                className="wy-primary inline-flex min-h-11 items-center justify-center px-5 text-[12px] font-extrabold"
              >
                맞춤 코스 추천받기 →
              </Link>

              <Link
                href="/passport"
                className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-white/30 bg-white/10 px-5 text-[12px] font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                나의 고래여권
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────
          FOOTER
         ───────────────────────────── */}
      <footer className="border-t border-hairline/70 bg-white/70 px-4 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2">
          <div>
            <p className="text-[12px] font-extrabold text-carbon">
              🐋 울산고래여지도
            </p>
            <p className="mt-0.5 text-[9px] tracking-[0.1em] text-ink-faint">
              ULSAN WHALE TRAVEL MAP
            </p>
          </div>

          <span className="ml-auto text-[10px] font-semibold text-ink-faint">
            2026 관광데이터 활용 공모전 · 공공데이터 기반
          </span>
        </div>
      </footer>
    </main>
  );
}