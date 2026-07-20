import type { WhaleSpot } from "./types";

// 다국어(i18n) — 국문(ko) 기본 + 영문(en). (로드맵 2단계: 다국어 확장)
//
// ⚠️ 영문 콘텐츠 출처: 관광 OpenAPI의 영문 서비스(EngService2)는 별도 활용신청·승인이 필요한데
// 현재 서비스키는 국문 서비스만 승인돼 있어 403이다. 승인 전까지는 아래 큐레이션 영문을 쓴다.
// 승인되면 SPOT_I18N 대신 EngService2 응답을 붙이도록 소스만 갈아끼우면 된다(구조는 동일).
// 큐레이션 문구는 실재하는 공개 명소의 사실 정보만 담는다(지어내지 않음).

export type Lang = "ko" | "en";
export const LANGS: Lang[] = ["ko", "en"];
export function resolveLang(v: string | null | undefined): Lang {
  return v === "en" ? "en" : "ko"; // 미지정·비지원 → 기본 국문
}

type SpotText = { title: string; summary?: string };

// 핵심·연계 고래 스팟의 영문. 실 contentid와 mock 픽스처 id를 함께 매핑(mock/live 공통).
export const SPOT_I18N: Record<string, SpotText> = {
  "130649": { title: "Jangsaengpo Whale Museum", summary: "Korea's only whale museum, tracing the history of whaling and whale ecology in Jangsaengpo." },
  "2754480": { title: "Jangsaengpo Whale Eco Experience Center", summary: "A hands-on center where visitors meet marine life and learn about whale ecology." },
  "3495467": { title: "Jangsaengpo Whale Culture Special Zone", summary: "Korea's only Whale Culture Special Zone, gathering the whale museum, eco center and culture village." },
  "769495": { title: "Jangsaengpo Whale-Watching Cruise", summary: "Korea's only whale-watching cruise, sailing off Jangsaengpo (April–November)." },
  "128184": { title: "Bangudae Petroglyphs", summary: "Prehistoric rock carvings of whale hunting — a National Treasure and UNESCO World Heritage candidate." },
  "1019409": { title: "Wonjo Halmae Whale Restaurant", summary: "A long-standing local restaurant serving traditional fare in Jangsaengpo." },
  "1624135": { title: "Ulsan Gray Whale Migration Waters", summary: "Designated waters on the gray whale's migratory route off the coast of Ulsan." },
  "553263": { title: "Ulsan Whale Festival", summary: "Ulsan's signature festival celebrating whale culture in Jangsaengpo." },
  "2675069": { title: "Jangsaengpo Old Road & Coastal Trail", summary: "A walking trail linking Jangsaengpo's old paths and coastline." },
  "2638479": { title: "Jangsaengpo Monorail", summary: "A monorail with views over Jangsaengpo's whale culture village." },
  "128202": { title: "Taehwagang National Garden", summary: "A riverside national garden in the heart of Ulsan, known for its bamboo grove and night views." },
  "2674942": { title: "Yeongnam Alps Welcome Center", summary: "The gateway to the Yeongnam Alps, famous for its autumn silver-grass fields." },
  // mock 픽스처 id
  "C-MUSEUM": { title: "Jangsaengpo Whale Museum", summary: "Korea's only whale museum, tracing the history of whaling and whale ecology." },
  "C-ECO": { title: "Whale Eco Experience Center", summary: "A hands-on center to meet marine life and learn about whale ecology." },
  "C-VILLAGE": { title: "Jangsaengpo Whale Culture Village", summary: "A recreated village telling the story of Jangsaengpo's whaling era." },
  "C-CRUISE": { title: "Whale-Watching Cruise", summary: "Korea's only whale-watching cruise, sailing off Jangsaengpo (April–November)." },
  "C-PETROGLYPH": { title: "Bangudae Petroglyphs", summary: "Prehistoric rock carvings of whale hunting — a National Treasure." },
  "S-TAEHWA": { title: "Taehwagang National Garden", summary: "A riverside national garden in the heart of Ulsan." },
  "S-YEONGNAM": { title: "Yeongnam Alps Sinbulsan Silver-Grass Field", summary: "Highland silver-grass fields that turn silver in autumn." },
};

/** 스팟을 요청 언어로 지역화. 영문이 없으면 국문으로 폴백(빈 화면보다 정직한 폴백). */
export function localizeSpot(spot: WhaleSpot, lang: Lang): WhaleSpot {
  if (lang === "ko") return spot;
  const t = SPOT_I18N[spot.id];
  if (!t) return spot; // 큐레이션 영문 없음 → 국문 그대로 (uncurated 폴백)
  return { ...spot, title: t.title, summary: t.summary ?? spot.summary };
}

/** 출처 라벨 — 절대규칙 #1: 공사 명칭 미노출, 중립 표현만. */
export function sourceLabel(lang: Lang): string {
  return lang === "en" ? "Public data" : "공공데이터";
}

const MONTHS_EN = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** 요일 이름 (0=일). ko는 "월"(뒤에 '요일'을 붙여 씀), en은 "Monday". */
export function weekdayName(sun0: number, lang: Lang): string {
  return WEEKDAYS[lang][sun0] ?? "";
}

/** 월 목록을 범위 라벨로. 연을 걸치면(12·1 포함) 꼬리~머리로. ko "4~11월" / en "Apr–Nov". */
export function monthRangeLabel(months: number[], lang: Lang): string {
  const ms = [...new Set(months)].sort((a, b) => a - b);
  if (!ms.length) return "";
  const wraps = ms.includes(12) && ms.includes(1);
  let lo = ms[0];
  let hi = ms[ms.length - 1];
  if (wraps) {
    const tail = ms.filter((m) => m >= 7);
    const head = ms.filter((m) => m < 7);
    if (tail.length && head.length) {
      lo = tail[0];
      hi = head[head.length - 1];
    }
  }
  return lang === "en" ? `${MONTHS_EN[lo]}–${MONTHS_EN[hi]}` : `${lo}~${hi}월`;
}
