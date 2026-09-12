"use client";

import Link from "next/link";
import { useState } from "react";
import { getBusTransit } from "@/frontend/lib/odsay";
import { CourseMap } from "@/frontend/components/map/CourseMap";
import { NavBar, SubnavStrip } from "@/frontend/components/chrome/NavBar";
import { Plate } from "@/frontend/components/chrome/Plate";
import { SectionLabelBar } from "@/frontend/components/chrome/SectionLabelBar";
import { ChromeButton } from "@/frontend/components/chrome/ChromeButton";
import { ToggleChip } from "@/frontend/components/chrome/ToggleChip";
import { WHALE_THEMES } from "@/backend/lib/theme";
import { isEventRunning, isSeasonOpen } from "@/backend/lib/season";
import {
  COURSE_THEME_LABEL,
  COURSE_THEMES,
  type CourseTheme,
  COMPANION_LABEL,
  DURATION_LABEL,
  INTEREST_LABEL,
  INTERESTS,
  type Companion,
  type Course,
  type Duration,
  type Interest,
  type WhaleSpot,
} from "@/backend/lib/types";

const COMPANIONS: Companion[] = ["family", "couple", "friends", "solo"];
const DURATIONS: Duration[] = ["day", "1n2d", "2n3d"];

const COURSE_DWELL_MIN = 80;

