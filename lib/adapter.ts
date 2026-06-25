import {
  CONTENT_TYPE_LABEL,
  type RawTourItem,
  type WhaleSpot,
  type WhaleThemeId,
} from "./types";
import { sanitize } from "./sanitize";
import { CRUISE_SEASON } from "./season";
import { CORE_BY_ID, LINKED_SPOTS } from "./coreSpots";

// 강한 고래 토큰(어떤 콘텐츠 타입이든 인정) vs 지명 토큰(관광형 타입에서만 인정).
const STRONG_KEYWORDS: [string, number][] = [
  ["고래", 1],
  ["반구대", 0.9],
  ["암각화", 0.85],
  ["whale", 0.8],
];
const PLACE_KEYWORDS: [string, number][] = [["장생포", 0.9]];
// 지명만으로 포함을 허용할 콘텐츠 타입(관광지·문화시설·축제·여행코스·레포츠).
// 숙박(32)·쇼핑(38)·음식점(39)은 '장생포' 지명만으론 고래 스팟이 아니다 — 강한 토큰 필요.
const PLACE_OK_TYPES = new Set(["12", "14", "15", "25", "28"]);

function relevanceOf(text: string, contentTypeId: string): number {
  let score = 0;
  for (const [kw, w] of STRONG_KEYWORDS) if (text.includes(kw)) score = Math.max(score, w);
  if (PLACE_OK_TYPES.has(contentTypeId)) {
    for (const [kw, w] of PLACE_KEYWORDS) if (text.includes(kw)) score = Math.max(score, w);
  }
  return score;
}

// 정확 토큰 매칭 — '울산'의 '산', '산업' 같은 부분일치 오탐을 피하려 특정 고유명사만 사용.
// (핵심·연계 스팟은 화이트리스트로 이미 테마가 고정되므로, 여기는 그 외 고래 키워드 스팟만 분류)
function inferTheme(text: string): WhaleThemeId {
  if (/암각화|반구대|각석|세계유산/.test(text)) return "heritage";
  if (/여행선|크루즈|회유|고래\s*관찰/.test(text)) return "observe";
  if (/태화강|영남알프스|신불산|간월산|억새|국가정원|대숲|수목원|대공원|간절곶|해수욕장/.test(text)) return "nature";
  return "culture";
}

/** 원시 응답 → 앱 표준 모델. 테마 태깅 · 공사 표기 sanitize · 핵심 스팟 화이트리스트 적용. */
export function toWhaleSpot(raw: RawTourItem): WhaleSpot {
  const id = raw.contentid;
  const text = `${raw.title} ${raw.overview ?? ""}`;
  const core = CORE_BY_ID[id];
  const linked = LINKED_SPOTS[id];
  const theme = core?.theme ?? linked ?? inferTheme(text);
  const relevance = core ? 1 : linked ? 0.6 : relevanceOf(text, raw.contenttypeid);

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
