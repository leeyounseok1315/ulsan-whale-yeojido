#!/usr/bin/env node
/**
 * 추천 코스 불변식 전수 검증 — 회귀 방지용.
 *
 *   node scripts/verify-courses.mjs [baseUrl ...]
 *   예) node scripts/verify-courses.mjs http://localhost:3000 http://localhost:3100
 *
 * 동행 4 × 기간 3 × 12개월 × 2일자(15·20일)를 전수로 돌며 아래를 확인한다.
 * 하나라도 깨지면 exit 1 — CI·배포 전 게이트로 쓸 수 있다.
 *
 * 불변식
 *  1. "바다 위 코스를 추천에 넣었어요"는 코스에 크루즈가 실제로 있을 때만  (거짓 안내 금지)
 *  2. substitutions의 대체 스팟은 코스에 있고, 제외 스팟은 코스에 없다
 *  3. "앞쪽에 배치" 같은 검증 불가한 단언이 없다
 *  4. refDate는 요청 날짜와 같다
 *  5. 정기 휴무일인 스팟은 편성되지 않는다                                  (W7)
 *  6. 축제는 개최기간 안에서만 편성된다                                     (W6)
 *  7. 같은 날 도착 시각이 역행하지 않는다
 *  8. 코스에 같은 스팟이 중복되지 않는다
 *  9. 코스가 비어 있지 않다
 */

const BASES = process.argv.slice(2).length ? process.argv.slice(2) : ["http://localhost:3000"];
const COMPANIONS = ["family", "couple", "friends", "solo"];
const DURATIONS = ["day", "1n2d", "2n3d"];
const DAYS_OF_MONTH = [15, 20]; // 20일엔 월요일이 섞여 휴무 케이스가 잡힌다

const fails = [];
let checked = 0;

/** 기준일의 요일 (0=일) — 백엔드 isClosedOn과 같은 기준. */
function weekdaySun0(date) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

async function checkOne(base, companion, duration, date) {
  const url = `${base}/api/recommend?companion=${companion}&duration=${duration}&date=${date}`;
  let course;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    course = (await res.json()).course;
  } catch (e) {
    fails.push([base, companion, duration, date, `요청 실패: ${e.message}`]);
    return;
  }
  checked += 1;

  const at = (msg) => fails.push([base, companion, duration, date, msg]);
  const titles = course.stops.map((s) => s.spot.title);
  const notes = course.seasonNotes.join(" | ");

  if (notes.includes("바다 위 코스를 추천에 넣었어요") && !titles.some((t) => t.includes("여행선"))) {
    at("크루즈 없이 '바다 위 코스를 넣었어요'");
  }
  for (const sub of course.substitutions) {
    if (!titles.includes(sub.replacedByTitle)) at(`대체 스팟이 코스에 없음: ${sub.replacedByTitle}`);
    if (titles.includes(sub.excludedTitle)) at(`제외했다는 스팟이 코스에 있음: ${sub.excludedTitle}`);
  }
  if (notes.includes("앞쪽에 배치")) at("검증 불가한 배치 단언이 남아 있음");
  if (course.refDate !== date) at(`refDate 불일치: ${course.refDate}`);

  const wd = weekdaySun0(date);
  for (const s of course.stops) {
    const op = s.spot.opening;
    if (op && !op.neverCloses && op.closedWeekdays.includes(wd)) {
      at(`정기 휴무일 스팟 편성: ${s.spot.title}`);
    }
    if (s.spot.contentTypeId === "15") {
      const p = s.spot.eventPeriod;
      const ymd = date.replace(/-/g, "");
      if (!p || ymd < p.start || ymd > p.end) at(`개최기간 밖 축제 편성: ${s.spot.title}`);
    }
  }

  let prevDay = null;
  let prevTime = null;
  for (const s of course.stops) {
    if (s.day !== prevDay) {
      prevDay = s.day;
      prevTime = null;
    }
    if (prevTime && s.arrive < prevTime) at(`도착 시각 역행: ${prevTime} → ${s.arrive}`);
    prevTime = s.arrive;
  }

  const ids = course.stops.map((s) => s.spot.id);
  if (ids.length !== new Set(ids).size) at("코스에 중복 스팟");
  if (!course.stops.length) at("빈 코스");
}

const tasks = [];
for (const base of BASES) {
  for (const companion of COMPANIONS) {
    for (const duration of DURATIONS) {
      for (let m = 1; m <= 12; m++) {
        for (const d of DAYS_OF_MONTH) {
          tasks.push([base, companion, duration, `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`]);
        }
      }
    }
  }
}

// 동시성 8 — 서버를 과하게 밀지 않으면서 충분히 빠르게.
let next = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < tasks.length) await checkOne(...tasks[next++]);
  }),
);

console.log(`검사한 코스: ${checked}개 (${BASES.join(", ")})`);
console.log(`불변식 위반: ${fails.length}건`);
for (const f of fails.slice(0, 30)) console.log("  FAIL", f.join(" · "));
if (fails.length > 30) console.log(`  … 외 ${fails.length - 30}건`);
process.exit(fails.length ? 1 : 0);
