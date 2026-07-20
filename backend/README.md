# backend/ — 백엔드 / BFF (담당: 이윤석)

**백엔드 개발은 여기서 합니다.** 서버 로직·API 핸들러가 전부 이 폴더에 있습니다.

```
backend/
  routes/       API 핸들러 본체 — spots·spotDetail·recommend·health·img·batchCollect·adminPurge
  lib/
    auth.ts       Cron/관리 엔드포인트 토큰 가드
    tourapi.ts    관광 OpenAPI(*2) 클라이언트 — serviceKey는 여기서만 사용
    collect.ts    전수 수집(페이지네이션)·빠른 수집(예열용)
    normalize.ts  정규화·중복제거·좌표 보정
    adapter.ts    원시→WhaleSpot 매핑 + 고래 테마 태깅 + 공사표기 sanitize
    coreSpots.ts  핵심 5대 고래 스팟 큐레이션(실 contentid)
    detail.ts     detail* 통합(운영시간·요금·갤러리)
    introFields.ts detailIntro2 필드 추출 공용(detail·data 공유) — 운영시간·휴무·요금·전화
    operating.ts  운영정보 파서(W7) — 자유텍스트 운영시간·휴무요일 → 구조화 + isClosedOn
    i18n.ts       다국어(ko·en) — 영문 스팟 큐레이션·지역화·로케일 유틸(?lang=en)
    recommend.ts  코스 추천 엔진(동행·기간·관심사·제철 가중 → 거리 순서화 → 시간 스케줄 + 휴무 제외)
    season.ts     시즌 — 가용성(고래바다여행선 4~11월)·제철(peak)·대체 스팟, 날짜 주입
    cache.ts      캐시(Upstash Redis 우선 + 인메모리 폴백)
    metrics.ts    호출 쿼터·배치 이력·헬스(Redis 공유)
    data.ts       BFF 서비스 레이어(캐시→수집→태깅)
    types.ts theme.ts sanitize.ts  도메인 모델·유틸
    mock/spots.ts mock 픽스처
```

## 알아둘 것
- `app/api/*/route.ts`는 **Next.js 라우팅 글루**로, 여기 핸들러를 얇게 연결(re-export)만 합니다. 실제 로직은 `backend/routes/`·`backend/lib/`를 고치세요.
- **비밀값(serviceKey·Upstash 토큰)은 서버 전용** — `.env.local`에만, 절대 커밋 금지.
- **시즌 규칙은 캐시에 굽지 않습니다.** `seasonal`·`peak`는 원격 데이터가 아니라 코드 설정이라, `attachSeasonRules()`로 **읽기 시점에** 다시 붙입니다(`data.getSpots`·`detail.getSpotDetail`). 규칙·문구를 고치면 캐시 만료를 기다리지 않고 즉시 반영됩니다.
- 시즌 분기는 `?date=YYYY-MM-DD`로 검증하세요 — 예: `/api/recommend?companion=family&duration=1n2d&date=2026-01-15`(비운항→대체), `…&date=2026-06-15`(성수기).
- **운영시간·휴무(W7)는 수집 단계에 미리 붙입니다.** `data.withOperatingInfo`가 스팟마다 `detailIntro2`를 1회 조회(동시성 3)해 `opening`(운영시간·휴무요일)을 캐시에 굽습니다. 추천은 이 값으로 **정기 휴무일 스팟을 코스에서 제외**합니다 — 요일별로 코스가 달라져요: `…&date=2026-07-20`(월, 장생포 클러스터 휴관 반영).
- **추천 결과는 `spots` 태그로 캐싱**됩니다(동일 입력 동일 결과). 큐레이션·수집이 갱신되면 `purgeTag("spots")`가 스팟·상세·코스 캐시를 함께 무효화합니다.
- **다국어는 `?lang=en`** — `/api/spots`·`/api/spots/:id`·`/api/recommend`에 붙이면 영문 스팟·코스 안내를 반환합니다(기본 국문, 비지원 값은 국문 폴백). getSpots 캐시는 **국문 정본 1벌**만 두고 응답 시점에 `localizeSpot`으로 지역화합니다.
- ⚠️ **영문 콘텐츠는 지금 큐레이션(`i18n.SPOT_I18N`)입니다.** 관광 OpenAPI 영문 서비스(EngService2)는 별도 활용신청·승인이 필요해 현재 키로는 403입니다. 승인 후 `SPOT_I18N`을 EngService2 응답으로 갈아끼우면 됩니다(구조 동일). 화면 언어 전환 UI는 프론트 재디자인 때 붙입니다.
- 절대규칙: GreenTourService 지역기반 API 미사용, 지역 수집은 `areaBasedList2`만.
- 서버 기동 예열은 루트 `instrumentation.ts`가 `backend/lib`를 호출.
