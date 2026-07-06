import { ButtonLink } from "@/frontend/components/ui/Button";
import { PetroglyphWhale } from "@/frontend/components/ui/PetroglyphWhale";
import { SourceLabel } from "@/frontend/components/ui/SourceLabel";
import { MAP_H, MAP_W, UlsanBaseMap } from "@/frontend/components/map/UlsanBaseMap";

export default function Landing() {
  return (
    <main className="paper-grain relative flex min-h-dvh flex-col overflow-hidden">
      {/* 옅게 깔린 여지도 — 컨셉 배경 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <UlsanBaseMap />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="wy-fade-up font-mono text-xs tracking-[0.3em] text-seal" style={{ animationDelay: "0.1s" }}>
          輿地圖 · 고래의 시선
        </p>
        <h1
          className="wy-fade-up mt-4 font-display text-5xl font-extrabold leading-[1.14] text-ink md:text-6xl"
          style={{ animationDelay: "0.2s" }}
        >
          울산을
          <br />
          고래의 길로
          <br />
          다시 그리다
        </h1>

        <PetroglyphWhale animate className="wy-swim mt-9 h-28 w-auto md:h-36" strokeWidth={2.4} />

        <p
          className="wy-fade-up mt-9 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg"
          style={{ animationDelay: "0.5s" }}
        >
          김정호의 여지도처럼, 행정구역이 아니라 고래를 따라 울산을 펼칩니다.
          장생포에서 반구대까지 — 동행과 기간에 맞춘 코스를 지도 위에서 받아 보세요.
        </p>

        <div
          className="wy-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.7s" }}
        >
          <ButtonLink href="/map">여지도 펼치기</ButtonLink>
          <ButtonLink href="/recommend" variant="secondary">
            고래 코스 추천받기
          </ButtonLink>
        </div>
      </div>

      <footer className="relative z-10 flex items-center justify-center pb-6">
        <SourceLabel />
      </footer>
    </main>
  );
}
