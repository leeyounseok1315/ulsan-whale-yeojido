import { type NextRequest } from "next/server";

// 이미지 프록시 — 원격 이미지(공공데이터 CDN)를 서버가 대신 받아 스트리밍한다.
// 목적: ① 클라이언트가 외부 도메인을 직접 요청하지 않게(절대규칙 #1: 공사/출처 도메인 비노출)
//       ② http 혼합콘텐츠·핫링크 차단 대비 ③ 캐시 헤더로 성능. (PLAN.md W4 이미지 프록시 선반영)

// 허용 호스트만 프록시(오픈 프록시 남용 방지).
const ALLOWED_HOSTS = ["visitkorea.or.kr", "data.go.kr"];

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("missing url", { status: 400 });

  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
    return new Response("host not allowed", { status: 400 });
  }

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok || !(res.headers.get("content-type") || "").startsWith("image/")) {
      return new Response(null, { status: 404 });
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