function parseClock(value?: string): number | null {
  if (!value) return null;

  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatClock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
    Math.cos(toRad(b.lat)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

async function applyTransitToCourse(course: Course): Promise<Course> {
  const updatedStops: Course["stops"] = [];

  for (const stop of course.stops) {
    const prev = updatedStops[updatedStops.length - 1];

    // 하루 첫 장소는 이전 장소가 없으므로 이동수단 없음.
    if (!prev || prev.day !== stop.day) {
      updatedStops.push({
        ...stop,
        travelMin: 0,
        transportMode: undefined,
      });
      continue;
    }

    let travelMin = stop.travelMin;
    let transportMode = stop.transportMode;

    // 서버에서 택시 후보로 잡힌 장거리 구간만 ODsay 버스 경로를 확인한다.
    if (stop.transportMode === "taxi") {
      const transit = await getBusTransit(prev.spot, stop.spot);

      if (transit.available && transit.travelMin !== undefined) {
        transportMode = "bus";
        travelMin = transit.travelMin;
      } else {
        transportMode = "taxi";
      }
    }

    // 실제 선택된 이동수단의 이동시간으로 도착 예정시각을 다시 계산한다.
    const prevArrive = parseClock(prev.arrive) ?? 10 * 60;

    let arriveMin =
      prevArrive +
      COURSE_DWELL_MIN +
      travelMin;

    // 운영 시작 전이면 오픈 시간까지 기다린다.
    if (!stop.spot.opening?.alwaysOpenHours) {
      const openMin = parseClock(stop.spot.opening?.open);

      if (openMin !== null && arriveMin < openMin) {
        arriveMin = openMin;
      }
    }

    updatedStops.push({
      ...stop,
      arrive: formatClock(arriveMin),
      travelMin,
      transportMode,
    });
  }

  return {
    ...course,
    stops: updatedStops,
  };
}

export default function RecommendPage() {
  const [theme, setTheme] = useState<CourseTheme>("whale");
  const [companion, setCompanion] = useState<Companion>("family");
  const [duration, setDuration] = useState<Duration>("day");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [date, setDate] = useState("");
  const [nearbyOn, setNearbyOn] = useState(false); // W8 — 주변 먹거리 함께 보기
  const [course, setCourse] = useState<Course | null>(null);
  const [seenSpotIds, setSeenSpotIds] = useState<string[]>([]);
  const [nearbyExplore, setNearbyExplore] = useState<
    { spot: WhaleSpot; distanceKm: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (i: Interest) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  async function recommend(excludeIds: string[] = []) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companion, duration, theme });
      if (interests.length) qs.set("interests", interests.join(","));
      if (date) qs.set("date", date);
      if (nearbyOn) qs.set("nearby", "food");
      if (excludeIds.length) {
        qs.set("exclude", excludeIds.join(","));
      }
      const res = await fetch(`/api/recommend?${qs.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const baseCourse = json.course as Course;
      const transitCourse = await applyTransitToCourse(baseCourse);

      // 현재 추천 코스 주변의 다른 관광지를 찾아
      // "이 고래길 주변에서 더 둘러보기"에 사용한다.
      try {
        const spotsRes = await fetch("/api/spots");

        if (spotsRes.ok) {
          const spotsJson = await spotsRes.json();

          const allSpots: WhaleSpot[] = Array.isArray(spotsJson)
            ? spotsJson
            : Array.isArray(spotsJson.spots)
              ? spotsJson.spots
              : [];

          const courseIds = new Set(
            transitCourse.stops.map((stop) => String(stop.spot.id)),
          );

          const explore = allSpots
            .filter((spot) => {
              // 이미 코스에 들어간 장소는 제외
              if (courseIds.has(String(spot.id))) return false;

              // 음식점·숙박·캠핑시설은 여기서는 제외
              if (spot.contentTypeId === "39" || spot.contentTypeId === "32") {
                return false;
              }

              if (
                spot.category === "food" ||
                spot.category === "lodging" ||
                /캠핑장|야영장|오토캠핑|글램핑|캠프/.test(spot.title)
              ) {
                return false;
              }

              // 축제는 추천 기준 날짜에 실제 개최 중일 때만 보여준다.
              if (
                spot.contentTypeId === "15" &&
                !isEventRunning(spot.eventPeriod, transitCourse.refDate)
              ) {
                return false;
              }

              return Number.isFinite(spot.lat) && Number.isFinite(spot.lon);
            })
            .map((spot) => {
              const distanceKm = Math.min(
                ...transitCourse.stops.map((stop) =>
                  haversineKm(stop.spot, spot),
                ),
              );

              return {
                spot,
                distanceKm: Math.round(distanceKm * 100) / 100,
              };
            })
            // "주변"이라는 표현에 맞게 코스 어느 지점에서든 5km 이내만
            .filter((item) => item.distanceKm <= 5)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 4);

          setNearbyExplore(explore);
        } else {
          setNearbyExplore([]);
        }
      } catch {
        // 주변 탐색 실패가 메인 코스 추천까지 막으면 안 된다.
        setNearbyExplore([]);
      }

      const newIds = transitCourse.stops.map((stop) => String(stop.spot.id));

      const stopsPerCourse =
        duration === "day"
          ? 3
          : duration === "1n2d"
            ? 6
            : 9;

      const maxRememberedIds = stopsPerCourse * 2;

      setSeenSpotIds((prev) =>
        excludeIds.length
          ? [...new Set([...prev, ...newIds])].slice(-maxRememberedIds)
          : newIds,
      );

      setCourse(transitCourse);
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

          <Field label="여행 테마">
            <div
              role="radiogroup"
              aria-label="여행 테마"
              className="grid grid-cols-2 gap-1.5 sm:grid-cols-5"
            >
              {COURSE_THEMES.map((t) => (
                <ToggleChip
                  key={t}
                  role="radio"
                  active={theme === t}
                  onClick={() => setTheme(t)}
                >
                  {COURSE_THEME_LABEL[t]}
                </ToggleChip>
              ))}
            </div>
          </Field>

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

          <ChromeButton variant="submit" className="mt-5 w-full" onClick={() => recommend()} disabled={loading}>
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
              <span className="wy-chip wy-legend rounded-[2px] bg-amber px-2 py-1 text-[10px] text-carbon">
                {COURSE_THEME_LABEL[course.theme]}
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
                              {stop.transportMode && (
                                <span className="font-mono text-[10px] text-carbon/60">
                                  · {stop.transportMode === "walk"
                                    ? "🚶 도보"
                                    : stop.transportMode === "bus"
                                      ? "🚌 버스"
                                      : "🚕 택시"}
                                  {" "}예상 약 {stop.travelMin}분
                                  {" · "}
                                  {stop.legKm > 0 ? `${stop.legKm}km` : "매우 가까움"}
                                </span>
                              )}
                              <span className="ml-auto wy-legend text-[10px] text-[color:var(--color-chrome)]">
                                {stop.spot.contentTypeId === "39"
                                  ? stop.spot.cat3 === "A05020900"
                                    ? "☕ 카페"
                                    : "🍽️ 먹거리"
                                  : WHALE_THEMES[stop.spot.theme].label}
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
              <span className="font-mono text-[11px] text-carbon/60">
                총 {course.distanceKm}km
              </span>
              <span className="wy-chip rounded-[2px] bg-amber px-2 py-0.5 text-[10px] font-bold text-carbon">
                공공데이터
              </span>
            </div>

            {nearbyExplore.length > 0 && (
              <div className="mt-4">
                <SectionLabelBar title="🐋 이 고래길 주변에서 더 둘러보기" />

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  {nearbyExplore.map(({ spot, distanceKm }) => (
                    <Plate
                      key={spot.id}
                      tone="platinum"
                      className="p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="wy-legend text-[9px] text-[color:var(--color-chrome)]">
                            {WHALE_THEMES[spot.theme].label}
                          </span>

                          <h3 className="mt-0.5 truncate text-[14px] font-bold text-ink">
                            {spot.title}
                          </h3>

                          <p className="mt-1 text-[10px] text-carbon/60">
                            현재 고래길에서{" "}
                            {distanceKm < 0.1
                              ? "매우 가까움"
                              : distanceKm < 1
                                ? `직선거리 약 ${Math.round(distanceKm * 1000)}m`
                                : `직선거리 약 ${distanceKm}km`}
                          </p>
                        </div>

                        <span
                          className="shrink-0 text-[18px]"
                          aria-hidden
                        >
                          🐋
                        </span>
                      </div>
                    </Plate>
                  ))}
                </div>

                <Link
                  href="/map?scope=all"
                  className="mt-2 flex w-full items-center justify-center rounded-[2px] bg-carbon px-3 py-2.5 text-[12px] font-bold text-white"
                >
                  고래여지도에서 전체 관광지 보기 →
                </Link>
              </div>
            )}

            <ChromeButton
              className="mt-3 w-full"
              onClick={() => recommend(seenSpotIds)}
              disabled={loading || seenSpotIds.length === 0}
            >
              {loading ? "다른 코스를 찾는 중…" : "🔄 다른 코스 추천받기"}
            </ChromeButton>

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
