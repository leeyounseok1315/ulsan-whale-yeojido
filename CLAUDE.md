# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⛔ 절대 규칙 (위반 금지 — 최우선)

1. **서비스 화면 내 공사 명칭·로고 사용 금지.** 앱 UI·문구·로고·이미지·캡처·메타데이터 등 **사용자에게 노출되는 모든 곳에 "한국관광공사", "KTO" 등 공사를 지칭하는 단어/로고를 절대 넣지 않는다.** 출처 표기가 필요하면 "공공데이터" 같은 중립 표현 사용. (내부 문서·코드 주석에서 데이터 출처를 설명하는 것은 예외.)
2. **비밀값 노출 금지.** TourAPI `serviceKey` 등 비밀값은 **서버에서만** 사용 — 클라이언트 번들/네트워크 응답에 노출 금지, 하드코딩·커밋 금지. `.env.local`에 두고 `.gitignore` 등록, `.env.example`만 커밋.
3. **행정구역 기반 분류 금지.** 콘텐츠 조직·추천·내비게이션은 **'고래 테마' 기반으로만** 한다. 구/군(중구·남구·동구·북구·울주군) 기반 분류로 회귀하지 않는다 — 핵심 차별점.
4. **단순 리스트형 UX 금지.** '여지도(輿地圖)' 고지도 스타일 인터랙티브 지도가 본질적 UX. 리스트-우선 설계로 빠지지 않는다.
5. **생태관광정보 서비스의 지역기반(지역코드) API 사용 금지.** 생태관광정보 서비스(GreenTourService)의 지역기반관광정보(지역코드 기반 `areaBasedList`) 엔드포인트는 사용하지 않는다. 지역기반 수집은 **국문관광정보 서비스(KorService2)의 `areaBasedList2`만** 사용한다.

## 아키텍처 (기술 스택 · 폴더 구조)

**기술 스택 (확정: React / JavaScript 계열).** 아래 메타프레임워크·라이브러리는 권장값 — 팀이 조정 가능하나 미확정이면 이대로 진행.

- 프론트엔드: **React**. 메타프레임워크는 **Next.js(App Router) 권장** — 서버 라우트로 OpenAPI 프록시·캐싱을 한곳에 모으고, SSR로 관광 SEO 확보, 향후(2027) React Native 전환에 유리. 단순 SPA면 Vite + React.
- 언어: **TypeScript 권장** — TourAPI 응답이 중첩·불규칙 JSON이라 타입으로 파싱 버그 예방. 순수 JS면 최소한 JSDoc 타입이라도 둘 것.
- 캐싱/배치: **Redis**(예: Upstash) 캐싱 레이어 + 일 1회 야간 배치(예: Vercel Cron).
- 지도: 고지도 비주얼(차별점) 우선이면 **Leaflet / MapLibre + 커스텀 스타일**, 한국 POI·개발 속도 우선이면 **카카오맵 SDK**. 좌표는 TourAPI `mapx/mapy` 사용.
- 스타일 **Tailwind CSS** · i18n(영문, 후순위) **next-intl** · 배포 **Vercel** 권장.

**폴더 구조.** 단일 Next.js 앱이되, **프론트/백엔드를 담당자별로 분리**했다. 실제 코드는 전부 `frontend/`·`backend/`에 있고, `app/`은 Next.js가 요구하는 **얇은 라우팅 글루(re-export)**만 둔다.

```
frontend/         # 프론트(이숙빈) — 화면·UI 전부
  screens/        # 화면 본체 (Landing·Map·Recommend·NotFound)
  components/      # ui/(디자인 시스템) · map/(여지도 지도)
  providers.tsx · globals.css(Tailwind v4 + 디자인 토큰)
backend/          # 백엔드/BFF(이윤석) — 서버 로직 전부
  routes/         # API 핸들러 본체 (spots·spotDetail·recommend·health·img·batchCollect)
  lib/            # TourAPI 클라이언트(serviceKey 전용)·수집·정규화·태깅·detail·추천·캐시(Redis)·메트릭·타입
    mock/         # mock 픽스처
app/              # Next.js 필수 글루만 — layout + page.tsx/route.ts는 위 폴더로 re-export
  api/…/route.ts  #   → backend/routes/*
  */page.tsx      #   → frontend/screens/*
instrumentation.ts # 서버 기동 예열(backend/lib 호출) · vercel.json(야간 Cron)
```

전 TourAPI 호출은 서버 BFF(`app/api/` → `backend/routes/`) 경유. 캐시 우선 조회 → 미스 시 원격 호출. 프론트는 `fetch("/api/…")`로만 데이터 접근(직접 TourAPI 호출 금지). 각 폴더 `README.md`에 담당·구성 정리.

## 빌드 · 테스트 (개발 서버 · 테스트 · 배포)

