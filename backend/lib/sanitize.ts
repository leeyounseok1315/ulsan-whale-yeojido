// 절대규칙 #1: 사용자에게 노출되는 텍스트에서 공사 명칭/약어를 제거하고
// 중립 표현('공공데이터')으로 치환한다. 데이터 파싱 경계(adapter)에서 호출.

const BANNED: RegExp[] = [
  /한국관광공사/g,
  /\bKTO\b/gi,
  /Korea\s*Tourism\s*Organization/gi,
];

export function sanitize(text: string): string {
  let out = text ?? "";
  for (const re of BANNED) out = out.replace(re, "공공데이터");
  return out.trim();
}

/** QA용 — 금지어 잔존 여부 검사 (내부 점검 전용) */
export function hasBannedTerm(text: string): boolean {
  return BANNED.some((re) => {
    re.lastIndex = 0;
    return re.test(text ?? "");
  });
}
