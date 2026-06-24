// 전수 수집 트리거 스크립트 — 실행 중인 BFF의 배치 엔드포인트를 호출한다.
// 로컬: 개발 서버(npm run dev) 실행 후 `npm run collect`.
// 배포: Vercel Cron(W3)이 동일 라우트(/api/batch/collect)를 야간에 호출.
// 비밀값(CRON_SECRET)은 환경변수로만 전달 — 코드/깃 노출 금지.

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = process.env.CRON_SECRET || "";
const headers = SECRET ? { authorization: `Bearer ${SECRET}` } : {};

try {
  const res = await fetch(`${BASE}/api/batch/collect`, { method: "POST", headers });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
  process.exit(res.ok && json.ok !== false ? 0 : 1);
} catch (e) {
  console.error(`수집 트리거 실패: ${e.message} (서버가 떠 있나요? ${BASE})`);
  process.exit(1);
}
