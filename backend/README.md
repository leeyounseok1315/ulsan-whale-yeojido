# backend/ — 백엔드 / BFF (담당: 이윤석)

**백엔드 개발은 여기서 합니다.** 서버 로직·API 핸들러가 전부 이 폴더에 있습니다.

```
backend/
  routes/       API 핸들러 본체 — spots·spotDetail·recommend·health·img·batchCollect
  lib/
    tourapi.ts    관광 OpenAPI(*2) 클라이언트 — serviceKey는 여기서만 사용
    collect.ts    전수 수집(페이지네이션)·빠른 수집(예열용)
    normalize.ts  정규화·중복제거·좌표 보정
    adapter.ts    원시→WhaleSpot 매핑 + 고래 테마 태깅 + 공사표기 sanitize
    coreSpots.ts  핵심 5대 고래 스팟 큐레이션(실 contentid)
    detail.ts     detail* 통합(운영시간·요금·갤러리)
    recommend.ts  코스 추천 엔진 v0
    season.ts     시즌(고래바다여행선 4~10월, 날짜 주입)
    cache.ts      캐시(Upstash Redis 우선 + 인메모리 폴백)
    metrics.ts    호출 쿼터·배치 이력·헬스(Redis 공유)
    data.ts       BFF 서비스 레이어(캐시→수집→태깅)
    types.ts theme.ts sanitize.ts  도메인 모델·유틸
    mock/spots.ts mock 픽스처
```

## 알아둘 것
- `app/api/*/route.ts`는 **Next.js 라우팅 글루**로, 여기 핸들러를 얇게 연결(re-export)만 합니다. 실제 로직은 `backend/routes/`·`backend/lib/`를 고치세요.
- **비밀값(serviceKey·Upstash 토큰)은 서버 전용** — `.env.local`에만, 절대 커밋 금지.
- 절대규칙: GreenTourService 지역기반 API 미사용, 지역 수집은 `areaBasedList2`만.
- 서버 기동 예열은 루트 `instrumentation.ts`가 `backend/lib`를 호출.
