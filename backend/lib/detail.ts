import type { WhaleSpot } from "./types";
import { getSpot } from "./data";
import { attachSeasonRules, eventPeriodOf } from "./adapter";
import { detailCommon, detailImages, detailIntro } from "./tourapi";
import { cached } from "./cache";
import { sanitize } from "./sanitize";
import { isMockMode } from "./collect";
import { INTRO_FIELDS, clean, pick } from "./introFields";

// detail* 통합 상세 조회 — base 스팟 + detailIntro2(운영시간·휴무·요금) + detailImage2(갤러리)
// + 필요 시 detailCommon2(overview). 스팟별 캐싱. (PLAN.md W3: detailCommon2/Intro2/Image2 통합)

const TTL_MS = 1000 * 60 * 60; // 1시간

// 축제 행사기간(eventstartdate~eventenddate) → 운영시간 자리에 함께 표시.
// 축제는 '몇 시에 여는가'보다 '언제 하는가'가 먼저다.
function festivalPeriod(intro: Record<string, unknown> | null): string | undefined {
  const p = eventPeriodOf(intro);
  if (!p) return undefined;
  const fmt = (v: string) => `${v.slice(0, 4)}.${v.slice(4, 6)}.${v.slice(6, 8)}`;
  return `행사기간 ${fmt(p.start)}${p.end !== p.start ? ` ~ ${fmt(p.end)}` : ""}`;
}

/**
 * 축제(15)의 운영시간 표기 — 행사기간을 앞에 두고 진행시간(playtime)을 뒤에 붙인다.
 * (과거엔 useTime 후보에 playtime이 먼저 걸려 festivalPeriod가 영영 호출되지 않는 죽은 코드였고,
 *  사용자는 축제가 '언제 열리는지'를 상세에서 전혀 볼 수 없었다)
 */
function festivalUseTime(intro: Record<string, unknown> | null): string | undefined {
  return [festivalPeriod(intro), pick(intro, ["playtime"])].filter(Boolean).join(" · ") || undefined;
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

  // 상세 캐시에도 base가 통째로 들어가므로, 시즌 규칙은 반환 직전에 현재 코드 기준으로 다시 부착한다.
  return attachSeasonRules(await cached(`detail:${id}`, TTL_MS, async () => {
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
        useTime:
          base.contentTypeId === "15"
            ? festivalUseTime(intro)
            : pick(intro, INTRO_FIELDS.useTime),
        restDate: pick(intro, INTRO_FIELDS.restDate),
        useFee: pick(intro, INTRO_FIELDS.useFee),
      },
    };
  }, { tags: ["spots", "detail"] }));
}
