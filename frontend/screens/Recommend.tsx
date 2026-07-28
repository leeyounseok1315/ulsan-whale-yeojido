"use client";

import { useState } from "react";
import { CourseMap } from "@/frontend/components/map/CourseMap";
import { NavBar, SubnavStrip } from "@/frontend/components/chrome/NavBar";
import { Plate } from "@/frontend/components/chrome/Plate";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";
import { ChromeButton } from "@/frontend/components/chrome/ChromeButton";
import { ToggleChip } from "@/frontend/components/chrome/ToggleChip";
import { WHALE_THEMES } from "@/backend/lib/theme";
import { isSeasonOpen } from "@/backend/lib/season";
import {
  COMPANION_LABEL,
  DURATION_LABEL,
  INTEREST_LABEL,
  INTERESTS,
  type Companion,
  type Course,
  type Duration,
  type Interest,
} from "@/backend/lib/types";

const COMPANIONS: Companion[] = ["family", "couple", "friends", "solo"];
const DURATIONS: Duration[] = ["day", "1n2d", "2n3d"];

export default function RecommendPage() {
  const [companion, setCompanion] = useState<Companion>("family");
  const [duration, setDuration] = useState<Duration>("day");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [date, setDate] = useState("");
  const [nearbyOn, setNearbyOn] = useState(false); // W8 — 주변 먹거리 함께 보기
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (i: Interest) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  async function recommend() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companion, duration });
      if (interests.length) qs.set("interests", interests.join(","));
      if (date) qs.set("date", date);
      if (nearbyOn) qs.set("nearby", "food");
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
    <main className="flex min-h-dvh flex-col bg-canvas">
      <NavBar />
      <SubnavStrip crumb="코스 추천" />

      <div className="mx-auto w-full max-w-3xl flex-1 px-3 py-3 sm:px-4">
        {/* ── 설계 폼 ── */}
        <SectionLabelBar title="Course Builder · 코스 설계" />
        <Plate tone="platinum" className="mt-1.5 p-4 sm:p-5">
          <h1 className="wy-boxart text-[26px] leading-tight text-[color:var(--color-carbon)] sm:text-[32px]" style={{ WebkitTextStroke: "0", textShadow: "none" }}>
            누구와, 며칠 동안 고래를 만날까요?
          </h1>

          <Field label="동행 유형">
            <div role="radiogroup" aria-label="동행 유형" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {COMPANIONS.map((c) => (
                <ToggleChip key={c} role="radio" active={companion === c} onClick={() => setCompanion(c)}>
                  {COMPANION_LABEL[c]}
                </ToggleChip>
              ))}
            </div>
          </Field>

          <Field label="체류 기간">
            <div role="radiogroup" aria-label="체류 기간" className="grid grid-cols-3 gap-1.5">
              {DURATIONS.map((d) => (
                <ToggleChip key={d} role="radio" active={duration === d} onClick={() => setDuration(d)}>
                  {DURATION_LABEL[d]}
                </ToggleChip>
              ))}
            </div>
          </Field>

          <Field label="관심사" hint="여러 개 선택 가능(선택)">
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((it) => (
                <ToggleChip key={it} active={interests.includes(it)} onClick={() => toggleInterest(it)}>
                  {INTEREST_LABEL[it]}
                </ToggleChip>
              ))}
            </div>
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="기준 날짜" hint="비우면 오늘">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="wy-inset h-10 w-full rounded-[2px] bg-white px-2.5 font-mono text-[13px] text-ink outline-none"
              />
            </Field>
            <Field label="주변 먹거리" hint="스팟 주변 맛집을 함께">
              <ToggleChip active={nearbyOn} onClick={() => setNearbyOn((v) => !v)} className="w-full">
                {nearbyOn ? "주변 먹거리 함께 보기 ✓" : "주변 먹거리 함께 보기"}
              </ToggleChip>
            </Field>
          </div>

          <ChromeButton variant="submit" className="mt-5 w-full" onClick={recommend} disabled={loading}>
            {loading ? "코스를 그리는 중…" : "고래 코스 추천받기"}
            {!loading && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M8 4l10 8-10 8" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </ChromeButton>

          {error && (
            <p className="wy-inset mt-3 rounded-[2px] bg-white px-3 py-2 text-[12px] font-semibold text-[color:var(--color-seal2)]">
              {error}
            </p>
          )}
        </Plate>

        {/* ── 결과 ── */}
        {course && (
          <section className="wy-fade-up mt-4">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="wy-chip wy-legend rounded-[2px] bg-carbon px-2.5 py-1 text-[11px] text-white">
                {COMPANION_LABEL[course.companion]} · {DURATION_LABEL[course.duration]}
              </span>
              {course.interests.map((i) => (
                <span key={i} className="wy-chip wy-legend rounded-[2px] bg-amber px-2 py-1 text-[10px] text-carbon">
                  {INTEREST_LABEL[i]}
                </span>
              ))}
              <span className="ml-auto font-mono text-[11px] text-carbon/70">기준 {course.refDate}</span>
            </div>

            {course.seasonNotes.map((note, i) => (
              <Plate key={i} tone="surface" className="mb-1.5 flex items-start gap-2 px-3 py-2">
                <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
                <span className="text-[12px] leading-snug text-ink">{note}</span>
              </Plate>
            ))}

            <div className="mt-3">
              <SectionLabelBar title="Route · 여지도 경로" />
              <Plate tone="canvas" className="mt-1.5 p-2">
                <CourseMap course={course} />
              </Plate>
            </div>

            {Array.from({ length: days }, (_, di) => di + 1).map((day) => (
              <div key={day} className="mt-4">
                <SectionLabelBar title={days > 1 ? `Day ${day} · ${day}일차` : "Day · 하루 코스"} />
                <ol className="mt-1.5 space-y-1.5">
                  {course.stops
                    .filter((s) => s.day === day)
                    .map((stop, idx) => (
                      <li key={stop.spot.id}>
                        <Plate tone="platinum" className="flex gap-3 p-2.5">
                          <span className="wy-chip flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full bg-signal text-[12px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-mono text-[13px] font-bold text-carbon">{stop.arrive}</span>
                              {stop.legKm > 0 && <span className="font-mono text-[10px] text-carbon/60">· 이동 {stop.legKm}km</span>}
                              <span className="ml-auto wy-legend text-[10px] text-[color:var(--color-chrome)]">
                                {WHALE_THEMES[stop.spot.theme].label}
                              </span>
                            </div>
                            <h3 className="mt-0.5 text-[15px] font-bold text-ink">{stop.spot.title}</h3>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {stop.openHours && (
                                <span className="wy-legend rounded-[2px] bg-canvas-soft px-1.5 py-0.5 text-[9px] text-carbon">
                                  운영 {stop.openHours}
                                </span>
                              )}
                              {stop.spot.seasonal && (
                                <span className="wy-legend rounded-[2px] bg-amber px-1.5 py-0.5 text-[9px] text-carbon">
                                  {isSeasonOpen(stop.spot.seasonal, course.refDate) ? "운항 중" : "운항 휴지기"}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[12px] leading-snug text-ink-soft">{stop.note}</p>
                            {stop.nearby && stop.nearby.length > 0 && (
                              <div className="wy-dotline mt-2 pt-1.5">
                                <span className="wy-legend text-[9px] text-carbon/60">주변 먹거리</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {stop.nearby.map((n) => (
                                    <span key={n.id} className="rounded-[2px] bg-white px-1.5 py-0.5 text-[10px] text-ink">
                                      {n.title} <span className="text-carbon/50">{n.distanceM}m</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Plate>
                      </li>
                    ))}
                </ol>
              </div>
            ))}

            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[11px] text-carbon/60">총 {course.distanceKm}km</span>
              <span className="wy-chip rounded-[2px] bg-amber px-2 py-0.5 text-[10px] font-bold text-carbon">공공데이터</span>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-1.5 flex items-baseline gap-1.5">
        <span className="wy-legend text-[11px] text-[color:var(--color-chrome)]">{label}</span>
        {hint && <span className="text-[10px] text-carbon/55">· {hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}
