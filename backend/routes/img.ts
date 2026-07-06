import { type NextRequest } from "next/server";

// 이미지 프록시 — 원격 이미지(공공데이터 CDN)를 서버가 대신 받아 스트리밍한다.
// 목적: ① 클라이언트가 외부 도메인을 직접 요청하지 않게(절대규칙 #1: 공사/출처 도메인 비노출)
//       ② http 혼합콘텐츠·핫링크 차단 ③ 캐시 헤더로 성능 ④ 폴백은 프론트가 처리. (PLAN.md W4)

const ALLOWED_HOSTS = ["visitkorea.or.kr", "data.go.kr"]; // 허용 호스트만 프록시(오픈 프록시 남용 방지)
const MAX_BYTES = 10 * 1024 * 1024; // 10MB 상한

function hostAllowed(hostname: string): boolean {
  return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("missing url", { status: 400 });

  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (url.protocol !== "https:" || !hostAllowed(url.hostname)) {
    return new Response("host not allowed", { status: 400 });
  }

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    // 리다이렉트가 비허용 호스트로 향했는지 최종 URL로 재검증 (SSRF 방지)
    let finalHost = url.hostname;
    try {
      finalHost = new URL(res.url).hostname;
    } catch {
      /* res.url 파싱 실패 시 원 호스트 유지 */
    }
    if (!hostAllowed(finalHost)) return new Response("redirect not allowed", { status: 400 });

    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.startsWith("image/")) return new Response(null, { status: 404 });

    const declaredLen = Number(res.headers.get("content-length") ?? 0);
    if (declaredLen && declaredLen > MAX_BYTES) return new Response("too large", { status: 413 });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return new Response("too large", { status: 413 });

    return new Response(buf, {
      headers: {
        "content-type": ct || "image/jpeg",
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
