"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// 외부 이미지는 서버 프록시 경유 — 클라이언트가 출처 도메인을 직접 요청하지 않게 한다.
// (절대규칙 #1 · backend/routes/img.ts 와 동일한 의도. 로컬 경로는 그대로 둔다.)
const proxied = (src: string) =>
    /^https?:\/\//.test(src) ? `/api/img?u=${encodeURIComponent(src)}` : src;

type SpotItem = {
    title: string;
    desc: string;
    image: string;
    href: string;
};

export function SpotCarousel({
    spots,
}: {
    spots: SpotItem[];
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const [canScrollLeft, setCanScrollLeft] =
        useState(false);
    const [canScrollRight, setCanScrollRight] =
        useState(true);

    const updateButtons = () => {
        const el = scrollRef.current;

        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 5);

        setCanScrollRight(
            el.scrollLeft + el.clientWidth <
            el.scrollWidth - 5,
        );
    };

    useEffect(() => {
        const el = scrollRef.current;

        if (!el) return;

        updateButtons();

        el.addEventListener("scroll", updateButtons);

        window.addEventListener("resize", updateButtons);

        return () => {
            el.removeEventListener(
                "scroll",
                updateButtons,
            );

            window.removeEventListener(
                "resize",
                updateButtons,
            );
        };
    }, [spots]);

    const move = (direction: "left" | "right") => {
        const el = scrollRef.current;

        if (!el) return;

        const distance = el.clientWidth * 0.78;

        el.scrollBy({
            left:
                direction === "right"
                    ? distance
                    : -distance,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative mt-7">
            <div
                ref={scrollRef}
                className="spot-carousel-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
            >
                {spots.map((spot) => (
                    <Link
                        key={spot.title}
                        href={spot.href}
                        className="
              group
              relative
              aspect-[1.35/1]
              w-[78%]
              shrink-0
              snap-start
              overflow-hidden
              rounded-[18px]
              shadow-[0_12px_28px_rgba(41,83,135,0.14)]
              sm:w-[47%]
              lg:w-[calc(25%_-_9px)]
            "
                    >
                        <img
                            src={proxied(spot.image)}
                            alt={spot.title}
                            className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                transition
                duration-500
                group-hover:scale-105
              "
                        />

                        <div
                            className="
                absolute
                inset-0
                bg-gradient-to-t
                from-[#102f58]/90
                via-[#153a65]/20
                to-transparent
              "
                        />

                        <div className="absolute inset-x-0 bottom-0 p-4">
                            <h3 className="text-[13px] font-extrabold tracking-[-0.02em] text-white">
                                {spot.title}
                            </h3>

                            <p className="mt-0.5 text-[10px] font-medium text-white/85">
                                {spot.desc}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {
                canScrollLeft && (
                    <button
                        type="button"
                        onClick={() => move("left")}
                        aria-label="이전 관광지 보기"
                        className="
            absolute
            -left-4
            top-1/2
            z-20
            hidden
            h-11
            w-11
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-[#dce8f5]
            bg-white
            text-xl
            font-bold
            text-[#214a87]
            shadow-[0_8px_22px_rgba(44,83,130,0.18)]
            transition
            hover:scale-105
            lg:flex
          "
                    >
                        ‹
                    </button>
                )
            }

            {
                canScrollRight && (
                    <button
                        type="button"
                        onClick={() => move("right")}
                        aria-label="다음 관광지 보기"
                        className="
            absolute
            -right-4
            top-1/2
            z-20
            hidden
            h-11
            w-11
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-[#dce8f5]
            bg-white
            text-xl
            font-bold
            text-[#214a87]
            shadow-[0_8px_22px_rgba(44,83,130,0.18)]
            transition
            hover:scale-105
            lg:flex
          "
                    >
                        ›
                    </button>
                )
            }
        </div >
    );
}