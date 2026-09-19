"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";

const NAV = [
  { href: "/map", label: "여지도" },
  { href: "/recommend", label: "코스추천" },
  { href: "/passport", label: "고래여권" },
];

function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 items-center gap-2"
      aria-label="울산고래여지도 홈"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ice transition-transform duration-200 group-hover:-translate-y-0.5">
        <WhaleMascot className="h-7 w-auto" />
      </div>

      <div className="hidden sm:block">
        <p className="text-[13px] font-extrabold tracking-[-0.03em] text-carbon">
          울산고래여지도
        </p>
        <p className="mt-0.5 text-[7px] font-bold tracking-[0.16em] text-ink-faint">
          ULSAN WHALE MAP
        </p>
      </div>
    </Link>
  );
}

export function NavBar() {
  const path = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-hairline/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[60px] w-full max-w-7xl items-center gap-2 px-3 sm:px-5">
        <Logo />

        <div className="ml-1 flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:ml-5 sm:justify-start sm:gap-1">
          {NAV.map((item) => {
            const active =
              path === item.href ||
              (item.href !== "/" && path.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-bold transition-all duration-200 sm:px-3.5 sm:text-[12px]",
                  active
                    ? "bg-ice text-water shadow-sm"
                    : "text-ink-soft hover:bg-canvas-soft hover:text-carbon",
                ].join(" ")}
              >
                {item.label}

                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-[7px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-water"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <Link
          href="/recommend"
          className="wy-primary ml-auto hidden min-h-10 shrink-0 items-center gap-2 px-4 text-[11px] font-extrabold sm:inline-flex"
        >
          코스 만들기
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M8 4l10 8-10 8"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </nav>
  );
}

export function SubnavStrip({ crumb }: { crumb?: string }) {
  return (
    <div className="relative z-30 border-b border-hairline/60 bg-white/55 backdrop-blur-lg">
      <div className="mx-auto flex min-h-8 w-full max-w-7xl items-center gap-2 px-4 sm:px-5">
        <Link
          href="/"
          className="text-[9px] font-bold tracking-[0.08em] text-water transition hover:text-carbon"
        >
          HOME
        </Link>

        <span className="text-[9px] text-ink-faint/50">/</span>

        <span className="text-[10px] font-semibold text-ink-soft">
          {crumb ?? "고래의 시선으로 그린 울산"}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          <span className="hidden text-[9px] font-semibold text-ink-faint sm:inline">
            공공데이터 기반
          </span>
        </div>
      </div>
    </div>
  );
}