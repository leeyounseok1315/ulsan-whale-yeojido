import type { SeasonRule } from "./types";

/** 고래바다여행선: 국내 유일 고래 관찰 크루즈 — 4~10월 운항 (시즌성 핵심). */
export const CRUISE_SEASON: SeasonRule = {
  openMonths: [4, 5, 6, 7, 8, 9, 10],
  label: "고래바다여행선 운항",
  closedNote:
    "고래바다여행선은 4~10월에만 운항해요. 비운항기에는 장생포 고래문화마을·생태체험관 코스로 대체 안내합니다.",
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
