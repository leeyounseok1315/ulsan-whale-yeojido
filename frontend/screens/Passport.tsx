"use client";

import { NavBar, SubnavStrip } from "@/frontend/components/chrome/NavBar";
import { useEffect, useState } from "react";
import {
    readVisits,
    type VisitRecord,
} from "@/frontend/lib/visitRecords";
import { WhaleMascot } from "@/frontend/components/chrome/WhaleMascot";
import { Plate } from "@/frontend/components/chrome/Plate";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";

function formatVerifiedAt(value: string) {
    const date = new Date(value);

    return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getExplorerRank(visitCount: number) {
    if (visitCount >= 5) {
        return {
            name: "울산 고래탐험가",
            icon: "🏆",
            next: null,
        };
    }

    if (visitCount >= 3) {
        return {
            name: "고래길 탐험가",
            icon: "🐋",
            next: 5,
        };
    }

    if (visitCount >= 1) {
        return {
            name: "아기고래 탐험가",
            icon: "🐳",
            next: 3,
        };
    }

    return {
        name: "예비 탐험가",
        icon: "🧭",
        next: 1,
    };
}

function canIssueWhaleLicense(visitCount: number) {
    return visitCount >= 3;
}

export function Passport() {
    const [visits, setVisits] = useState<VisitRecord[]>([]);

    useEffect(() => {
        setVisits(readVisits());
    }, []);

    const rank = getExplorerRank(visits.length);
    const licenseReady = canIssueWhaleLicense(visits.length);

    return (
        <main className="flex min-h-dvh flex-col bg-canvas">
            <NavBar />
            <SubnavStrip crumb="고래여권" />

            <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
                <Plate tone="lavender" chamfer className="p-5">
                    <div className="flex items-center gap-4">
                        <WhaleMascot className="h-20 w-auto shrink-0" />

                        <div>
                            <p className="wy-legend text-[11px] text-carbon/60">
                                ULSAN WHALE PASSPORT
                            </p>

                            <h1 className="wy-boxart mt-1 text-3xl text-carbon">
                                나의 고래여권
                            </h1>

                            <p className="mt-2 text-[13px] text-ink-soft">
                                GPS로 직접 방문 인증한 울산의 장소를 모아보세요.
                            </p>
                        </div>
                    </div>
                </Plate>

                <div className="mt-4">
                    <SectionLabelBar title="고래탐험가 등급" />

                    <Plate tone="surface" className="mt-2 p-4">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl" aria-hidden>
                                {rank.icon}
                            </div>

                            <div>
                                <p className="wy-legend text-[10px] text-signal">
                                    CURRENT EXPLORER RANK
                                </p>

                                <h2 className="mt-1 text-[16px] font-bold text-ink">
                                    {rank.name}
                                </h2>

                                <p className="mt-1 text-[11px] text-ink-soft">
                                    {rank.next === null
                                        ? "최고 탐험가 등급을 달성했어요!"
                                        : `다음 등급까지 ${rank.next - visits.length}곳 남았어요.`}
                                </p>
                            </div>
                        </div>
                    </Plate>
                </div>

                <div className="mt-4">
                    <SectionLabelBar title="고래면허증" />

                    {licenseReady ? (
                        <Plate tone="lavender" chamfer className="mt-2 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="wy-legend text-[10px] text-carbon/60">
                                        ULSAN WHALE EXPLORER LICENSE
                                    </p>

                                    <h2 className="wy-boxart mt-1 text-2xl text-carbon">
                                        고래면허증
                                    </h2>

                                    <p className="mt-2 text-[12px] font-semibold text-ink">
                                        {rank.name}
                                    </p>

                                    <p className="mt-1 text-[11px] text-ink-soft">
                                        GPS 인증 장소 {visits.length}곳
                                    </p>

                                    <p className="mt-2 text-[10px] text-ink-soft">
                                        울산고래여지도 서비스 내 탐험 인증
                                    </p>
                                </div>

                                <div className="text-5xl" aria-hidden>
                                    🐋
                                </div>
                            </div>
                        </Plate>
                    ) : (
                        <Plate tone="surface" className="mt-2 p-4">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl" aria-hidden>
                                    🔒
                                </div>

                                <div>
                                    <p className="text-[13px] font-bold text-ink">
                                        고래면허증 발급까지 {3 - visits.length}곳 남았어요.
                                    </p>

                                    <p className="mt-1 text-[11px] text-ink-soft">
                                        서로 다른 관광지 3곳에서 GPS 방문 인증을 완료해 보세요.
                                    </p>
                                </div>
                            </div>
                        </Plate>
                    )}
                </div>

                <div className="mt-4">
                    <SectionLabelBar title={`획득한 스탬프 · ${visits.length}개`} />

                    {visits.length === 0 ? (
                        <Plate tone="surface" className="mt-2 p-5 text-center">
                            <p className="text-[13px] font-semibold text-ink">
                                아직 획득한 고래 스탬프가 없어요.
                            </p>

                            <p className="mt-1 text-[12px] text-ink-soft">
                                관광지에서 GPS 방문 인증을 하면 여기에 스탬프가 기록돼요.
                            </p>
                        </Plate>
                    ) : (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {visits.map((visit) => (
                                <Plate
                                    key={visit.spotId}
                                    tone="surface"
                                    className="p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-signal bg-amber text-2xl">
                                            🐋
                                        </div>

                                        <div className="min-w-0">
                                            <p className="wy-legend text-[10px] text-signal">
                                                GPS VERIFIED
                                            </p>

                                            <h2 className="mt-0.5 truncate text-[14px] font-bold text-ink">
                                                {visit.title}
                                            </h2>

                                            <p className="mt-1 text-[10px] text-ink-soft">
                                                {formatVerifiedAt(visit.verifiedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Plate>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}