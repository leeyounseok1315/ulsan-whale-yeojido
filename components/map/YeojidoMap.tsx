"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WhaleSpot } from "@/lib/types";
import { MAP_H, MAP_W, UlsanBaseMap, projectToMap } from "./UlsanBaseMap";
import { WhaleMarker } from "./WhaleMarker";

type View = { x: number; y: number; k: number };
type Pt = { s: WhaleSpot; x: number; y: number };

const K_MIN = 0.6;
const K_MAX = 4.5;
const PAN_STEP = 70; // 키보드 패닝 한 칸 (viewBox 단위)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// 겹치는 마커(예: 장생포 군집)를 중심 주위로 부채꼴 분산 — 데이터는 그대로 두고 표시만 분리.
function spreadOverlaps(pts: Pt[]): Pt[] {
  const R = 30;
  const groups: { cx: number; cy: number; items: Pt[] }[] = [];
  for (const p of pts) {
    const g = groups.find((g) => Math.hypot(g.cx - p.x, g.cy - p.y) < R * 1.6);
    if (g) {
      g.items.push(p);
      g.cx = g.items.reduce((a, b) => a + b.x, 0) / g.items.length;
      g.cy = g.items.reduce((a, b) => a + b.y, 0) / g.items.length;
    } else {
      groups.push({ cx: p.x, cy: p.y, items: [p] });
    }
  }
  const out: Pt[] = [];
  for (const g of groups) {
    if (g.items.length === 1) {
      out.push(g.items[0]);
      continue;
    }
    const n = g.items.length;
    g.items.forEach((p, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      out.push({ s: p.s, x: g.cx + Math.cos(a) * R, y: g.cy + Math.sin(a) * R });
    });
  }
  return out;
}

export function YeojidoMap({
  spots,
  selectedId,
  onSelect,
}: {
  spots: WhaleSpot[];
  selectedId: string | null;
  onSelect: (s: WhaleSpot | null) => void;
}) {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number } | null>(null);
  const moved = useRef(false); // 패닝 여부 — 클릭(빈 곳 선택해제)에서 읽어 패닝 후 닫힘을 막는다.

  const points = useMemo(
    () => spreadOverlaps(spots.map((s) => ({ s, ...projectToMap(s.lon, s.lat) }))),
    [spots],
  );

  const scaleOf = (r: DOMRect) => Math.min(r.width / MAP_W, r.height / MAP_H);
  const toVb = (cx: number, cy: number, r: DOMRect) => {
    const s = scaleOf(r);
    const ox = (r.width - MAP_W * s) / 2;
    const oy = (r.height - MAP_H * s) / 2;
    return { x: (cx - r.left - ox) / s, y: (cy - r.top - oy) / s };
  };

  const zoomAt = (p: { x: number; y: number }, factor: number) =>
    setView((v) => {
      const k2 = clamp(v.k * factor, K_MIN, K_MAX);
      const mx = (p.x - v.x) / v.k;
      const my = (p.y - v.y) / v.k;
      return { k: k2, x: p.x - k2 * mx, y: p.y - k2 * my };
    });

  // 휠 줌 — React onWheel은 passive로 등록돼 preventDefault가 무효라 네이티브 비패시브로 붙인다.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(toVb(e.clientX, e.clientY, r), e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY };
    moved.current = false;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = box.current!.getBoundingClientRect();
    const s = scaleOf(r);
    const dx = (e.clientX - drag.current.px) / s;
    const dy = (e.clientY - drag.current.py) / s;
    if (Math.abs(e.clientX - drag.current.px) + Math.abs(e.clientY - drag.current.py) > 3) moved.current = true;
    drag.current = { px: e.clientX, py: e.clientY };
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowUp: () => setView((v) => ({ ...v, y: v.y + PAN_STEP })),
      ArrowDown: () => setView((v) => ({ ...v, y: v.y - PAN_STEP })),
      ArrowLeft: () => setView((v) => ({ ...v, x: v.x + PAN_STEP })),
      ArrowRight: () => setView((v) => ({ ...v, x: v.x - PAN_STEP })),
      "+": () => zoomAt({ x: MAP_W / 2, y: MAP_H / 2 }, 1.2),
      "=": () => zoomAt({ x: MAP_W / 2, y: MAP_H / 2 }, 1.2),
      "-": () => zoomAt({ x: MAP_W / 2, y: MAP_H / 2 }, 1 / 1.2),
      "0": () => setView({ x: 0, y: 0, k: 1 }),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const center = () => ({ x: MAP_W / 2, y: MAP_H / 2 });

  return (
    <div
      ref={box}
      className="paper-grain relative h-full w-full touch-none select-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="h-full w-full"
        role="application"
        tabIndex={0}
        aria-label="울산 고래 여지도 — 화살표 키로 이동, +·− 키로 확대·축소, 마커는 Tab으로 이동"
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
        onKeyDown={onKeyDown}
        onClick={() => {
          if (moved.current) {
            moved.current = false;
            return;
          }
          onSelect(null);
        }}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <UlsanBaseMap />
          {points.map((p) => (
            <WhaleMarker
              key={p.s.id}
              x={p.x}
              y={p.y}
              k={view.k}
              spot={p.s}
              selected={p.s.id === selectedId}
              onSelect={() => onSelect(p.s)}
            />
          ))}
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        {[
          { t: "+", f: () => zoomAt(center(), 1.25), l: "확대" },
          { t: "−", f: () => zoomAt(center(), 1 / 1.25), l: "축소" },
          { t: "⟲", f: () => setView({ x: 0, y: 0, k: 1 }), l: "처음 위치로" },
        ].map((b) => (
          <button
            key={b.l}
            aria-label={b.l}
            onClick={b.f}
            className="flex h-11 w-11 items-center justify-center rounded-[3px] border border-ink/25 bg-paper-light/90 text-lg text-ink shadow-sm transition-colors hover:bg-paper-light"
          >
            {b.t}
          </button>
        ))}
      </div>
    </div>
  );
}
