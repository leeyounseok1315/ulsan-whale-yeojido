import Link from "next/link";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import { MAP_H, MAP_W, UlsanBaseMap } from "@/frontend/components/map/UlsanBaseMap";
import { NavBar, SubnavStrip } from "@/frontend/components/chrome/NavBar";
import { Plate } from "@/frontend/components/chrome/Plate";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";
import { ChromeLink, ArrowBadge } from "@/frontend/components/chrome/ChromeButton";

// 콘솔 페이스플레이트 랜딩 (getdesign.md) — 카본 커맨드 레이어 + 페리윙클 크롬 본체 +
// 사진 대신 여지도 필드 위 박스아트 워드마크 + 반구대 고래 마스코트. 닌텐도 IP 미사용.

const MODULES = [
  {
    label: "여지도 지도",
    desc: "울산 관광지와 고래의 길을 지도 위에서 탐색해요.",
    href: "/map",
    cta: "펼치기",
  },
  {
    label: "맞춤 코스 추천",
    desc: "동행·기간·관심사에 맞춰 하루~2박3일 여행 코스를 추천해요.",
    href: "/recommend",
    cta: "추천받기",
  },
  {
    label: "실시간 여행 조건 반영",
    desc: "운영시간·휴무일·축제 기간·계절 정보를 추천 코스에 자동으로 반영해요.",
    href: null,
    cta: null,
  },
];

export default function Landing() {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <NavBar />
      <SubnavStrip crumb="홈" />

      <div className="mx-auto w-full max-w-4xl flex-1 px-3 py-3 sm:px-4 sm:py-4">
        {/* ── 히어로 플레이트 — 여지도 필드 + 박스아트 워드마크 + 마스코트 ── */}
        <Plate tone="lavender" chamfer className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply">
            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
              <UlsanBaseMap />
            </svg>
          </div>

          <div className="relative grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <p className="wy-legend text-[11px] tracking-[0.28em] text-carbon/70">輿地圖 · 고래의 시선</p>
              <h1 className="wy-boxart mt-2 text-[40px] leading-[0.98] sm:text-[58px]">
                울산을
                <br />
                고래의 길로
              </h1>
              <p className="mt-4 max-w-md text-[13px] font-semibold leading-relaxed text-carbon/90">
                행정구역이 아니라 고래를 따라 울산을 펼칩니다. 장생포에서 반구대까지 —
                동행과 기간에 맞춘 코스를 지도 위에서 받아 보세요.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <ChromeLink href="/map" variant="submit">
                  여지도 펼치기
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M8 4l10 8-10 8" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </ChromeLink>
                <ChromeLink href="/recommend" variant="primary">
                  고래 코스 추천
                </ChromeLink>
              </div>
            </div>

            {/* 마스코트 — 반구대 고래 + 말풍선 */}
            <div className="hidden shrink-0 flex-col items-center sm:flex">
              <div className="wy-chip relative rounded-[10px] bg-white px-3 py-1.5">
                <span className="wy-legend text-[10px] text-carbon">고래의 시선으로!</span>
                <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 bg-white" />
              </div>
              <WhaleMascot animate className="mt-2 h-32 w-auto" />
            </div>
          </div>
        </Plate>

        {/* ── 무엇을 하나 — 콘텐츠 모듈 3플레이트 ── */}
        <div className="mt-3">
          <SectionLabelBar title="Whale Yeojido · 안내" />
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
            {MODULES.map((m) => (
              <Plate key={m.label} tone="surface" className="flex flex-col p-3">
                <span className="wy-legend text-[11px] text-[color:var(--color-chrome)]">{m.label}</span>
                <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-ink">{m.desc}</p>
                {m.href && m.cta ? (
                  <Link
                    href={m.href}
                    className="mt-2.5 inline-flex items-center gap-1.5 self-start text-[12px] font-bold text-[color:var(--color-chrome)] hover:text-signal"
                  >
                    <ArrowBadge size={20} />
                    {m.cta}
                  </Link>
                ) : (
                  <span className="mt-2.5 inline-flex items-center gap-1.5 self-start text-[11px] font-bold text-carbon/60">
                    추천 시 자동 적용
                  </span>
                )}
              </Plate>
            ))}
          </div>
        </div>
      </div>

      {/* ── 카본 푸터 ── */}
      <footer className="wy-carbon wy-chamfer mt-3 px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-1">
          <span className="wy-legend text-[10px] text-canvas-soft">울산큰고래 · 2026 관광데이터 활용 공모전</span>
          <span className="wy-chip ml-auto rounded-[2px] bg-amber px-2 py-0.5 text-[10px] font-bold text-carbon">
            공공데이터
          </span>
        </div>
      </footer>
    </main>
  );
}

