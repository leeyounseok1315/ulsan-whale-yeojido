import { MAP_H, MAP_W, UlsanBaseMap, projectToMap } from "./UlsanBaseMap";
import { themeColor } from "@/backend/lib/theme";
import type { Course } from "@/backend/lib/types";

// 추천 코스를 여지도 위에 경로선 + 번호 마커로 표시 (W5 결과 뷰). 스팟 순서 = 백엔드 거리 순서화.
export function CourseMap({ course }: { course: Course }) {
  const R = 34; // 겹침 분산 반경
  const pts = course.stops.map((s, i) => ({ stop: s, n: i + 1, ...projectToMap(s.spot.lon, s.spot.lat) }));
  // 같은 위치(장생포 군집 등)에 겹치면 작은 원으로 밀어 분산
  for (let i = 0; i < pts.length; i++) {
    for (let j = 0; j < i; j++) {
      if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < R) {
        const a = i * 2.399;
        pts[i].x = pts[j].x + Math.cos(a) * R;
        pts[i].y = pts[j].y + Math.sin(a) * R;
      }
    }
  }
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <figure
      className="paper-grain relative overflow-hidden rounded-[4px] border border-ink/20"
      style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
    >
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-full w-full" role="img" aria-label="추천 코스 경로 지도">
        <g opacity={0.32}>
          <UlsanBaseMap />
        </g>
        {pts.length > 1 && (
          <path d={path} fill="none" stroke="var(--color-seal)" strokeWidth={3.5} strokeDasharray="1 9" strokeLinecap="round" opacity={0.85} />
        )}
        {pts.map((p) => (
          <g key={`${p.stop.spot.id}-${p.n}`} transform={`translate(${p.x} ${p.y})`}>
            <circle r={15} fill={themeColor(p.stop.spot.theme)} stroke="var(--color-paper-light)" strokeWidth={2.5} />
            <text y={6} textAnchor="middle" fontSize={16} fontWeight="bold" fontFamily="var(--font-body)" fill="var(--color-paper-light)">
              {p.n}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-paper-light/90 px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-soft">
        총 {course.distanceKm} km · {course.stops.length}곳
      </figcaption>
    </figure>
  );
}
