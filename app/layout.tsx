import type { Metadata, Viewport } from "next";
import "@/frontend/globals.css";
import { Providers } from "@/frontend/providers";

export const metadata: Metadata = {
  title: "울산고래여지도 — 고래의 시선으로 그린 울산",
  description:
    "옛 여지도(輿地圖) 위에 고래의 길로 다시 그린 울산. 장생포·반구대를 잇는 고래 테마 지도와 동행·기간별 코스 추천. 공공데이터 기반.",
  applicationName: "울산고래여지도",
  keywords: ["울산", "고래", "여지도", "장생포", "반구대", "여행", "코스 추천"],
};

export const viewport: Viewport = {
  themeColor: "#e3d8be",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="relative">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
