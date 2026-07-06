import type { RawTourItem } from "../types";

// W1~W2 mock 픽스처 — 관광 OpenAPI(areaBasedList2, areaCode=7) 응답 스키마와 동일한 형태.
// serviceKey 발급 전까지 이 계약으로 프론트/추천을 병행 개발한다. (PLAN.md mock 계약)
// 좌표(mapx/mapy)는 실제 위치 근사값. 일부 overview에 공사 표기를 일부러 넣어 sanitize 동작을 검증한다.

export const MOCK_RAW_ITEMS: RawTourItem[] = [
  {
    contentid: "C-MUSEUM",
    contenttypeid: "14",
    title: "장생포 고래박물관",
    addr1: "울산 남구 장생포로",
    mapx: "129.3585",
    mapy: "35.4880",
    firstimage: "",
    tel: "052-256-6301",
    overview:
      "전국 유일의 고래 전문 박물관. 포경의 역사와 고래 생태 자료를 전시하며 고래와 인간의 공존을 이야기한다. 자료 제공: 한국관광공사.",
    usetime: "09:00~18:00 (입장 마감 17:30)",
    restdate: "매주 월요일, 1월 1일, 설·추석 당일",
    usefee: "어른 2,000원 / 청소년·군인 1,000원",
  },
  {
    contentid: "C-ECO",
    contenttypeid: "14",
    title: "고래생태체험관",
    addr1: "울산 남구 장생포로",
    mapx: "129.3625",
    mapy: "35.4905",
    firstimage: "",
    tel: "052-226-0900",
    overview:
      "살아있는 고래와 해양 생태를 가까이서 만나는 체험형 전시관. 가족 단위 관람객에게 인기.",
    usetime: "09:30~17:30",
    restdate: "매주 월요일",
    usefee: "어른 5,000원 / 어린이 3,000원",
  },
  {
    contentid: "C-VILLAGE",
    contenttypeid: "12",
    title: "장생포 고래문화마을",
    addr1: "울산 남구 장생포로",
    mapx: "129.3560",
    mapy: "35.4850",
    firstimage: "",
    tel: "052-226-0980",
    overview:
      "1960~70년대 포경 전성기의 장생포 마을을 재현한 야외 테마 공간. 옛 거리와 고래 이야기를 거닐며 본다.",
    usetime: "09:00~18:00",
    restdate: "연중무휴",
    usefee: "어른 2,000원",
  },
  {
    contentid: "C-CRUISE",
    contenttypeid: "12",
    title: "고래바다여행선",
    addr1: "울산 남구 장생포로 (장생포항)",
    mapx: "129.3650",
    mapy: "35.4862",
    firstimage: "",
    tel: "052-256-5765",
    overview:
      "국내 유일의 고래 관찰 크루즈. 장생포항에서 출항해 바다 위에서 고래의 시선으로 동해를 본다. 4~10월 운항.",
    usetime: "운항 시즌 4~10월 / 1일 1~2회 (해상 상황에 따라 변동)",
    restdate: "11~3월 비운항",
    usefee: "어른 30,000원 / 소인 25,000원",
  },
  {
    contentid: "C-PETROGLYPH",
    contenttypeid: "12",
    title: "반구대 암각화",
    addr1: "울산 울주군 언양읍 대곡리",
    mapx: "129.1760",
    mapy: "35.6100",
    firstimage: "",
    tel: "052-204-1340",
    overview:
      "선사시대 고래잡이를 새긴 바위그림. 국보 제285호이며 유네스코 세계유산 등재를 추진 중인 인류의 기록.",
    usetime: "09:00~18:00 (암각화박물관)",
    restdate: "매주 월요일",
    usefee: "무료",
  },
  {
    contentid: "S-TAEHWA",
    contenttypeid: "12",
    title: "태화강 국가정원",
    addr1: "울산 중구 태화강",
    mapx: "129.2980",
    mapy: "35.5530",
    firstimage: "",
    tel: "052-229-7900",
    overview:
      "도심을 가로지르는 태화강의 대숲과 들꽃 정원. 야경과 산책로가 고래 도시의 쉼표가 되어 준다.",
    usetime: "상시 개방",
    restdate: "연중무휴",
    usefee: "무료",
  },
  {
    contentid: "S-YEONGNAM",
    contenttypeid: "12",
    title: "영남알프스 신불산 억새평원",
    addr1: "울산 울주군 상북면",
    mapx: "129.0560",
    mapy: "35.5360",
    firstimage: "",
    tel: "052-204-3270",
    overview:
      "해발 1,000m 능선을 뒤덮는 가을 억새의 바다. 영남알프스가 내륙에서 펼치는 또 하나의 파도.",
    usetime: "상시 (가을 억새 10~11월 절정)",
    restdate: "연중무휴",
    usefee: "무료",
  },
];
