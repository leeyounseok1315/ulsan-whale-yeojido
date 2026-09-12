"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WHALE_THEMES, themeColor } from "@/backend/lib/theme";
import { isSeasonOpen } from "@/backend/lib/season";
import { SpotArtwork } from "@/frontend/components/ui/SpotArtwork";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import { Plate } from "@/frontend/components/chrome/Plate";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";
import { ChromeButton } from "@/frontend/components/chrome/ChromeButton";
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

// 마스코트가 그 장소에서 건네는 한마디 — 도착한 실감을 준다.
function mascotLine(spot: WhaleSpot): string {
  if (spot.contentTypeId === "15") return "축제가 한창이야! 함께 즐기자.";
  if (spot.contentTypeId === "39") return "여기서 든든하게 한 끼 어때?";
  switch (spot.theme) {
    case "heritage":
      return "선사시대 고래가 바위에 새겨져 있어!";
    case "observe":
      return "바다로 고래를 만나러 가 볼까?";
    case "nature":
      return "강과 억새를 따라 천천히 쉬어 가자.";
    default:
      return "고래 이야기가 가득한 곳이야!";
  }
}

function InfoChip({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="wy-plate bg-white p-2">
      <div className="wy-legend text-[9px] text-[color:var(--color-chrome)]">{label}</div>
      <div className="mt-0.5 whitespace-pre-line text-[12px] leading-snug text-ink">{value}</div>
    </div>
  );
}

