"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PetroglyphWhale } from "@/frontend/components/ui/PetroglyphWhale";

// 커맨드 레이어 — 카본 슬랩 상단 내브 + 페일-스카이 서브내브(듀얼 내브 시그니처).
// 로고/마스코트는 울산고래여지도 자체 브랜드(닌텐도 IP 미사용).

const NAV = [
  { href: "/map", label: "여지도" },
  { href: "/recommend", label: "코스추천" },
];

function LogoPill() {
  return (
    <Link
      href="/"
      className="wy-chip inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1"
      aria-label="울산고래여지도 홈"
    >
      <PetroglyphWhale className="h-4 w-auto" strokeWidth={3} stroke="var(--color-seal2)" />
      <span className="wy-legend text-[12px] text-[color:var(--color-seal2)]">울산고래여지도</span>
    </Link>
  );
}

export function NavBar() {
  const path = usePathname();
  return (
    <nav className="wy-carbon relative z-30 flex items-center gap-2 px-3 py-1.5">
      <LogoPill />
      <div className="ml-1 flex items-center gap-1">
        {NAV.map((n) => {
          const active = path === n.href || (n.href !== "/" && path.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`wy-legend rounded-[2px] px-2.5 py-2 text-[13px] transition-colors ${
                active ? "bg-white/10 text-signal" : "text-[color:var(--color-navgold)] hover:text-signal"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/recommend"
        className="wy-chip wy-legend ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-[2px] bg-amber px-2.5 text-[11px] text-carbon"
      >
        코스 만들기
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 4l10 8-10 8" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </nav>
  );
}

export function SubnavStrip({ crumb }: { crumb?: string }) {
  return (
    <div className="flex items-center gap-2 bg-canvas-soft px-3 py-1 wy-inset">
      <span className="font-mono text-[10px] tracking-[0.3em] text-carbon/80">輿地圖</span>
      <span className="wy-legend text-[10px] text-ink-soft">{crumb ?? "고래의 시선으로 그린 울산"}</span>
      <span className="ml-auto wy-legend text-[10px] text-ink-soft/80">공공데이터</span>
    </div>
  );
}
