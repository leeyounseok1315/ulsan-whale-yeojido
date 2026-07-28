"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WHALE_THEMES, themeColor } from "@/backend/lib/theme";
import { isSeasonOpen } from "@/backend/lib/season";
import { SpotArtwork } from "@/frontend/components/ui/SpotArtwork";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";
import type { NearbySpot, WhaleSpot } from "@/backend/lib/types";

const proxied = (src: string) => `/api/img?u=${encodeURIComponent(src)}`;

async function fetchDetail(id: string): Promise<WhaleSpot> {
  const res = await fetch(`/api/spots/${id}`);
  if (!res.ok) throw new Error("detail");
  return (await res.json()).spot as WhaleSpot;
}

async function fetchNearby(id: string, type: string): Promise<NearbySpot[]> {
  const res = await fetch(`/api/nearby?spotId=${id}&type=${type}&limit=4`);
  if (!res.ok) return [];
  return (await res.json()).nearby as NearbySpot[];
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="wy-dotline flex gap-3 py-1.5 text-[12px]">
      <dt className="wy-legend w-14 shrink-0 text-[10px] text-[color:var(--color-chrome)]">{label}</dt>
      <dd className="whitespace-pre-line text-ink">{value}</dd>
    </div>
  );
}

// 마커 클릭 시 열리는 상세 — base 스팟으로 즉시 렌더 후 /api/spots/[id]의 detail* 통합으로 보강. (W8 주변 포함)
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
  const { data: food } = useQuery({
    queryKey: ["nearby", spot.id, "food"],
    queryFn: () => fetchNearby(spot.id, "food"),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const { data: lodging } = useQuery({
    queryKey: ["nearby", spot.id, "lodging"],
    queryFn: () => fetchNearby(spot.id, "lodging"),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const d = detail ?? spot;
  const hasInfo = Boolean(d.summary || d.detail?.useTime || d.detail?.restDate || d.detail?.useFee || d.tel);
  const images = d.images ?? [];
  const [mainImg, setMainImg] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const heroImg = mainImg ?? d.image ?? images[0] ?? null;
  const showImage = Boolean(heroImg) && failedSrc !== heroImg;

  useEffect(() => {
    setMainImg(null);
    setFailedSrc(null);
  }, [spot.id]);

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

  const nearbyFood = food ?? [];
  const nearbyLodge = lodging ?? [];
  const hasNearby = nearbyFood.length > 0 || nearbyLodge.length > 0;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`${spot.title} 상세 정보`}
      className="wy-fade-up wy-plate fixed inset-x-0 bottom-0 z-40 max-h-[84dvh] overflow-y-auto bg-canvas md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px]"
    >
      {/* 헤더 사진 */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden" style={{ backgroundColor: themeColor(spot.theme) }}>
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
          <SpotArtwork spot={spot} className="h-24 w-auto opacity-45" />
        )}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="닫기"
          className="wy-chip absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-[2px] bg-carbon text-white"
        >
          ✕
        </button>
        <span className="wy-chip wy-legend absolute left-2.5 top-2.5 rounded-[2px] bg-canvas-soft px-2 py-1 text-[10px] text-carbon">
          {theme.label}
        </span>
      </div>

      {/* 갤러리 */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto bg-carbon/90 p-2">
          {images.slice(0, 8).map((im) => (
            <button
              key={im}
              onClick={() => setMainImg(im)}
              aria-label="사진 크게 보기"
              className={`wy-chip h-12 w-16 shrink-0 overflow-hidden rounded-[2px] ${heroImg === im ? "ring-2 ring-signal" : ""}`}
            >
              <img src={proxied(im)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="p-3">
        <div className="mb-1 flex items-center gap-1.5">
          {spot.isCore && (
            <span className="wy-chip wy-legend rounded-[2px] bg-amber px-1.5 py-0.5 text-[9px] text-carbon">핵심 고래 스팟</span>
          )}
          <span className="wy-legend text-[10px] text-carbon/60">{spot.contentTypeLabel}</span>
        </div>

        <h2 className="text-[19px] font-extrabold leading-tight text-ink">{spot.title}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-carbon/70">{spot.address}</p>

        {spot.seasonal && (
          <div className="mt-2">
            <span className="wy-chip wy-legend inline-block rounded-[2px] bg-amber px-2 py-0.5 text-[10px] text-carbon">
              {isSeasonOpen(spot.seasonal, refDate) ? "운항 중" : "운항 휴지기"}
            </span>
            {!isSeasonOpen(spot.seasonal, refDate) && (
              <p className="mt-1.5 text-[12px] leading-snug text-ink-soft">{spot.seasonal.closedNote}</p>
            )}
          </div>
        )}

        {d.summary && <p className="mt-3 text-[13px] leading-relaxed text-ink">{d.summary}</p>}

        <dl className="mt-3">
          <InfoRow label="운영시간" value={d.detail?.useTime} />
          <InfoRow label="휴무" value={d.detail?.restDate} />
          <InfoRow label="요금" value={d.detail?.useFee} />
          <InfoRow label="전화" value={d.tel} />
        </dl>
        {isLoading && <p className="mt-2 text-[11px] text-carbon/60">상세 정보 불러오는 중…</p>}
        {isError && <p className="mt-2 text-[11px] text-[color:var(--color-seal2)]">상세 정보를 불러오지 못했어요.</p>}
        {!isLoading && !isError && !hasInfo && <p className="mt-2 text-[11px] text-carbon/60">제공된 운영 정보가 아직 없어요.</p>}

        {/* W8 — 주변 먹거리·숙박 */}
        {hasNearby && (
          <div className="mt-4">
            <SectionLabelBar title="Nearby · 주변" />
            <div className="mt-1.5 space-y-1.5">
              {nearbyFood.length > 0 && <NearbyGroup label="먹거리" items={nearbyFood} />}
              {nearbyLodge.length > 0 && <NearbyGroup label="숙박" items={nearbyLodge} />}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[10px] text-carbon/55">자료 · 공공데이터</span>
        </div>
      </div>
    </aside>
  );
}

function NearbyGroup({ label, items }: { label: string; items: NearbySpot[] }) {
  return (
    <div className="wy-plate bg-white p-2">
      <span className="wy-legend text-[9px] text-[color:var(--color-chrome)]">{label}</span>
      <ul className="mt-1 space-y-1">
        {items.map((n) => (
          <li key={n.id} className="flex items-center gap-2 text-[12px]">
            <span className="wy-chip flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-signal text-[8px] text-white">
              ●
            </span>
            <span className="flex-1 truncate text-ink">{n.title}</span>
            <span className="font-mono text-[10px] text-carbon/60">{n.distanceM}m</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