아직 코드 없음. Node.js + npm 기반 React 프로젝트로 시작하며, 스캐폴딩 후 아래를 실제 값으로 확정한다.

- 개발 서버: `npm run dev`
- 빌드: `npm run build` · 린트: `npm run lint` · 테스트: `npm test`
- 배포: **Vercel**(git 연동 시 자동 배포) 권장.
- 비밀값(`serviceKey` 등)은 `.env.local`에, `.env.example`만 커밋.
- `package.json` 생성 후 명령을 이 섹션에 확정 — `/init` 재실행으로 자동 보완 가능.

## 도메인 컨텍스트 (비즈니스 용어 · 데이터 흐름)

**프로젝트.** 울산고래여지도 — 「2026 관광데이터 활용 공모전」 웹·앱 개발 부문 출품작. **팀: 울산큰고래 — 2인(본인 + 누나), '바이브 코딩' 방식으로 진행하며 애자일/스크럼 프로세스는 쓰지 않는다(무거운 프로세스 산출물보다 경량 문서·빠른 코드 생성 선호).** 김정호 *대동여지도*에서 영감받아 울산을 '고래의 시선'으로 그린 테마 관광 큐레이션 서비스. 권위 출처: `울산고래여지도_제안서.pdf`(요구사항), `PLAN.md`·`mvp.md`·`ERD.md`·`요구사항명세서.md`(계획·범위·데이터 모델·요구사항).

**울산 고래 자원(용어).**
- **장생포 고래문화특구** — 전국 유일. 고래박물관·고래생태체험관·고래문화마을. 남구 장생포가 서비스 중심.
- **반구대 암각화** — 선사시대 고래 사냥 암각화, 국보 제285호, 유네스코 세계유산 등재 추진. 울주군.
- **고래바다여행선** — 국내 유일 고래 관찰 크루즈. **운항 4~10월(시즌성!)** — 시즌 정보가 추천에 직접 반영돼야 함.
- **태화강**(국가정원·야경), **영남알프스**(억새 시즌).
- 추천 입력 도메인: 동행 유형(가족·연인·친구·혼자) × 체류 기간(당일·1박2일·2박3일).

**데이터 소스 — TourAPI** (공공 관광 OpenAPI, *`2` 시리즈; 내부 표기용). 모든 호출 기준 **areaCode=7(울산)**.

| 엔드포인트 | 용도 |
| --- | --- |
| `areaBasedList2` | areaCode=7 기준 전수 수집(수집 메인) |
| `searchKeyword2` | '고래/장생포/반구대' 키워드 매칭 → 테마 태깅 |
| `locationBasedList2` | 현 위치 기반 주변 정보 실시간 보강 |
| `detailCommon2` / `detailIntro2` / `detailImage2` | 상세·운영시간·휴무일·요금·이미지 |
| `EngService2` | 영문 — 다국어 확장(2단계) |

contentTypeId: 관광지 `12` · 문화시설 `14` · 축제 `15` · 여행코스 `25` · 음식점 `39` · 숙박 `32`. 응답 주요 필드: `contentid`, `contenttypeid`, `title`, `addr1`, `mapx`, `mapy`, `firstimage`, `overview`.

**데이터 흐름.** ① 수집(`areaBasedList2`, areaCode=7 전수·캐싱) → ② 테마 분류(`searchKeyword2`로 '고래/장생포/반구대' 태깅) → ③ 추천(동행·기간·관심사 + 위치 + 시즌 데이터 조합 동적 코스 생성) → ④ 실시간 보강(`locationBasedList2`) → ⑤ 캐싱(Redis, 일 1회 야간 배치 갱신).

**로드맵(범위 판단 기준).** 단기(~2027) 모바일앱·다국어 / 중기(~2028) '동해 고래 루트'(부산 기장·제주) 확장·후기 커뮤니티 / 장기(~2030) AR/VR.

## 코딩 컨벤션 (네이밍 · 커밋 · 패턴)

팀 컨벤션 미확정 — 아래는 권장 기본값(확정 시 갱신).

- **네이밍:** 컴포넌트 `PascalCase`, 변수·함수 `camelCase`. TourAPI 원시 필드(`contentid`, `mapx` 등)는 소문자 그대로 받되 **내부 모델 타입으로 매핑**해 사용(원시 필드명을 앱 전역에 퍼뜨리지 않기).
- **타입:** TourAPI 응답 타입을 `lib/`에 정의하고 파싱 경계에서 검증.
- **패턴:** TourAPI 호출·`serviceKey`는 **서버 BFF(`app/api/`)에 집중** — 컴포넌트에서 직접 호출 금지. 캐시 우선.
- **커밋:** Conventional Commits 권장(`feat:`·`fix:`·`chore:` …), 본문 한국어 OK.
