import type { PeakSeason, SeasonRule } from "./types";

/** 고래바다여행선: 국내 유일 고래 관찰 크루즈 — 4~10월 운항 (시즌성 핵심). */
export const CRUISE_SEASON: SeasonRule = {
  openMonths: [4, 5, 6, 7, 8, 9, 10],
  label: "고래바다여행선 운항",
  closedNote:
    "고래바다여행선은 4~10월에만 운항해요. 비운항기에는 상시 관람 가능한 장생포 코스로 대체 안내합니다.",
};

/**
 * 기준 월. refDate(YYYY-MM-DD)를 외부 주입할 수 있어 비운항기 검증(시간 모킹)이 가능하다.
 * (PLAN.md 리스크: 6월 운항기라 비운항 분기 검증 불가 → 날짜 주입 설계 강제)
 */
export function monthOf(refDate?: string): number {
  if (refDate) {
    // YYYY-MM-DD를 로컬 기준으로 안전 파싱. new Date("2026-04-01")은 UTC 자정으로 파싱돼
    // UTC보다 뒤진 타임존에서 getMonth()가 한 달 밀리는 오차가 있어, 월 부분을 직접 읽는다.
    const m = Number(refDate.slice(5, 7));
    if (m >= 1 && m <= 12) return m;
  }
  return new Date(refDate ? `${refDate}T00:00:00` : Date.now()).getMonth() + 1;
}

export function isSeasonOpen(rule: SeasonRule, refDate?: string): boolean {
  return rule.openMonths.includes(monthOf(refDate));
}

// ── 제철(peak) — 가용성과 별개로 '지금이 가장 좋은 때'. 계절마다 추천이 돌게 하는 축. ──
// 여름=바다(크루즈)·정원 / 가을=억새 / 겨울~봄=반구대(갈수기라 암각화가 드러남)
// mock 픽스처 id(C-*/S-*)도 함께 매핑해 mock/live 공통 동작.
export const PEAK_SEASONS: Record<string, PeakSeason> = {
  "769495": { months: [6, 7, 8, 9], label: "고래 관찰 성수기" }, // 고래바다여행선
  "C-CRUISE": { months: [6, 7, 8, 9], label: "고래 관찰 성수기" },
  "128184": { months: [11, 12, 1, 2, 3, 4], label: "갈수기 관찰 적기" }, // 반구대(수위 낮을 때 암각화가 드러남)
  "C-PETROGLYPH": { months: [11, 12, 1, 2, 3, 4], label: "갈수기 관찰 적기" },
  "2674942": { months: [10, 11], label: "억새 절정" }, // 영남알프스
  "S-YEONGNAM": { months: [10, 11], label: "억새 절정" },
  "128202": { months: [4, 5, 6, 7, 8, 9, 10], label: "정원·야경 좋은 때" }, // 태화강 국가정원
  "S-TAEHWA": { months: [4, 5, 6, 7, 8, 9, 10], label: "정원·야경 좋은 때" },
  "553263": { months: [5, 6], label: "고래축제 시즌" }, // 울산고래축제
};

export function peakOf(spotId: string): PeakSeason | undefined {
  return PEAK_SEASONS[spotId];
}

export function isPeak(peak: PeakSeason | undefined, refDate?: string): boolean {
  return Boolean(peak?.months.includes(monthOf(refDate)));
}

/** 시즌 비가용 스팟의 큐레이션 대체(상시 방문 가능한 같은 테마 축). */
export const SEASON_SUBSTITUTE: Record<string, string> = {
  "769495": "3495467", // 고래바다여행선 → 장생포고래문화특구(상시)
  "C-CRUISE": "C-VILLAGE",
};

/** 휴지기 표기 — openMonths의 여집합을 "11~3월" 형태로. */
export function closedRangeLabel(rule: SeasonRule): string {
  const closed = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !rule.openMonths.includes(m));
  if (!closed.length) return "";
  const wrapsYear = closed.includes(12) && closed.includes(1);
  if (wrapsYear) {
    const tail = closed.filter((m) => m >= 7).sort((a, b) => a - b);
    const head = closed.filter((m) => m < 7).sort((a, b) => a - b);
    if (tail.length && head.length) return `${tail[0]}~${head[head.length - 1]}월`;
  }
  return `${closed[0]}~${closed[closed.length - 1]}월`;
}
