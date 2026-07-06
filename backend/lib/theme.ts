import type { WhaleTheme, WhaleThemeId } from "./types";

/** 고래 테마 4분류 — 콘텐츠 조직·내비게이션·범례의 기준 (행정구역 아님). */
export const WHALE_THEMES: Record<WhaleThemeId, WhaleTheme> = {
  culture: {
    id: "culture",
    label: "고래 문화",
    blurb: "장생포 고래문화특구 — 박물관·생태체험·문화마을",
    tone: "seal",
  },
  observe: {
    id: "observe",
    label: "고래 관찰",
    blurb: "고래바다여행선 — 바다 위 고래의 시선 (4~10월)",
    tone: "water",
  },
  heritage: {
    id: "heritage",
    label: "고래 유산",
    blurb: "반구대 암각화 — 선사시대 고래잡이의 기록",
    tone: "ink",
  },
  nature: {
    id: "nature",
    label: "고래의 강·산",
    blurb: "태화강·영남알프스 — 고래 도시를 품은 자연",
    tone: "jade",
  },
};

export const THEME_ORDER: WhaleThemeId[] = ["culture", "observe", "heritage", "nature"];

/** 디자인 토큰 색 변수 매핑 (CSS custom property) — 모듈 내부 전용 */
const TONE_VAR: Record<WhaleTheme["tone"], string> = {
  seal: "var(--color-seal)",
  water: "var(--color-water)",
  ink: "var(--color-ink)",
  jade: "var(--color-jade)",
};

export function themeColor(theme: WhaleThemeId): string {
  return TONE_VAR[WHALE_THEMES[theme].tone];
}
