"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WhaleSpot } from "@/backend/lib/types";
import { MAP_H, MAP_W, UlsanBaseMap, projectToMap } from "./UlsanBaseMap";
import { WhaleMarker } from "./WhaleMarker";

type View = { x: number; y: number; k: number };
type Pt = { s: WhaleSpot; x: number; y: number };
type Cluster = { x: number; y: number; members: Pt[] };

const K_MIN = 0.6;
const K_MAX = 4.5;
const PAN_STEP = 70; // 키보드 패닝 한 칸(viewBox 단위)
const EXPAND_K = 2.6; // 이 줌 이상이면 군집을 묶음 핀 대신 부채꼴로 펼친다
const MIN_TAP_PX = 24; // WCAG 2.5.8 최소 타깃 크기
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// 근접 마커를 묶는다. 임계 거리는 줌이 커질수록 줄어 자연히 흩어진다.
function clusterPoints(pts: Pt[], k: number): Cluster[] {
  const R = 70 / k;
  const clusters: Cluster[] = [];
  for (const p of pts) {
    let best: Cluster | null = null;
    let bestD = R;
    for (const c of clusters) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (best) {
      best.members.push(p);
      best.x = best.members.reduce((a, b) => a + b.x, 0) / best.members.length;
      best.y = best.members.reduce((a, b) => a + b.y, 0) / best.members.length;
    } else {
      clusters.push({ x: p.x, y: p.y, members: [p] });
    }
  }
  return clusters;
}

