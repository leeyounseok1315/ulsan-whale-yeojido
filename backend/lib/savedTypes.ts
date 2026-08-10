import type { Companion, Duration, Interest } from "./types";

// 저장 코스·즐겨찾기 스키마 (W9) — MVP는 localStorage, Phase2에 서버(ERD의 course/course_item/favorite)로 이관.
// 필드명을 ERD 컬럼과 1:1로 맞춰 이관이 '매핑'만으로 끝나게 한다.
//
// 설계 결정: 코스는 **스냅샷이 아니라 입력 파라미터로** 저장한다.
//  - 운영시간·휴무·시즌·축제 개최기간은 시간이 지나면 바뀐다. 코스를 통째로 박제하면
//    '월요일 휴관인 곳이 든 코스'처럼 낡은(=틀린) 코스를 사용자에게 되돌려주게 된다.
//  - 재현성은 이미 확보돼 있다: /api/recommend가 (동행·기간·관심사·날짜·언어) 정규화 키로
//    캐싱하므로 같은 입력이면 같은 코스가 나온다.
//  - 대신 목록 표시에 필요한 최소 정보(제목·대표 이미지·스팟 수)만 함께 담아, 복원 전에도
//    카드로 보여줄 수 있게 한다. (이 값들은 '표시용 힌트'이지 진실의 출처가 아니다)

export const SAVED_SCHEMA_VERSION = 2 as const;

/** 저장 코스 — ERD course 테이블 대응. */
export interface SavedCourse {
  /** 로컬 식별자. Phase2 이관 시 서버 course_id로 대체되며, 중복 업로드 방지 키로도 쓴다. */
  localId: string;
  title: string; // ERD: title
  companionType: Companion; // ERD: companion_type
  durationType: Duration; // ERD: duration_type
  interests: Interest[]; // ERD: interests (JSON)
  /** 코스를 만든 기준 날짜(YYYY-MM-DD). 이 값으로 같은 코스를 재생성한다. */
  refDate: string;
  totalDays: number; // ERD: total_days
  coverImage: string | null; // ERD: cover_image
  /** 표시용 힌트 — 복원 전 카드에 보여줄 요약. 진실의 출처는 재생성된 코스다. */
  preview: { stopCount: number; distanceKm: number; spotTitles: string[] };
  createdAt: string; // ISO8601. ERD: created_at
  updatedAt: string; // ERD: updated_at
}

/** 즐겨찾기 — ERD favorite 테이블 대응((member_id, contentid) 복합 PK 중 contentid). */
export interface SavedFavorite {
  contentId: string; // ERD: contentid
  /** 표시용 힌트(제목·이미지) — 오프라인에서도 목록을 그릴 수 있게. */
  title: string;
  image: string | null;
  createdAt: string; // ERD: created_at
}

/** localStorage에 담기는 최상위 문서. */
export interface SavedStore {
  schemaVersion: number;
  courses: SavedCourse[];
  favorites: SavedFavorite[];
}

export const EMPTY_STORE: SavedStore = { schemaVersion: SAVED_SCHEMA_VERSION, courses: [], favorites: [] };

/** 저장 코스를 다시 불러올 때 쓰는 쿼리스트링 — /api/recommend 입력과 정확히 일치시킨다. */
export function savedCourseQuery(c: SavedCourse, opts?: { nearby?: string; lang?: string }): string {
  const qs = new URLSearchParams({
    companion: c.companionType,
    duration: c.durationType,
    date: c.refDate,
  });
  if (c.interests.length) qs.set("interests", [...c.interests].sort().join(","));
  if (opts?.nearby) qs.set("nearby", opts.nearby);
  if (opts?.lang && opts.lang !== "ko") qs.set("lang", opts.lang);
  return qs.toString();
}

/**
 * 스키마 마이그레이션 — 알 수 없는/낡은 문서를 현재 버전으로 끌어올린다.
 * 복구 불가하면 던지지 않고 빈 저장소를 돌려준다(사용자 데이터 때문에 앱이 죽지 않게).
 * v1 → v2: 코스 스냅샷(stops 전체 박제)을 버리고 파라미터 기반으로 전환.
 */
export function migrateStore(raw: unknown): SavedStore {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STORE };
  const doc = raw as Partial<SavedStore> & { version?: number; stops?: unknown };
  const version = Number(doc.schemaVersion ?? doc.version ?? 1);

  const favorites = Array.isArray(doc.favorites)
    ? doc.favorites.filter((f): f is SavedFavorite => Boolean(f && typeof (f as SavedFavorite).contentId === "string"))
    : [];

  let courses = Array.isArray(doc.courses) ? doc.courses : [];
  if (version < 2) {
    // v1은 코스에 stops 스냅샷을 담았다. 파라미터만 남기고 표시용 힌트를 재구성한다.
    courses = courses
      .map((c: unknown) => {
        const old = c as Partial<SavedCourse> & { stops?: Array<{ spot?: { title?: string; image?: string | null } }> };
        if (!old.companionType || !old.durationType || !old.refDate) return null;
        const stops = Array.isArray(old.stops) ? old.stops : [];
        return {
          localId: old.localId ?? `mig-${old.refDate}-${old.companionType}-${old.durationType}`,
          title: old.title ?? "저장한 코스",
          companionType: old.companionType,
          durationType: old.durationType,
          interests: Array.isArray(old.interests) ? old.interests : [],
          refDate: old.refDate,
          totalDays: old.totalDays ?? 1,
          coverImage: old.coverImage ?? stops[0]?.spot?.image ?? null,
          preview: old.preview ?? {
            stopCount: stops.length,
            distanceKm: 0,
            spotTitles: stops.map((s) => s.spot?.title ?? "").filter(Boolean),
          },
          createdAt: old.createdAt ?? new Date().toISOString(),
          updatedAt: old.updatedAt ?? new Date().toISOString(),
        } as SavedCourse;
      })
      .filter((c): c is SavedCourse => c !== null);
  }

  return { schemaVersion: SAVED_SCHEMA_VERSION, courses, favorites };
}

/**
 * Phase2 계정 이관 — 로컬 저장소를 서버 업로드용 페이로드로.
 * 멱등성: localId를 함께 올려 서버가 (member_id, localId)로 중복 업로드를 걸러낸다.
 * 충돌 해소: 같은 localId가 이미 있으면 updatedAt이 더 최신인 쪽을 채택(last-write-wins).
 */
export interface MigrationPayload {
  schemaVersion: number;
  exportedAt: string;
  courses: SavedCourse[];
  favorites: SavedFavorite[];
}
export function toMigrationPayload(store: SavedStore, now: string): MigrationPayload {
  return {
    schemaVersion: SAVED_SCHEMA_VERSION,
    exportedAt: now,
    courses: store.courses,
    favorites: store.favorites,
  };
}
