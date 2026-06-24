import type { RawTourItem } from "./types";

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
};

function validCoord(it: RawTourItem): boolean {
  const x = Number(it.mapx);
  const y = Number(it.mapy);
  return Number.isFinite(x) && Number.isFinite(y) && x >= LON[0] && x <= LON[1] && y >= LAT[0] && y <= LAT[1];
}

export function normalizeRaw(raw: RawTourItem[]): { items: RawTourItem[]; stats: NormalizeStats } {
  const seen = new Set<string>();
  let deduped = 0;
  let droppedNoId = 0;
  let droppedInvalidCoord = 0;
  const items: RawTourItem[] = [];

  for (const it of raw) {
    if (!it.contentid) {
      droppedNoId += 1;
      continue;
    }
    if (seen.has(it.contentid)) {
      deduped += 1;
      continue;
    }
    if (!validCoord(it)) {
      droppedInvalidCoord += 1;
      continue;
    }
    seen.add(it.contentid);
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
    stats: { input: raw.length, deduped, droppedNoId, droppedInvalidCoord, output: items.length },
  };
}
