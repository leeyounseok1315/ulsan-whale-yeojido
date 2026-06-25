import type { RawTourItem } from "./types";
import { CORE_BY_ID } from "./coreSpots";

// 표준 스키마 정규화·정제·보정 — 전수 수집 직후 적용. (PLAN.md: 좌표/누락/중복 보정)
// 테마 분류·sanitize는 adapter(다음 단계)에서. 여기서는 좌표 유효성·중복·이미지 프로토콜만.

// 울산 대략 bbox (서비스 영역 밖/좌표 결측 데이터 차단)
const LON = [128.85, 129.65] as const;
const LAT = [35.3, 35.85] as const;

export type NormalizeStats = {
  input: number;
  deduped: number;
  droppedNoId: number;
  droppedInvalidCoord: number;
  output: number;
  coreKept: number; // 핵심 스팟이 실제로 몇 개 살아남았는지 — 배치 모니터링용(누락 감지)
};

function inBbox(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && x >= LON[0] && x <= LON[1] && y >= LAT[0] && y <= LAT[1];
}

export function normalizeRaw(raw: RawTourItem[]): { items: RawTourItem[]; stats: NormalizeStats } {
  const byId = new Set<string>();
  const byPlace = new Set<string>(); // 제목+좌표 기반 2차 중복 키
  let deduped = 0;
  let droppedNoId = 0;
  let droppedInvalidCoord = 0;
  let coreKept = 0;
  const items: RawTourItem[] = [];

  for (const it0 of raw) {
    if (!it0.contentid) {
      droppedNoId += 1;
      continue;
    }
    if (byId.has(it0.contentid)) {
      deduped += 1;
      continue;
    }
    const it: RawTourItem = { ...it0 };
    const core = CORE_BY_ID[it.contentid];
    let x = Number(it.mapx);
    let y = Number(it.mapy);

    // 핵심 스팟 좌표 결측 → 큐레이션 폴백 좌표로 보강(절대 드롭 금지)
    if (!inBbox(x, y) && core) {
      it.mapx = String(core.lon);
      it.mapy = String(core.lat);
      x = core.lon;
      y = core.lat;
    }
    if (!inBbox(x, y)) {
      droppedInvalidCoord += 1;
      continue;
    }

    // 2차 중복 제거: 제목(공백 제거)+반올림 좌표 — 같은 장소 다른 contentid(예: 박물관 14 vs 쇼핑 38) 제거.
    // 수집 순서상 핵심 단건이 먼저 와서 우선 보존된다(keep-first).
    const placeKey = `${(it.title ?? "").replace(/\s+/g, "")}@${x.toFixed(4)},${y.toFixed(4)}`;
    if (byPlace.has(placeKey)) {
      deduped += 1;
      continue;
    }

    byId.add(it.contentid);
    byPlace.add(placeKey);
    if (core) coreKept += 1;
    items.push({
      ...it,
      title: (it.title ?? "").trim(),
      addr1: (it.addr1 ?? "").trim(),
      // 혼합콘텐츠 방지: http 이미지 → https (만료/핫링크 폴백은 W4)
      firstimage: it.firstimage ? it.firstimage.replace(/^http:\/\//i, "https://") : it.firstimage,
    });
  }

  return {
    items,
    stats: { input: raw.length, deduped, droppedNoId, droppedInvalidCoord, output: items.length, coreKept },
  };
}
