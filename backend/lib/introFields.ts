import { sanitize } from "./sanitize";

// detailIntro2 응답에서 운영시간·휴무·요금·전화를 뽑는다.
// detail.ts(상세 패널)와 data.ts(추천용 운영정보 사전 부착)가 공유 — 순환 import를 피하려 별도 모듈.
// detailIntro2는 콘텐츠타입마다 필드명이 다르다(실측 기반 후보군).
export const INTRO_FIELDS = {
  // 축제(15)의 usetimefestival은 운영시간이 아니라 이용요금 성격이라 useFee로 분류.
  useTime: [
    "usetime",
    "usetimeculture",
    "usetimeleports",
    "opentimefood",
    "opentime",
    "playtime",
    "checkintime",
  ],

  restDate: [
    "restdate",
    "restdateculture",
    "restdateleports",
    "restdatefood",
    "restdateshopping",
  ],

  useFee: [
    "usefee",
    "usefeeleports",
    "usetimefestival",
  ],

  infoCenter: [
    "infocenter",
    "infocenterculture",
    "infocenterfood",
    "infocenterleports",
    "infocenterlodging",
    "infocentershopping",
  ],

  parking: [
    "parking",
    "parkingculture",
    "parkingleports",
    "parkingfood",
    "parkinglodging",
  ],

  reservation: [
    "reservation",
    "reservationfood",
    "reservationlodging",
    "reservationurl",
    "bookingplace",
  ],
};

// HTML 제거 + 공사 표기 sanitize.
export function clean(s?: string | null): string | undefined {
  if (!s) return undefined;
  const t = String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return sanitize(t) || undefined;
}

export function pick(item: Record<string, unknown> | null, fields: string[]): string | undefined {
  if (!item) return undefined;
  for (const f of fields) {
    const v = item[f];
    if (v && String(v).trim()) return clean(String(v));
  }
  return undefined;
}

/** intro → 운영시간·휴무·요금·전화(원문에 가까운 정제 문자열). 축제 표기 가공은 호출부(detail.ts)에서. */
export function extractIntro(intro: Record<string, unknown> | null) {
  const infoCenter = pick(intro, INTRO_FIELDS.infoCenter);

  return {
    useTime: pick(intro, INTRO_FIELDS.useTime),
    restDate: pick(intro, INTRO_FIELDS.restDate),
    useFee: pick(intro, INTRO_FIELDS.useFee),
    parking: pick(intro, INTRO_FIELDS.parking),
    reservation: pick(intro, INTRO_FIELDS.reservation),
    infoCenter,

    // 기존 코드가 tel을 사용하고 있으므로 호환성 유지
    tel: infoCenter,
  };
}
