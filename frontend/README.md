# frontend/ — 프론트엔드 (담당: 이숙빈)

**프론트 개발은 여기서 합니다.** 화면·UI 코드가 전부 이 폴더에 있습니다.

```
frontend/
  screens/      화면 본체 — Landing / Map / Recommend / NotFound
  components/
    ui/         디자인 시스템 (Button·Card·Panel·Badge·ToggleButton·SeasonBadge·SourceLabel·PetroglyphWhale)
    map/        여지도 지도 (UlsanBaseMap·YeojidoMap·WhaleMarker·MapLegend·SpotDetailPanel)
  providers.tsx TanStack Query 프로바이더
  globals.css   Tailwind v4 + 여지도 디자인 토큰(한지·먹·인주·쪽빛)
```

## 알아둘 것
- `app/`의 `page.tsx`/`layout.tsx`는 **Next.js 라우팅 글루**로, 여기 화면을 얇게 연결(re-export)만 합니다. 실제 화면은 `frontend/screens/`를 고치세요.
- 데이터는 **직접 TourAPI를 부르지 말고** `fetch("/api/...")`로 백엔드(BFF)를 통해서만 가져옵니다. (serviceKey는 서버 전용)
- 타입·테마·시즌 유틸은 `@/backend/lib/{types,theme,season}`을 import (도메인 모델 공유).
- 절대규칙: 화면 어디에도 공사 명칭/로고 금지(출처는 '공공데이터'), 고래 테마 기반, 지도 우선.
