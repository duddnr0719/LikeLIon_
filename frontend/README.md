# TrackLook 프론트엔드 🗺️

성동구 카공족을 위한 카페 추천 서비스의 프론트엔드입니다.
카카오맵 위에 카공 5대 지표(콘센트·와이파이·소음·눈치·테이블)를 기반으로 사용자 맞춤 카페를 추천합니다.

---

## 셋업 방법

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

> 백엔드 서버(`http://localhost:8000`)가 함께 실행되어 있어야 카페 데이터가 로드됩니다.

---

## 카카오맵 API 키 설정

`public/index.html`의 `YOUR_APP_KEY`를 카카오 개발자 콘솔의 **JavaScript 키**로 교체해야 지도가 활성화됩니다.

```html
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&libraries=services"></script>
```

키 발급: https://developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키
플랫폼 등록: 앱 설정 → 플랫폼 → Web → `http://localhost:5173` 추가

---

## 파일 구조

```
src/
├── App.jsx                          # 메인 레이아웃 + API 연결 + 카카오맵 초기화
├── App.css                          # 전체 레이아웃 및 컴포넌트 스타일
├── index.css                        # 디자인 토큰 (색상, 폰트, 변수)
├── main.jsx                         # 진입점
├── constants/
│   └── scoreConfig.js               # 5대 지표 설정 + 우선순위 가중치 계산
└── components/
    ├── CategoryPrioritySelector.jsx  # 카공 우선순위 선택 UI
    ├── CafeList.jsx                  # 카페 카드 가로 스크롤 목록
    └── WorkspaceMarker.jsx           # 카카오맵 커스텀 마커
```

---

## 주요 기능

### 1. 카카오맵 연동
- 지도가 화면 전체 배경을 차지하는 플로팅 레이아웃
- 카페별 커스텀 마커 (이모지 + 카페명)
- 카드/마커 클릭 시 해당 위치로 지도 이동

### 2. 카공 우선순위 선택
- 5대 지표를 중요한 순서대로 탭해서 1~5순위 설정
- 순위별 그린 농도로 시각적 구분 (1순위 진함 → 5순위 연함)
- 5개 선택 완료 시 카페 랭킹 자동 재정렬

### 3. 우선순위 기반 카페 랭킹
| 순위 | 가중치 |
|------|--------|
| 1순위 | 35% |
| 2순위 | 25% |
| 3순위 | 20% |
| 4순위 | 12% |
| 5순위 | 8%  |

### 4. 반응형 (PC + 모바일)
- **PC**: 좌측 우선순위 패널 플로팅 + 하단 가로 스크롤 카페 카드
- **모바일**: 우선순위 버튼 탭 → 슬라이드업 패널, 카드는 하단 가로 스크롤

---

## 백엔드 API 연동

`App.jsx`의 `API_BASE` 값을 백엔드 서버 주소에 맞게 수정하세요.

```js
const API_BASE = 'http://localhost:8000'  // 기본값
```

현재 사용 중인 엔드포인트:

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/spaces/` | 카페 전체 목록 조회 |
| GET | `/api/spaces/{id}/reviews/` | 카페 리뷰 목록 |
| POST | `/api/spaces/{id}/reviews/` | 리뷰 작성 |

---

## 기술 스택

- **React 19** + **Vite**
- **카카오맵 SDK** (지도 + 커스텀 마커)
- **Pretendard** + **DM Sans** (폰트)
- CSS Variables 기반 디자인 시스템

---

## 미구현 (예정)

- [ ] 로그인 / 회원가입
- [ ] 카페 상세 페이지 / 모달
- [ ] 리뷰 작성 UI