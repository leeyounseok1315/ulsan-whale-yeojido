import type { WhaleSpot } from "./types";
import { getSpot } from "./data";
import { detailCommon, detailImages, detailIntro } from "./tourapi";
import { cached } from "./cache";
import { sanitize } from "./sanitize";
import { isMockMode } from "./collect";

// detail* 통합 상세 조회 — base 스팟 + detailIntro2(운영시간·휴무·요금) + detailImage2(갤러리)
// + 필요 시 detailCommon2(overview). 스팟별 캐싱. (PLAN.md W3: detailCommon2/Intro2/Image2 통합)

const TTL_MS = 1000 * 60 * 60; // 1시간

// detailIntro2는 콘텐츠타입마다 필드명이 다르다(실측 기반 후보군).
const INTRO_FIELDS = {
  // 주의: 축제(15)의 usetimefestival은 '운영시간'이 아니라 '이용요금'이라 useFee로 분류. 축제 시간은 행사기간으로.
  useTime: ["usetime", "usetimeculture", "usetimeleports", "opentimefood", "opentime", "playtime", "checkintime"],
  restDate: ["restdate", "restdateculture", "restdateleports", "restdatefood", "restdateshopping"],
  useFee: ["usefee", "usefeeleports", "usetimefestival"],
  tel: ["infocenter", "infocenterculture", "infocenterfood", "infocenterleports", "infocenterlodging", "infocentershopping"],
};

// 축제 행사기간(eventstartdate~eventenddate, YYYYMMDD) → 운영시간 대체 표시.
function festivalPeriod(intro: Record<string, unknown> | null): string | undefined {
  if (!intro) return undefined;
  const fmt = (s: unknown) => {
    const v = String(s ?? "");
    return /^\d{8}$/.test(v) ? `${v.slice(0, 4)}.${v.slice(4, 6)}.${v.slice(6, 8)}` : "";
  };
  const sd = fmt(intro.eventstartdate);
  const ed = fmt(intro.eventenddate);
  return sd ? `행사기간 ${sd}${ed ? ` ~ ${ed}` : ""}` : undefined;
}

// HTML 제거 + 공사 표기 sanitize.
function clean(s?: string | null): string | undefined {
  if (!s) return undefined;
  const t = String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return sanitize(t) || undefined;
}

function pick(item: Record<string, unknown> | null, fields: string[]): string | undefined {
  if (!item) return undefined;
  for (const f of fields) {
    const v = item[f];
    if (v && String(v).trim()) return clean(String(v));
  }
  return undefined;
}

// 자체 이미지가 없는 스팟 → 대표(소속) 스팟의 실사진으로 보강.
// 예: 장생포고래문화특구는 고래박물관을 포함하는 '특구(지역)'라 박물관 사진을 대표로 사용.
const REPRESENTATIVE_IMAGE: Record<string, string> = {
  "3495467": "130649", // 장생포고래문화특구 → 장생포 고래박물관
};

/** 상세 패널용 — base 스팟에 운영시간·요금·갤러리를 보강한 모델. 스팟별 캐싱. */
export async function getSpotDetail(id: string): Promise<WhaleSpot | null> {
  const base = await getSpot(id);
  if (!base) return null;
  if (isMockMode()) return base; // mock 픽스처는 이미 detail 포함

  return cached(`detail:${id}`, TTL_MS, async () => {
    const [intro, images, common] = await Promise.all([
      detailIntro(id, base.contentTypeId).catch(() => null),
      detailImages(id).catch(() => [] as string[]),
      base.summary ? Promise.resolve(null) : detailCommon(id).catch(() => null), // overview 없을 때만
    ]);

    const overview = base.summary || clean(common?.overview) || "";
    let gallery = images;
    let firstImg =
      base.image ||
      (common?.firstimage ? common.firstimage.replace(/^http:\/\//i, "https://") : null) ||
      images[0] ||
      null;

    // 자체 이미지가 없으면 대표(소속) 스팟의 실사진으로 보강
    if (!firstImg && gallery.length === 0 && REPRESENTATIVE_IMAGE[id]) {
      const rep = REPRESENTATIVE_IMAGE[id];
      const [repImgs, repCommon] = await Promise.all([
        detailImages(rep).catch(() => [] as string[]),
        detailCommon(rep).catch(() => null),
      ]);
      gallery = repImgs;
      firstImg =
        (repCommon?.firstimage ? repCommon.firstimage.replace(/^http:\/\//i, "https://") : null) ||
        repImgs[0] ||
        null;
    }

    return {
      ...base,
      summary: overview,
      tel: base.tel || pick(intro, INTRO_FIELDS.tel) || (common?.tel ? sanitize(common.tel) : null) || null,
      image: firstImg,
      images: gallery,
      detail: {
        useTime: pick(intro, INTRO_FIELDS.useTime) ?? festivalPeriod(intro),
        restDate: pick(intro, INTRO_FIELDS.restDate),
        useFee: pick(intro, INTRO_FIELDS.useFee),
      },
    };
  }, { tags: ["spots", "detail"] });
}
