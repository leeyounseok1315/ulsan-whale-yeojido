import type { WhaleSpot } from "@/backend/lib/types";
import { PetroglyphWhale } from "./PetroglyphWhale";

// 사진이 없는 스팟용 큐레이션 일러스트 (여지도 톤 라인아트).
// 우선순위: 스팟 id별 전용 그림 → 콘텐츠타입 → 암각화 고래(기본).

type ArtProps = { stroke?: string; className?: string };

// 장생포 포구 마을 (고래문화특구)
function VillageArt({ stroke = "var(--color-paper-light)", className }: ArtProps) {
  return (
    <svg viewBox="0 0 240 150" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 74 Q46 56 86 68 T166 62 T240 70" opacity={0.45} />
        {/* 한옥 3채 (곡선 지붕) */}
        <path d="M40 104 V82 H70 V104" />
        <path d="M31 82 Q55 67 79 82" />
        <path d="M96 104 V72 H140 V104" />
        <path d="M85 72 Q118 55 151 72" />
        <path d="M112 104 V90 H124 V104" opacity={0.8} />
        <path d="M164 104 V84 H190 V104" />
        <path d="M155 84 Q177 71 199 84" />
        <path d="M0 104 H240" />
        {/* 고래 */}
        <path d="M150 126 C158 118 178 117 192 123 C199 126 200 131 194 134 C184 138 164 138 151 133 C146 131 146 128 150 126 Z" />
        <path d="M150 126 C146 123 142 121 138 120 M194 134 C198 131 203 130 207 130" />
        {/* 물결 */}
        <path d="M22 120 q10 -5 20 0 q10 5 20 0" opacity={0.55} />
        <path d="M34 133 q10 -5 20 0 q10 5 20 0" opacity={0.55} />
      </g>
    </svg>
  );
}

// 미식 — 뚝배기·김·젓가락 + 작은 고래 (음식점)
function FoodArt({ stroke = "var(--color-paper-light)", className }: ArtProps) {
  return (
    <svg viewBox="0 0 240 150" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {/* 김 */}
        <path d="M100 64 q-8 -12 4 -22 q10 -8 2 -22" opacity={0.65} />
        <path d="M122 58 q-8 -12 4 -22 q10 -8 2 -22" opacity={0.65} />
        <path d="M144 64 q-8 -12 4 -22 q10 -8 2 -22" opacity={0.65} />
        {/* 그릇 */}
        <path d="M68 86 Q122 130 176 86" />
        <path d="M60 86 H184" />
        <path d="M76 92 Q122 120 168 92" opacity={0.5} />
        {/* 젓가락 */}
        <path d="M150 80 L200 54 M156 86 L206 60" />
        {/* 작은 고래 */}
        <path d="M36 118 C42 112 56 111 66 115 C72 117 73 121 68 123 C60 126 46 126 37 122 C33 121 33 119 36 118 Z" opacity={0.85} />
      </g>
    </svg>
  );
}

const BY_ID: Record<string, (p: ArtProps) => React.ReactElement> = {
  "3495467": VillageArt, // 장생포고래문화특구
  "1019409": FoodArt, // 고래고기원조할매집
};
const BY_TYPE: Record<string, (p: ArtProps) => React.ReactElement> = {
  "39": FoodArt, // 음식점
};

export function SpotArtwork({ spot, className }: { spot: WhaleSpot; className?: string }) {
  const Art = BY_ID[spot.id] ?? BY_TYPE[spot.contentTypeId];
  if (!Art) return <PetroglyphWhale className={className} stroke="var(--color-paper-light)" strokeWidth={3} />;
  return <Art className={className} />;
}
