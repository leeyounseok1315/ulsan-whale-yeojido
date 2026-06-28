"use client";

import { useEffect, useRef } from "react";
import { WHALE_THEMES, themeColor } from "@/lib/theme";
import { isSeasonOpen } from "@/lib/season";
import { Badge } from "@/components/ui/Badge";
import { PetroglyphWhale } from "@/components/ui/PetroglyphWhale";
import { SeasonBadge } from "@/components/ui/SeasonBadge";
import { SourceLabel } from "@/components/ui/SourceLabel";
import type { WhaleSpot } from "@/lib/types";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 border-t border-ink/10 py-2 text-sm">
      <dt className="w-16 shrink-0 font-semibold text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

// 마커 클릭 시 열리는 상세 — 데스크톱은 우측 첩(帖), 모바일은 하단 시트.
export function SpotDetailPanel({
  spot,
  refDate,
  onClose,
}: {
  spot: WhaleSpot;
  refDate?: string;
  onClose: () => void;
}) {
  const theme = WHALE_THEMES[spot.theme];
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 접근성: 열릴 때 닫기 버튼으로 포커스, Esc로 닫기, 닫힐 때 직전 포커스(마커)로 복원.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, []);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`${spot.title} 상세 정보`}
      className="wy-fade-up fixed inset-x-0 bottom-0 z-30 max-h-[78dvh] overflow-y-auto rounded-t-xl border-t border-ink/25 bg-paper-light shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0"
    >
      {/* 헤더 이미지 자리 (firstimage 미수신 → 암각화 고래 플레이스홀더) */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden" style={{ backgroundColor: themeColor(spot.theme) }}>
        <PetroglyphWhale className="h-24 w-auto opacity-25" stroke="var(--color-paper-light)" strokeWidth={3} />
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper-light/95 text-ink shadow hover:bg-paper-light"
        >
          ✕
        </button>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper-light/95 px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: themeColor(spot.theme) }} />
          {theme.label}
        </span>
      </div>

      <div className="px-5 pb-6 pt-4">
        <div className="mb-1 flex items-center gap-2">
          {spot.isCore && <Badge tone="core">핵심 고래 스팟</Badge>}
          <span className="text-[11px] text-ink-faint">{spot.contentTypeLabel}</span>
        </div>

        <h2 className="font-display text-2xl font-bold leading-tight text-ink">{spot.title}</h2>
        <p className="mt-1 font-mono text-[12px] text-ink-faint">{spot.address}</p>

        {spot.seasonal && (
          <div className="mt-3">
            <SeasonBadge open={isSeasonOpen(spot.seasonal, refDate)} label={spot.seasonal.label} />
            {!isSeasonOpen(spot.seasonal, refDate) && (
              <p className="mt-1.5 text-[12px] leading-snug text-ink-soft">{spot.seasonal.closedNote}</p>
            )}
          </div>
        )}

        {spot.summary && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{spot.summary}</p>}

        <dl className="mt-4">
          <InfoRow label="운영시간" value={spot.detail?.useTime} />
          <InfoRow label="휴무" value={spot.detail?.restDate} />
          <InfoRow label="요금" value={spot.detail?.useFee} />
          <InfoRow label="전화" value={spot.tel} />
        </dl>

        <div className="mt-5 border-t border-ink/10 pt-3">
          <SourceLabel />
        </div>
      </div>
    </aside>
  );
}
