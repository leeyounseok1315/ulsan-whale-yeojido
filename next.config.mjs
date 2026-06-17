/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    // 추후 공공데이터 이미지(firstimage) 표시 대비 — 실제 도메인은 BFF 프록시로 좁힌다.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
