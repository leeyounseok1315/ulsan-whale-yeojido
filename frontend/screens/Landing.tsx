import Link from "next/link";
import { HeroSection } from "@/frontend/components/home/HeroSection";
import { SpotCarousel } from "@/frontend/components/home/SpotCarousel";

import {
  NavBar,
  SubnavStrip,
} from "@/frontend/components/chrome/NavBar";


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

      <HeroSection />

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