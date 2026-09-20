import Link from "next/link";

const HERO_FEATURES = [
    {
        icon: "🌊",
        title: "고래의 도시 울산",
        desc: "바다가 들려주는 이야기를 만나보세요.",
    },
    {
        icon: "🗺️",
        title: "다양한 테마 코스",
        desc: "취향에 맞는 울산 여행을 추천해요.",
    },
    {
        icon: "🐋",
        title: "나만의 고래여권",
        desc: "여행의 추억을 차곡차곡 모아보세요.",
    },
    {
        icon: "📷",
        title: "지금, 울산으로",
        desc: "고래가 기다리고 있어요.",
    },
];

export function HeroSection() {
    return (
        <section className="relative mx-auto w-full max-w-[1680px] px-0">
            <div className="relative h-[650px] overflow-hidden bg-[#eef6ff]">
                {/* 배경 이미지 */}
                <div className="absolute inset-0">
                    <img
                        src="/images/landing/hero-bg.webp"
                        alt="울산 고래여지도 히어로 배경"
                        className="h-full w-full object-cover object-center"
                    />
                </div>


                {/* 실제 클릭 버튼 */}
                <div className="absolute left-[5.8%] top-[66%] z-10 flex gap-4">
                    <Link
                        href="/map"
                        className="inline-flex h-[58px] items-center justify-center rounded-[16px] bg-[#ffb23e] px-8 text-[17px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,169,50,0.30)] transition hover:-translate-y-0.5 hover:brightness-105"
                    >
                        여지도 펼치기
                        <span className="ml-3 text-[20px]">→</span>
                    </Link>

                    <Link
                        href="/recommend"
                        className="inline-flex h-[58px] items-center justify-center rounded-[16px] border border-[#d4e2f2] bg-white/95 px-8 text-[17px] font-extrabold text-[#245492] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                    >
                        추천 코스 보기
                    </Link>
                </div>
            </div>

            {/* 하단 4칸 */}
            <div className="relative z-20 mx-10 -mt-7 overflow-hidden rounded-[26px] border border-[#e3ebf5] bg-white/95 shadow-[0_14px_40px_rgba(38,91,145,0.12)] backdrop-blur-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {HERO_FEATURES.map((item, index) => (
                        <div
                            key={item.title}
                            className={[
                                "flex min-h-[100px] items-center gap-5 px-8 py-4",
                                index !== 0 ? "border-t border-[#e5edf6] sm:border-t-0" : "",
                                index % 2 !== 0 ? "sm:border-l sm:border-[#e5edf6]" : "",
                                index >= 2 ? "lg:border-l lg:border-[#e5edf6]" : "",
                            ].join(" ")}
                        >
                            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[26px]">
                                {item.icon}
                            </div>

                            <div className="min-w-0">
                                <p className="whitespace-nowrap text-[18px] font-extrabold tracking-[-0.03em] text-[#1f4f96]">
                                    {item.title}
                                </p>

                                <p className="mt-1 whitespace-nowrap text-[11px] leading-[1.6] tracking-[-0.02em] text-[#8194af]">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}