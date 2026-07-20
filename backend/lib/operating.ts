import type { OpeningInfo } from "./types";
import { resolveRefDate } from "./season";

// 운영정보 파서 — 자유 텍스트인 detailIntro2의 운영시간(useTime)·휴무(restDate)를
// 추천 엔진이 쓸 수 있는 구조로 만든다. 관광 데이터는 표기가 제각각이라, '확실히 아는 것만' 판단한다.
// (모르는 값은 '닫혔다'고 단정하지 않는다 — 닫힌 곳으로 안내하는 것만큼이나 여는 곳을 빼는 것도 나쁘다)

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAY_INDEX: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

/** 기준 날짜의 요일 한글(예: "월"). */
export function weekdayKr(refDate?: string): string {
  return WEEKDAY_KR[new Date(`${resolveRefDate(refDate)}T00:00:00`).getDay()];
}

const HHMM = /(\d{1,2}):(\d{2})/g;
const pad = (n: number) => String(n).padStart(2, "0");

/** "09:00~18:00 (입장 마감 17:30)" → { open:"09:00", close:"18:00" }. 첫 시간범위만 취한다. */
function parseHours(useTime?: string): { open?: string; close?: string; alwaysOpenHours: boolean } {
  if (!useTime) return { alwaysOpenHours: false };
  if (/상시\s*개방|24\s*시간|연중\s*무휴/.test(useTime)) return { alwaysOpenHours: true };
  const nums = [...useTime.matchAll(HHMM)].map((m) => `${pad(Number(m[1]))}:${m[2]}`);
  if (nums.length >= 2) return { open: nums[0], close: nums[1], alwaysOpenHours: false };
  return { alwaysOpenHours: false };
}

/** "매주 월요일 / 설·추석 당일" → { closedWeekdays:[1], holidayNote:"설·추석 당일" }. */
function parseClosed(restDate?: string): { neverCloses: boolean; closedWeekdays: number[]; holidayNote?: string } {
  if (!restDate) return { neverCloses: false, closedWeekdays: [] };
  if (/연중\s*무휴|무휴|상시/.test(restDate)) return { neverCloses: true, closedWeekdays: [] };

  const closedWeekdays = [
    ...new Set([...restDate.matchAll(/([일월화수목금토])\s*요일/g)].map((m) => WEEKDAY_INDEX[m[1]])),
  ].sort((a, b) => a - b);

  // 음력 명절(설·추석)·공휴일은 달력 없이 확정할 수 없어 판단에 쓰지 않고 안내 힌트로만 둔다.
  const holiday = restDate.match(/설[·、,\s]*추석[^,/]*|공휴일[^,/]*|1월\s*1일/);
  return { neverCloses: false, closedWeekdays, holidayNote: holiday ? holiday[0].trim() : undefined };
}

/** intro의 운영시간·휴무 자유텍스트 → 구조화. 수집 단계에서 1회 계산해 스팟에 굽는다. */
export function parseOpening(useTime?: string, restDate?: string): OpeningInfo {
  const h = parseHours(useTime);
  const c = parseClosed(restDate);
  return {
    open: h.open,
    close: h.close,
    alwaysOpenHours: h.alwaysOpenHours,
    neverCloses: c.neverCloses,
    closedWeekdays: c.closedWeekdays,
    holidayNote: c.holidayNote,
  };
}

/** 기준 날짜에 정기 휴무인가. 모르면(규칙 없음) false — 여는 곳을 함부로 빼지 않는다. */
export function isClosedOn(op: OpeningInfo | undefined, refDate?: string): boolean {
  if (!op || op.neverCloses || !op.closedWeekdays.length) return false;
  const wd = new Date(`${resolveRefDate(refDate)}T00:00:00`).getDay();
  return op.closedWeekdays.includes(wd);
}

/** 상세·코스에 보여줄 운영시간 라벨. */
export function openHoursLabel(op: OpeningInfo | undefined): string | undefined {
  if (!op) return undefined;
  if (op.alwaysOpenHours) return "상시 개방";
  return op.open && op.close ? `${op.open}~${op.close}` : undefined;
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** 도착 예정 시각(HH:MM)에 이미 마감했는가. 상시 개방·마감시각 불명이면 false. */
export function closedByArrival(op: OpeningInfo | undefined, arriveHHMM: string): boolean {
  if (!op || op.alwaysOpenHours || !op.close) return false;
  return toMin(arriveHHMM) > toMin(op.close);
}
