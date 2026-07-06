"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WHALE_THEMES, themeColor } from "@/backend/lib/theme";
import { isSeasonOpen } from "@/backend/lib/season";
import { Badge } from "@/frontend/components/ui/Badge";
import { PetroglyphWhale } from "@/frontend/components/ui/PetroglyphWhale";
import { SeasonBadge } from "@/frontend/components/ui/SeasonBadge";
import { SourceLabel } from "@/frontend/components/ui/SourceLabel";
import type { WhaleSpot } from "@/backend/lib/types";

const proxied = (src: string) => `/api/img?u=${encodeURIComponent(src)}`;

async function fetchDetail(id: string): Promise<WhaleSpot> {
  const res = await fetch(`/api/spots/${id}`);
  if (!res.ok) throw new Error("detail");
  return (await res.json()).spot as WhaleSpot;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 border-t border-ink/10 py-2 text-sm">
      <dt className="w-16 shrink-0 font-semibold text-ink-soft">{label}</dt>
      <dd className="whitespace-pre-line text-ink">{value}</dd>
    </div>
  );
}

// 마커 클릭 시 열리는 상세 — base 스팟으로 즉시 렌더 후 /api/spots/[id]의 detail* 통합으로 보강.
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

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["spotDetail", spot.id],
    queryFn: () => fetchDetail(spot.id),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const d = detail ?? spot; // 즉시 base → 도착 시 운영시간·요금·갤러리 보강
  const hasInfo = Boolean(d.summary || d.detail?.useTime || d.detail?.restDate || d.detail?.useFee || d.tel);
  const images = d.images ?? [];
  const [mainImg, setMainImg] = useState<string | null>(null);
  // 실패한 이미지를 src 단위로 추적 — 빠른 스팟 전환 시 이전 이미지의 중단 오류가
  // 새 스팟을 폴백으로 만들지 않도록(경합 방지).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const heroImg = mainImg ?? d.image ?? images[0] ?? null;
  const showImage = Boolean(heroImg) && failedSrc !== heroImg;

  // 스팟 변경 시 이미지 상태 초기화
  useEffect(() => {
    setMainImg(null);
    setFailedSrc(null);
  }, [spot.id]);

  // 접근성: 열릴 때 닫기 버튼 포커스, Esc로 닫기, 닫힐 때 직전 포커스로 복원.
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
      className="wy-fade-up fixed inset-x-0 bottom-0 z-30 max-h-[82dvh] overflow-y-auto rounded-t-xl border-t border-ink/25 bg-paper-light shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0"
    >
      {/* 헤더: 실제 사진(서버 프록시) 또는 암각화 플레이스홀더 */}
      <div className="relative flex h-44 items-center justify-center overflow-hidden" style={{ backgroundColor: themeColor(spot.theme) }}>
        {showImage ? (
          <img
            key={heroImg}
            src={proxied(heroImg as string)}
            alt={spot.title}
            className="h-full w-full object-cover"
            decoding="async"
            onError={() => setFailedSrc(heroImg)}
          />
        ) : (
          <PetroglyphWhale className="h-24 w-auto opacity-25" stroke="var(--color-paper-light)" strokeWidth={3} />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />
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

      {/* 갤러리 썸네일 (2장 이상일 때) */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-ink/10 bg-paper-light/60 p-2">
          {images.slice(0, 8).map((im) => (
            <button
              key={im}
              onClick={() => setMainImg(im)}
              aria-label="사진 크게 보기"
              className={`h-12 w-16 shrink-0 overflow-hidden rounded-[3px] border ${heroImg === im ? "border-seal" : "border-ink/20"}`}
            >
              <img src={proxied(im)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

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

        {d.summary && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{d.summary}</p>}

        <dl className="mt-4">
          <InfoRow label="운영시간" value={d.detail?.useTime} />
          <InfoRow label="휴무" value={d.detail?.restDate} />
          <InfoRow label="요금" value={d.detail?.useFee} />
          <InfoRow label="전화" value={d.tel} />
        </dl>
        {isLoading && <p className="mt-2 text-[12px] text-ink-faint">상세 정보 불러오는 중…</p>}
        {isError && <p className="mt-2 text-[12px] text-seal-deep">상세 정보를 불러오지 못했어요. 기본 정보만 표시합니다.</p>}
        {!isLoading && !isError && !hasInfo && (
          <p className="mt-2 text-[12px] text-ink-faint">제공된 운영 정보가 아직 없어요.</p>
        )}

        <div className="mt-5 border-t border-ink/10 pt-3">
          <SourceLabel />
        </div>
      </div>
    </aside>
  );
}
