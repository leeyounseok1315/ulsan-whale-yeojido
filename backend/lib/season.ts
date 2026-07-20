import type { EventPeriod, PeakSeason, SeasonRule } from "./types";
import { type Lang, monthRangeLabel } from "./i18n";

/**
 * 고래바다여행선: 국내 유일 고래 관찰 크루즈.
 * 운항기는 4~11월 — 11월은 주말(토·일)만 운항한다. 앱이 보여주는 상세 데이터의
 * "11월 : 토, 일요일 운항"과 어긋나지 않도록 11월을 가용 월에 포함하되 주말 한정임을 안내한다.
 * (과거엔 4~10월로 박아둬, 앱이 자신의 상세 데이터와 11월에 정면으로 모순됐다)
 */
export const CRUISE_SEASON: SeasonRule = {
  openMonths: [4, 5, 6, 7, 8, 9, 10, 11],
  label: "고래바다여행선 운항",
  closedNote:
    "고래바다여행선은 4~11월에만 운항해요. 비운항기에는 상시 관람 가능한 장생포 코스로 대체 안내합니다.",
};
/** 주말만 운항하는 달 — 평일 방문이면 코스에서 제외한다. */
export const CRUISE_WEEKEND_ONLY_MONTHS = [11];

/** YYYY-MM-DD 형식이면서 실재하는 날짜인지. (2027-02-29, 2026-13-45 같은 값은 거부) */
export function isValidRefDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(`${s}T00:00:00`);
  return (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() === Number(m[1]) &&
    d.getMonth() + 1 === Number(m[2]) &&
    d.getDate() === Number(m[3])
  );
}

/** 오늘(로컬 기준). toISOString()은 UTC라 자정 무렵 하루가 밀리므로 쓰지 않는다. */
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 기준 날짜 확정 — 없거나 형식이 틀리면 오늘. 엔진은 항상 유효한 YYYY-MM-DD만 다룬다. */
export function resolveRefDate(refDate?: string): string {
  return refDate && isValidRefDate(refDate) ? refDate : todayLocal();
}

/**
 * 기준 월. refDate(YYYY-MM-DD)를 외부 주입할 수 있어 비운항기 검증(시간 모킹)이 가능하다.
 * (PLAN.md 리스크: 6월 운항기라 비운항 분기 검증 불가 → 날짜 주입 설계 강제)
 * 잘못된 값이 들어와도 NaN을 내지 않는다 — NaN이면 모든 시즌 판정이 조용히 '휴지기'로 뒤집힌다.
 */
export function monthOf(refDate?: string): number {
  return Number(resolveRefDate(refDate).slice(5, 7));
}

/** 기준 날짜의 요일(0=일). 주말 한정 운항 판정용. */
function dayOfWeek(refDate?: string): number {
  return new Date(`${resolveRefDate(refDate)}T00:00:00`).getDay();
}

export function isSeasonOpen(rule: SeasonRule, refDate?: string): boolean {
  const m = monthOf(refDate);
  if (!rule.openMonths.includes(m)) return false;
  // 주말 한정 운항 달(11월)에 평일이면 방문 불가 — 코스에 넣으면 안 된다.
  if (rule === CRUISE_SEASON && CRUISE_WEEKEND_ONLY_MONTHS.includes(m)) {
    const d = dayOfWeek(refDate);
    return d === 0 || d === 6;
  }
  return true;
}

/**
 * 지금 이용할 수 없는 '사유'. 안내 문구가 실제 사유를 반영해야 한다 —
 * 11월 평일(주말 한정 운항)에 "12~3월 휴지기"라고 하면 틀린 말이 된다.
 */
export function unavailableReason(rule: SeasonRule, refDate?: string, lang: Lang = "ko"): string {
  const m = monthOf(refDate);
  const closedMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter((mm) => !rule.openMonths.includes(mm));
  if (!rule.openMonths.includes(m)) {
    return lang === "en" ? `off-season, ${monthRangeLabel(closedMonths, "en")}` : `${closedRangeLabel(rule)} 휴지기`;
  }
  if (rule === CRUISE_SEASON && CRUISE_WEEKEND_ONLY_MONTHS.includes(m)) {
    return lang === "en" ? `${MONTHS_EN_FULL[m]} — weekends only` : `${m}월은 주말(토·일)만 운항`;
  }
  return lang === "en" ? "not available on this date" : "이 날짜엔 이용 불가";
}
const MONTHS_EN_FULL = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** 축제가 기준 날짜에 실제로 열리는가. 기간을 모르면 false — 모르는 걸 '열린다'고 하지 않는다. */
export function isEventRunning(period: EventPeriod | undefined, refDate?: string): boolean {
  if (!period) return false;
  const d = resolveRefDate(refDate).replace(/-/g, "");
  return d >= period.start && d <= period.end;
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
  // 축제(울산고래축제 등)는 여기에 월을 박지 않는다 — 개최기간은 해마다 바뀌므로
  // detailIntro2의 eventstartdate/eventenddate(EventPeriod)에서 파생한다. (peakOf 참고)
};

/**
 * 스팟의 제철. 축제는 하드코딩하지 않고 실제 개최기간(EventPeriod)에서 파생한다 —
 * 개최 월을 짐작해 박아두면 데이터가 바뀌었을 때 조용히 거짓말이 된다.
 */
export function peakOf(spotId: string, eventPeriod?: EventPeriod): PeakSeason | undefined {
  if (eventPeriod) {
    const months = monthsBetween(eventPeriod);
    if (months.length) return { months, label: "축제 기간" };
  }
  return PEAK_SEASONS[spotId];
}

/** 개최기간(YYYYMMDD)이 걸치는 월 목록. */
function monthsBetween(p: EventPeriod): number[] {
  const sm = Number(p.start.slice(4, 6));
  const em = Number(p.end.slice(4, 6));
  if (!(sm >= 1 && sm <= 12) || !(em >= 1 && em <= 12)) return [];
  const out: number[] = [];
  for (let m = sm; ; m = (m % 12) + 1) {
    out.push(m);
    if (m === em || out.length >= 12) break;
  }
  return out;
}

export function isPeak(peak: PeakSeason | undefined, refDate?: string): boolean {
  return Boolean(peak?.months.includes(monthOf(refDate)));
}

/** 시즌 비가용 스팟의 큐레이션 대체(상시 방문 가능한 같은 테마 축). */
export const SEASON_SUBSTITUTE: Record<string, string> = {
  "769495": "3495467", // 고래바다여행선 → 장생포고래문화특구(상시)
  "C-CRUISE": "C-VILLAGE",
};

/** 가용 월 표기 — openMonths를 "4~11월" 형태로. 안내 문구가 규칙에서 파생되게 한다. */
export function openRangeLabel(rule: SeasonRule): string {
  const o = [...rule.openMonths].sort((a, b) => a - b);
  if (!o.length) return "";
  return `${o[0]}~${o[o.length - 1]}월`;
}

/** 휴지기 표기 — openMonths의 여집합을 "12~3월" 형태로. */
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