// 몰입형 '장소 도착' 화면 — 마커를 누르면 그 장소에 입장한 듯 전체화면으로 연다.
export function SpotVisit({
  spot,
  refDate,
  onClose,
}: {
  spot: WhaleSpot;
  refDate?: string;
  onClose: () => void;
}) {
  const theme = WHALE_THEMES[spot.theme];
  const backRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { data: detail, isLoading } = useQuery({
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
  const { data: cafe } = useQuery({
    queryKey: ["nearby", spot.id, "cafe"],
    queryFn: () => fetchNearby(spot.id, "cafe"),
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
  const images = d.images ?? [];
  const [mainImg, setMainImg] = useState<string | null>(null);
  // 이미지 실패를 src 단위로 추적 — 빠른 스팟 전환 시 이전 이미지 중단 오류가 새 스팟에 새지 않게(경합 방지).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const heroImg = mainImg ?? d.image ?? images[0] ?? null;
  const showImage = Boolean(heroImg) && failedSrc !== heroImg;

  useEffect(() => {
    setMainImg(null);
    setFailedSrc(null);
  }, [spot.id]);

  // 접근성: 열릴 때 뒤로가기 포커스, Esc로 닫기, 닫힐 때 직전 포커스 복원.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    backRef.current?.focus();
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
  const nearbyCafe = cafe ?? [];
  const nearbyLodge = lodging ?? [];
  const tone = themeColor(spot.theme);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${spot.title} 방문`} className="fixed inset-0 z-50 flex flex-col">
      {/* 배경 — 그 장소 사진을 흐리게 깔아 '그 안에 있는' 깊이감 */}
      <div aria-hidden className="absolute inset-0" style={{ backgroundColor: tone }}>
        {showImage && (
          <img src={proxied(heroImg as string)} alt="" className="h-full w-full scale-110 object-cover opacity-45 blur-md" />
        )}
        <div className="absolute inset-0 bg-carbon/55" />
      </div>

      {/* 커맨드 바 — 지도로 돌아가기 */}
      <div className="wy-carbon relative z-10 flex items-center gap-2 px-3 py-2">
        <button
          ref={backRef}
          onClick={onClose}
          className="wy-chip wy-legend inline-flex min-h-11 items-center gap-1.5 rounded-[2px] bg-canvas-soft px-3 text-[12px] text-carbon"
        >
          ← 지도로
        </button>
        <span className="wy-legend text-[11px] text-signal">지금, 여기</span>
        <span className="wy-chip wy-legend ml-auto rounded-[2px] bg-amber px-2 py-1 text-[10px] text-carbon">{theme.label}</span>
      </div>

      {/* 본문 — 도착 카드 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto w-full max-w-2xl">
          {/* 히어로 사진 + 박스아트 이름 + 마스코트 */}
          <Plate tone="lavender" chamfer className="wy-fade-up relative overflow-hidden">
            <div className="relative h-52 w-full overflow-hidden sm:h-72" style={{ backgroundColor: tone }}>
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
                <div className="flex h-full items-center justify-center">
                  <SpotArtwork spot={spot} className="h-32 w-auto opacity-60" />
                </div>
              )}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-carbon/85 to-transparent" />
              {spot.isCore && (
                <span className="wy-chip wy-legend absolute left-3 top-3 rounded-[2px] bg-amber px-2 py-0.5 text-[10px] text-carbon">
                  핵심 고래 스팟
                </span>
              )}
              <div className="absolute inset-x-3 bottom-2">
                <p className="wy-legend text-[10px] text-white/80">도착 · {spot.contentTypeLabel}</p>
                <h1 className="wy-boxart text-[26px] leading-none text-white sm:text-[36px]">{spot.title}</h1>
              </div>
            </div>

            {/* 마스코트 말풍선 — 그 자리에서 한마디 */}
            <div className="flex items-end gap-2 px-3 py-2.5">
              <WhaleMascot className="h-14 w-auto shrink-0" />
              <div className="wy-chip relative mb-2 rounded-[10px] bg-white px-3 py-1.5">
                <span className="text-[12px] font-semibold text-carbon">{mascotLine(spot)}</span>
                <span className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 bg-white" />
              </div>
            </div>
          </Plate>

          <p className="mt-2 px-1 font-mono text-[11px] text-white/80">{spot.address}</p>

          {spot.seasonal && (
            <Plate tone="surface" className="mt-2 flex items-center gap-2 px-3 py-2">
              <span className="wy-chip wy-legend rounded-[2px] bg-amber px-2 py-0.5 text-[10px] text-carbon">
                {isSeasonOpen(spot.seasonal, refDate) ? "운항 중" : "운항 휴지기"}
              </span>
              {!isSeasonOpen(spot.seasonal, refDate) && (
                <span className="text-[12px] leading-snug text-ink-soft">{spot.seasonal.closedNote}</span>
              )}
            </Plate>
          )}

          {d.summary && (
            <Plate tone="surface" className="mt-2 p-3">
              <p className="text-[13px] leading-relaxed text-ink">{d.summary}</p>
            </Plate>
          )}

          {/* 갤러리 — 둘러보기 */}
          {images.length > 1 && (
            <div className="mt-3">
              <SectionLabelBar title="둘러보기" />
              <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
                {images.slice(0, 10).map((im) => (
                  <button
                    key={im}
                    onClick={() => setMainImg(im)}
                    aria-label="사진 크게 보기"
                    className={`wy-chip h-16 w-24 shrink-0 overflow-hidden rounded-[2px] ${heroImg === im ? "ring-2 ring-signal" : ""}`}
                  >
                    <img src={proxied(im)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 운영 정보 */}
          {(d.detail?.useTime || d.detail?.restDate || d.detail?.useFee || d.tel) && (
            <div className="mt-3">
              <SectionLabelBar title="운영 정보" />
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <InfoChip label="운영시간" value={d.detail?.useTime} />
                <InfoChip label="휴무" value={d.detail?.restDate} />
                <InfoChip label="요금" value={d.detail?.useFee} />
                <InfoChip label="전화" value={d.tel} />
              </div>
            </div>
          )}
          {isLoading && <p className="mt-2 px-1 text-[11px] text-white/70">그 장소 정보를 불러오는 중…</p>}

          {/* 주변 — 이 자리에서 가까운 곳 */}
          {(nearbyFood.length > 0 || nearbyCafe.length > 0 || nearbyLodge.length > 0) && (
            <div className="mt-3">
              <SectionLabelBar title="이 근처" />
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {nearbyFood.length > 0 && <NearbyGroup label="먹거리" items={nearbyFood} />}
                {nearbyCafe.length > 0 && <NearbyGroup label="카페" items={nearbyCafe} />}
                {nearbyLodge.length > 0 && <NearbyGroup label="숙박" items={nearbyLodge} />}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between pb-2">
            <span className="font-mono text-[10px] text-white/60">자료 · 공공데이터</span>
            <ChromeButton variant="submit" onClick={onClose}>
              ← 여지도로 돌아가기
            </ChromeButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function NearbyGroup({ label, items }: { label: string; items: NearbySpot[] }) {
  return (
    <Plate tone="surface" className="p-2">
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
    </Plate>
  );
}
