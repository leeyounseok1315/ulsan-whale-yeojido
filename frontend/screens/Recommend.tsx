"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { SeasonBadge } from "@/frontend/components/ui/SeasonBadge";
import { SourceLabel } from "@/frontend/components/ui/SourceLabel";
import { ToggleButton } from "@/frontend/components/ui/ToggleButton";
import { themeColor, WHALE_THEMES } from "@/backend/lib/theme";
import { isSeasonOpen } from "@/backend/lib/season";
import {
  COMPANION_LABEL,
  DURATION_LABEL,
  type Companion,
  type Course,
  type Duration,
} from "@/backend/lib/types";

const COMPANIONS: Companion[] = ["family", "couple", "friends", "solo"];
const DURATIONS: Duration[] = ["day", "1n2d", "2n3d"];

export default function RecommendPage() {
  const [companion, setCompanion] = useState<Companion>("family");
  const [duration, setDuration] = useState<Duration>("day");
  const [date, setDate] = useState(""); // 기준 날짜(시즌 검증용) — 비우면 오늘
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recommend() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companion, duration });
      if (date) qs.set("date", date);
      const res = await fetch(`/api/recommend?${qs.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCourse(json.course as Course);
    } catch {
      setError("코스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  const days = course ? Math.max(...course.stops.map((s) => s.day), 0) : 0;

  return (
    <main className="paper-grain min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 pt-6">
        <Link href="/" className="font-display text-lg font-bold text-ink">
          ← 울산고래여지도
        </Link>
        <Link href="/map" className="rounded-[3px] border border-ink/25 bg-paper-light/70 px-3 py-1.5 text-sm font-semibold hover:bg-paper-light">
          지도 보기
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-6 pb-20 pt-8">
        <p className="font-mono text-xs tracking-[0.3em] text-seal">輿地圖 · 코스 추천</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">누구와, 며칠 동안 고래를 만날까요?</h1>

        {/* 동행 유형 */}
        <fieldset className="mt-8">
          <legend className="mb-2 text-sm font-semibold text-ink-soft">동행 유형</legend>
          <div role="radiogroup" aria-label="동행 유형" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COMPANIONS.map((c) => (
              <ToggleButton key={c} shape="block" role="radio" active={companion === c} onClick={() => setCompanion(c)}>
                {COMPANION_LABEL[c]}
              </ToggleButton>
            ))}
          </div>
        </fieldset>

        {/* 체류 기간 */}
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-semibold text-ink-soft">체류 기간</legend>
          <div role="radiogroup" aria-label="체류 기간" className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <ToggleButton key={d} shape="block" role="radio" active={duration === d} onClick={() => setDuration(d)}>
                {DURATION_LABEL[d]}
              </ToggleButton>
            ))}
          </div>
        </fieldset>

        {/* 기준 날짜(시즌 확인) */}
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-semibold text-ink-soft">
            기준 날짜 <span className="font-normal text-ink-faint">· 시즌 확인용, 비우면 오늘</span>
          </legend>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[3px] border border-ink/25 bg-paper-light/70 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-ink/60"
          />
        </fieldset>

        <Button className="mt-7 w-full" onClick={recommend} disabled={loading}>
          {loading ? "코스를 그리는 중…" : "고래 코스 추천받기"}
        </Button>

        {error && <p className="mt-4 rounded-[3px] border border-seal/40 bg-seal/5 px-4 py-3 text-sm text-seal-deep">{error}</p>}

        {/* 결과 */}
        {course && (
          <section className="wy-fade-up mt-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-paper-light">
                {COMPANION_LABEL[course.companion]} · {DURATION_LABEL[course.duration]}
              </span>
              <span className="font-mono text-xs text-ink-faint">기준 {course.refDate}</span>
            </div>

            {course.seasonNotes.map((note, i) => (
              <p key={i} className="mb-2 rounded-[3px] border border-water/30 bg-water/5 px-4 py-2.5 text-sm leading-snug text-water">
                {note}
              </p>
            ))}

            {Array.from({ length: days }, (_, di) => di + 1).map((day) => (
              <div key={day} className="mt-6">
                <h2 className="mb-3 font-display text-lg font-bold text-ink">
                  {days > 1 ? `${day}일차` : "하루 코스"}
                </h2>
                <ol className="relative space-y-3 border-l-2 border-ink/15 pl-5">
                  {course.stops
                    .filter((s) => s.day === day)
                    .map((stop) => (
                      <li key={stop.spot.id} className="relative">
                        <span
                          className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-paper-light"
                          style={{ backgroundColor: themeColor(stop.spot.theme) }}
                        />
                        <Card className="p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-semibold text-ink-soft">{stop.arrive}</span>
                            <span className="text-[11px] text-ink-faint">{WHALE_THEMES[stop.spot.theme].label}</span>
                          </div>
                          <h3 className="mt-1 font-display text-lg font-bold text-ink">{stop.spot.title}</h3>
                          {stop.spot.seasonal && (
                            <div className="mt-1.5">
                              <SeasonBadge
                                open={isSeasonOpen(stop.spot.seasonal, course.refDate)}
                                label={stop.spot.seasonal.label}
                              />
                            </div>
                          )}
                          <p className="mt-1.5 text-sm leading-snug text-ink-soft">{stop.note}</p>
                        </Card>
                      </li>
                    ))}
                </ol>
              </div>
            ))}

            <div className="mt-6">
              <SourceLabel />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

