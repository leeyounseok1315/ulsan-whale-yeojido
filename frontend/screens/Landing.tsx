import Link from "next/link";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import {
  MAP_H,
  MAP_W,
  UlsanBaseMap,
} from "@/frontend/components/map/UlsanBaseMap";
import {
  NavBar,
  SubnavStrip,
} from "@/frontend/components/chrome/NavBar";
import {
  ChromeLink,
} from "@/frontend/components/chrome/ChromeButton";

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
    eyebrow: "WHALE HERITAGE",
    title: "장생포",
    desc: "고래와 함께 살아온 울산의 이야기가 시작되는 곳",
    emoji: "🐋",
    href: "/map",
    tone: "from-[#d8ecff] via-[#edf7ff] to-[#fffaf4]",
  },
  {
    eyebrow: "HISTORY",
    title: "반구대",
    desc: "수천 년 전 바위에 새겨진 고래와 사람의 기록",
    emoji: "🪨",
    href: "/map",
    tone: "from-[#e9e5ff] via-[#f3f1ff] to-[#fffaf4]",
  },
  {
    eyebrow: "OCEAN",
    title: "대왕암공원",
    desc: "푸른 바다와 기암이 이어지는 울산의 대표 해안 풍경",
    emoji: "🌊",
    href: "/map",
    tone: "from-[#d9f2f5] via-[#edfafa] to-[#fffaf4]",
  },
];

export default function Landing() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
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

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-7 pt-5 sm:px-6 sm:pb-10 sm:pt-8">
          <div className="wy-plate relative overflow-hidden bg-white/70 backdrop-blur-xl">
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

                <p className="mt-6 text-[13px] font-bold tracking-[-0.02em] text-water">
                  바다를 품은 도시, 울산
                </p>

                <h1 className="wy-ocean-title mt-2 text-[52px] leading-[0.98] sm:text-[68px] lg:text-[78px]">
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

                <div className="mt-7 flex flex-wrap gap-3">
                  <ChromeLink href="/map" variant="submit">
                    여지도 펼치기
                    <span aria-hidden>→</span>
                  </ChromeLink>

                  <ChromeLink href="/recommend" variant="primary">
                    추천 코스 보기
                  </ChromeLink>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-ink-faint">
                  <span>✓ 한국관광공사 OpenAPI</span>
                  <span>✓ GPS 방문 인증</span>
                  <span>✓ 개인화 코스 추천</span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="relative hidden min-h-[340px] items-center justify-center lg:flex">
                <div
                  aria-hidden
                  className="absolute h-72 w-72 rounded-full bg-white/55 blur-2xl"
                />

                <div
                  aria-hidden
                  className="absolute left-[4%] top-[16%] h-2 w-2 rounded-full bg-water/30"
                />
                <div
                  aria-hidden
                  className="absolute right-[8%] top-[30%] h-3 w-3 rounded-full bg-water/20"
                />
                <div
                  aria-hidden
                  className="absolute bottom-[18%] left-[12%] h-2.5 w-2.5 rounded-full bg-lavender"
                />

                <div className="relative flex flex-col items-center">
                  <div className="wy-glass relative mb-1 px-4 py-2">
                    <p className="text-[12px] font-bold text-carbon">
                      “고래가 알려주는 특별한 울산 여행!”
                    </p>

                    <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white/80" />
                  </div>

                  <WhaleMascot
                    animate
                    className="wy-float relative z-10 mt-4 h-52 w-auto"
                  />

                  <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-water">
                    <span className="h-px w-12 bg-water/30" />
                    Ulsan Whale Road
                    <span className="h-px w-12 bg-water/30" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature strip */}
            <div className="relative z-10 grid border-t border-white/70 bg-white/65 backdrop-blur-lg sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <div
                  key={feature.title}
                  className={[
                    "flex gap-3 px-5 py-4",
                    index !== 0 ? "border-t border-hairline/70 sm:border-t-0" : "",
                    index % 2 !== 0 ? "sm:border-l sm:border-hairline/70" : "",
                    index >= 2
                      ? "lg:border-l lg:border-hairline/70"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ice text-lg">
                    {feature.icon}
                  </div>

                  <div>
                    <p className="text-[12px] font-extrabold text-carbon">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-ink-soft">
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

              <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em] text-carbon sm:text-[34px]">
                울산, 고래를 따라 만나는 특별한 순간들
              </h2>

              <p className="mt-2 text-[12px] leading-6 text-ink-soft">
                바다도, 역사도, 사람도 모두가 여행이 되는 곳.
              </p>
            </div>

            <Link
              href="/map"
              className="text-[12px] font-bold text-water transition hover:text-carbon"
            >
              여지도에서 모두 보기 →
            </Link>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {SPOTS.map((spot) => (
              <Link
                key={spot.title}
                href={spot.href}
                className={`wy-image-card group relative min-h-[250px] bg-gradient-to-br ${spot.tone} p-5 transition duration-300 hover:-translate-y-1`}
              >
                <div
                  aria-hidden
                  className="absolute -right-5 -top-5 text-[110px] opacity-[0.12] transition-transform duration-300 group-hover:scale-110"
                >
                  {spot.emoji}
                </div>

                <div className="relative flex h-full flex-col">
                  <p className="wy-legend text-[9px] text-water">
                    {spot.eyebrow}
                  </p>

                  <div className="mt-auto pt-28">
                    <div className="mb-3 text-3xl">
                      {spot.emoji}
                    </div>

                    <h3 className="text-[21px] font-extrabold tracking-[-0.03em] text-carbon">
                      {spot.title}
                    </h3>

                    <p className="mt-2 max-w-[260px] text-[11px] leading-5 text-ink-soft">
                      {spot.desc}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-water">
                      장소 살펴보기
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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