// 펼칠 때(동일 좌표 포함) 부채꼴로 분산 — 각 스팟이 개별 클릭 가능하도록.
function fanOut(members: Pt[], cx: number, cy: number, r: number): Pt[] {
  if (members.length === 1) return [{ ...members[0], x: cx, y: cy }];
  return members.map((m, i) => {
    const a = -Math.PI / 2 + (i / members.length) * Math.PI * 2;
    return { s: m.s, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

function ClusterPin({
  x,
  y,
  k,
  count,
  onExpand,
}: {
  x: number;
  y: number;
  k: number;
  count: number;
  onExpand: (byKeyboard: boolean) => void;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${1 / k})`}>
      <g
        role="button"
        tabIndex={0}
        aria-label={`이 일대 ${count}곳 — 펼쳐 보기`}
        className="cursor-pointer outline-none"
        onClick={(e) => {
          e.stopPropagation();
          onExpand(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onExpand(true); // 키보드로 펼쳤으면 포커스를 펼쳐진 마커로 인계해야 한다
          }
        }}
      >
        <ellipse cx={0} cy={23} rx={16} ry={3} fill="var(--color-ink)" opacity={0.18} />
        <circle r={25} fill="none" stroke="var(--color-seal)" strokeWidth={1.5} opacity={0.45} />
        <circle r={20} fill="var(--color-seal)" stroke="var(--color-paper-light)" strokeWidth={2} opacity={0.96} />
        <text y={6} textAnchor="middle" fontSize={17} fontWeight="bold" fontFamily="var(--font-body)" fill="var(--color-paper-light)">
          {count}
        </text>
      </g>
    </g>
  );
}

export function YeojidoMap({
  spots,
  selectedId,
  onSelect,
  panelOpen = false,
}: {
  spots: WhaleSpot[];
  selectedId: string | null;
  onSelect: (s: WhaleSpot | null) => void;
  /** 상세 패널이 열려 있으면 줌 컨트롤이 패널에 깔려 죽는다 — 비켜서게 알려준다. */
  panelOpen?: boolean;
}) {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number } | null>(null);
  const moved = useRef(false);
  // 군집을 키보드로 펼치면 ClusterPin이 사라지며 포커스가 BODY로 튄다 → 펼쳐진 첫 마커로 옮긴다.
  const focusAfterExpand = useRef<string | null>(null);

  const points = useMemo<Pt[]>(() => spots.map((s) => ({ s, ...projectToMap(s.lon, s.lat) })), [spots]);
  const clusters = useMemo(() => clusterPoints(points, view.k), [points, view.k]);

  const scaleOf = (r: DOMRect) => Math.min(r.width / MAP_W, r.height / MAP_H);

  // 여지도가 컨테이너에 맞춰 레터박싱되는 배율(viewBox 단위 → 화면 px). 탭 영역 산정에 쓴다.
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setFit(scaleOf(el.getBoundingClientRect()) || 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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

  // 군집을 화면 중앙으로 당기며 확대 → 펼쳐진다.
  const expandCluster = (c: Cluster, byKeyboard = false) => {
    if (byKeyboard) focusAfterExpand.current = c.members[0]?.s.id ?? null;
    setView((v) => {
      const k2 = clamp(Math.max(EXPAND_K, v.k * 2.2), K_MIN, K_MAX);
      return { k: k2, x: MAP_W / 2 - k2 * c.x, y: MAP_H / 2 - k2 * c.y };
    });
  };

  // 펼쳐진 뒤 첫 마커로 포커스 인계 — 키보드 사용자가 처음부터 Tab을 돌지 않게.
  useEffect(() => {
    const id = focusAfterExpand.current;
    if (!id) return;
    focusAfterExpand.current = null;
    box.current?.querySelector<SVGGElement>(`[data-spot-id="${CSS.escape(id)}"]`)?.focus();
  }, [view.k]);

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
    // setPointerCapture는 SVG 자식(마커·클러스터)의 click 타깃을 컨테이너로 가로채
    // 실제 마우스 클릭이 안 먹는다 → 캡처하지 않는다. 지도가 풀스크린이라 드래그엔 지장 없음.
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
    const center = { x: MAP_W / 2, y: MAP_H / 2 };
    const keys: Record<string, () => void> = {
      ArrowUp: () => setView((v) => ({ ...v, y: v.y + PAN_STEP })),
      ArrowDown: () => setView((v) => ({ ...v, y: v.y - PAN_STEP })),
      ArrowLeft: () => setView((v) => ({ ...v, x: v.x + PAN_STEP })),
      ArrowRight: () => setView((v) => ({ ...v, x: v.x - PAN_STEP })),
      "+": () => zoomAt(center, 1.2),
      "=": () => zoomAt(center, 1.2),
      "-": () => zoomAt(center, 1 / 1.2),
      "0": () => setView({ x: 0, y: 0, k: 1 }),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  // 마커는 scale(k) 안에서 scale(1/k)로 되돌리므로, 화면 크기 = viewBox 단위 × fit(레터박싱 배율).
  // 좁은 화면일수록 fit이 작아져 도장이 10px 아래로 줄어든다 → 탭 영역을 fit으로 역산해 24px 확보.
  const hitR = Math.ceil(MIN_TAP_PX / 2 / fit);

  const renderMarker = (p: Pt) => (
    <WhaleMarker
      key={p.s.id}
      x={p.x}
      y={p.y}
      k={view.k}
      spot={p.s}
      selected={p.s.id === selectedId}
      onSelect={() => onSelect(p.s)}
      hitR={hitR}
    />
  );

  return (
    <div
      ref={box}
      className="relative h-full w-full touch-none select-none overflow-hidden bg-canvas"
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
          {clusters.map((c, i) => {
            if (c.members.length === 1) return renderMarker(c.members[0]);
            if (view.k < EXPAND_K) {
              return (
                <ClusterPin
                  key={`cl-${i}`}
                  x={c.x}
                  y={c.y}
                  k={view.k}
                  count={c.members.length}
                  onExpand={(byKeyboard) => expandCluster(c, byKeyboard)}
                />
              );
            }
            return fanOut(c.members, c.x, c.y, 95 / view.k).map(renderMarker);
          })}
        </g>
      </svg>

      {/* 줌 컨트롤 — 상세 패널(z-30) 위로 올리고, 패널이 차지한 자리를 피한다.
          데스크톱: 패널(420px) 왼쪽으로 비켜섬 / 모바일: 바텀시트가 지도를 거의 덮으므로 숨김
          (감춰진 채 클릭만 먹던 상태가 더 나빴다 — 없으면 없는 대로 보이게 한다) */}
      <div
        className={`absolute bottom-4 z-40 flex-col gap-1.5 ${
          panelOpen ? "right-4 hidden md:flex md:right-[436px]" : "right-4 flex"
        }`}
      >
        {[
          { t: "+", f: () => zoomAt({ x: MAP_W / 2, y: MAP_H / 2 }, 1.25), l: "확대" },
          { t: "−", f: () => zoomAt({ x: MAP_W / 2, y: MAP_H / 2 }, 1 / 1.25), l: "축소" },
          { t: "⟲", f: () => setView({ x: 0, y: 0, k: 1 }), l: "처음 위치로" },
        ].map((b) => (
          <button
            key={b.l}
            aria-label={b.l}
            onClick={b.f}
            className="wy-chip flex h-11 w-11 items-center justify-center rounded-[2px] bg-canvas-soft text-lg text-carbon transition-[filter] hover:brightness-105"
          >
            {b.t}
          </button>
        ))}
      </div>
    </div>
  );
}
