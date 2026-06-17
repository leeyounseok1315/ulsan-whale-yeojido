import {
  CONTENT_TYPE_LABEL,
  type RawTourItem,
  type WhaleSpot,
  type WhaleThemeId,
} from "./types";
import { sanitize } from "./sanitize";
import { CRUISE_SEASON } from "./season";

// 핵심 5대 고래 스팟 화이트리스트 (테마 고정 + 시즌성). (PLAN.md 큐레이션)
const CORE: Record<string, { theme: WhaleThemeId; seasonal?: boolean }> = {
  "C-MUSEUM": { theme: "culture" },
  "C-ECO": { theme: "culture" },
  "C-VILLAGE": { theme: "culture" },
  "C-CRUISE": { theme: "observe", seasonal: true },
  "C-PETROGLYPH": { theme: "heritage" },
};

// 고래 테마 연계 스팟(키워드엔 '고래'가 없지만 도시 자연 자원으로 큐레이션).
const LINKED: Record<string, WhaleThemeId> = {
  "S-TAEHWA": "nature",
  "S-YEONGNAM": "nature",
};

// 고래 연관 키워드 → relevance (searchKeyword2 보완용 로컬 규칙).
const KEYWORDS: [string, number][] = [
  ["고래", 1],
  ["장생포", 0.9],
  ["반구대", 0.9],
  ["암각화", 0.85],
  ["whale", 0.8],
];

function relevanceOf(text: string): number {
  let score = 0;
  for (const [kw, w] of KEYWORDS) if (text.includes(kw)) score = Math.max(score, w);
  return score;
}

function inferTheme(text: string): WhaleThemeId {
  if (text.includes("암각화") || text.includes("반구대")) return "heritage";
  if (text.includes("여행선") || text.includes("크루즈") || text.includes("관찰")) return "observe";
  if (text.includes("강") || text.includes("정원") || text.includes("억새") || text.includes("산")) return "nature";
  return "culture";
}

/** 원시 응답 → 앱 표준 모델. 테마 태깅 · 공사 표기 sanitize · 핵심 스팟 화이트리스트 적용. */
export function toWhaleSpot(raw: RawTourItem): WhaleSpot {
  const id = raw.contentid;
  const text = `${raw.title} ${raw.overview ?? ""}`;
  const core = CORE[id];
  const linked = LINKED[id];
  const theme = core?.theme ?? linked ?? inferTheme(text);
  const relevance = core ? 1 : linked ? 0.6 : relevanceOf(text);

  return {
    id,
    title: sanitize(raw.title),
    theme,
    contentTypeId: raw.contenttypeid,
    contentTypeLabel: CONTENT_TYPE_LABEL[raw.contenttypeid] ?? "관광",
    address: sanitize(raw.addr1 ?? ""),
    lon: Number(raw.mapx ?? 0),
    lat: Number(raw.mapy ?? 0),
    image: raw.firstimage ? raw.firstimage : null,
    tel: raw.tel ? sanitize(raw.tel) : null,
    summary: sanitize(raw.overview ?? ""),
    isCore: Boolean(core),
    relevance,
    seasonal: core?.seasonal ? CRUISE_SEASON : undefined,
    // 절대규칙 #1: 사용자에게 노출되는 detail 필드도 파싱 경계에서 sanitize.
    // 라이브 전환 시 detail* 응답의 운영시간/요금/휴무 텍스트에 섞일 수 있는 공사 표기를 차단.
    detail: {
      useTime: raw.usetime ? sanitize(raw.usetime) : undefined,
      restDate: raw.restdate ? sanitize(raw.restdate) : undefined,
      useFee: raw.usefee ? sanitize(raw.usefee) : undefined,
    },
  };
}
