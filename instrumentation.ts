// Next.js 서버 기동 훅 — live 모드면 캐시를 미리 예열해 첫 방문 콜드 지연을 없앤다.
// (배치/Cron이 전수 수집으로 갱신하기 전, 빠른 수집으로 캐시를 채워둔다)
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { isMockMode } = await import("./lib/collect");
  if (isMockMode()) return; // mock은 즉시라 예열 불필요
  const { getSpots } = await import("./lib/data");
  getSpots()
    .then((s) => console.log(`[prewarm] 캐시 예열 완료 — ${s.length}건`))
    .catch((e) => console.warn("[prewarm] 예열 실패:", e instanceof Error ? e.message : e));
}
