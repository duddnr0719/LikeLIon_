# TrackLook 프론트엔드 🗺️

성동구 카공족을 위한 카페 추천 서비스의 프론트엔드입니다.
카카오맵 위에 카공 5대 지표(콘센트·와이파이·소음·눈치·테이블)를 기반으로 사용자 맞춤 카페를 추천합니다.

---

## 셋업 방법

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

> 백엔드 서버(`http://localhost:8000`)가 함께 실행되어 있어야 카페 데이터가 로드됩니다.

### 백엔드 서버 실행

```bash
cd backend
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
python manage.py runserver
```

---

## 환경변수 설정

`frontend/` 폴더에 `.env` 파일을 새로 만들고 아래 내용을 입력하세요.
(`.env`는 `.gitignore`에 등록되어 있어 깃허브에 올라가지 않습니다)

```
VITE_KAKAO_JS_KEY=여기에_JavaScript_키_입력
```

> 카카오 개발자 콘솔 → 앱 키 → **JavaScript 키** 사용
> 플랫폼 등록: 앱 설정 → 플랫폼 → Web → `http://localhost:3000` 추가 필요

---

## 파일 구조

```
frontend/
├── index.html                       # 카카오맵 SDK 로드 (환경변수로 키 주입)
├── vite.config.js                   # Vite 설정 (포트 3000)
└── src/
    ├── App.jsx                      # 메인 레이아웃 + API 연결 + 바텀시트
    ├── App.css                      # 전체 레이아웃 및 컴포넌트 스타일
    ├── index.css                    # 디자인 토큰 (색상, 폰트, 변수)
    ├── main.jsx                     # 진입점
    ├── constants/
    │   └── scoreConfig.js           # 5대 지표 설정 + 우선순위 가중치 계산
    ├── utils/
    │   └── auth.js                  # JWT 토큰 저장/갱신/삭제 + authFetch 유틸
    └── components/
        ├── CategoryPrioritySelector.jsx  # 카공 우선순위 선택 UI
        ├── CafeList.jsx                  # 카페 카드 세로 스크롤 목록
        ├── WorkspaceMarker.jsx           # 카카오맵 커스텀 마커
        ├── CafeDetailSheet.jsx           # 카페 상세 시트 (점수 + 리뷰)
        └── AuthModal.jsx                 # 로그인 / 회원가입 모달
```

---

## 주요 기능

### 1. 카카오맵 연동
- 지도가 화면 전체 배경을 차지하는 플로팅 레이아웃
- 카페별 커스텀 마커 (이모지 + 카페명)
- 마커 클릭 시 해당 카페로 지도 이동
- 지도 드래그/줌 정상 작동

### 2. 카공 우선순위 선택
- 5대 지표를 중요한 순서대로 탭해서 1~5순위 설정
- 순위별 그린 농도로 시각적 구분 (1순위 진함 → 5순위 연함)
- 5개 선택 완료 시 카페 랭킹 자동 재정렬

### 3. 우선순위 기반 카페 랭킹 + 상위 30개 마커 표시
| 순위 | 가중치 |
|------|--------|
| 1순위 | 35% |
| 2순위 | 25% |
| 3순위 | 20% |
| 4순위 | 12% |
| 5순위 | 8%  |

- 우선순위 설정 시 가중치 점수 내림차순 정렬 후 상위 30개만 마커 표시
- 미설정 시 API 응답 순서 그대로 상위 30개 표시

### 4. 내 위치 기반 카페 검색
- 위치 권한 동의 커스텀 팝업 (허용 시에만 geolocation 요청)
- 위치 정보 로컬스토리지 캐시 저장 (10분 TTL, 서버 전송 없음)
- 위치 ON 시 거리 가까운 순으로 카페 정렬
- 카페 카드에 거리 뱃지 표시 (Haversine 공식)
- 개발 중 위치 고정: 성동구 중심 (배포 시 실제 위치로 교체 예정)

### 5. 드래그 바텀시트
- 하단 패널을 드래그해서 3단계로 높이 조절
  - 최소: 핸들만 보임 (지도 최대)
  - 절반: 기본 상태
  - 최대: 화면 85% (목록 최대)
- 카페 카드 세로 스크롤

### 6. 카페 상세 시트
- 카페 카드 또는 마커 클릭 시 하단 슬라이드업 팝업
- 총점(좌) + 항목별 점수 바(우) 레이아웃
- 5대 지표 점수 시각화 (score_table은 고정 태그로 표시)
- 방문 리뷰 목록 표시

### 7. 리뷰 작성 / 삭제
- 로그인 유저만 리뷰 작성 가능 (비로그인 시 로그인 유도 UI)
- 항목별 별점 0.5 단위 선택
- 1인 1리뷰 제한 (이미 작성 시 폼 숨김)
- 본인 리뷰에만 삭제 버튼 표시
- 작성/삭제 후 목록 즉시 반영

### 8. 로그인 / 회원가입
- 아이디 + 비밀번호 기반 JWT 인증
- 탭 전환형 모달 (로그인 / 회원가입)
- access 토큰 만료 시 refresh 토큰으로 자동 갱신
- 헤더에 로그인 상태 표시 (유저명 뱃지 + 로그아웃 버튼)

### 9. 반응형 (PC + 모바일)
- **PC**: 좌측 우선순위 패널 플로팅 + 하단 드래그 바텀시트
- **모바일**: 우선순위 버튼 탭 → 슬라이드업 패널

---

## 백엔드 API 연동

`App.jsx`의 `API_BASE` 값을 백엔드 서버 주소에 맞게 수정하세요.

```js
const API_BASE = 'http://localhost:8000'
```

현재 사용 중인 엔드포인트:

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/spaces/` | 불필요 | 카페 전체 목록 조회 |
| GET | `/api/spaces/{id}/reviews/` | 불필요 | 카페 리뷰 목록 |
| POST | `/api/spaces/{id}/reviews/` | 필요 | 리뷰 작성 |
| DELETE | `/api/spaces/{id}/reviews/{review_id}/` | 필요 | 본인 리뷰 삭제 |
| POST | `/api/auth/register/` | 불필요 | 회원가입 |
| POST | `/api/auth/login/` | 불필요 | 로그인 (JWT 발급) |
| POST | `/api/auth/logout/` | 불필요 | 로그아웃 (토큰 블랙리스트) |
| POST | `/api/auth/token/refresh/` | 불필요 | access 토큰 갱신 |

---

## 기술 스택

- **React 19** + **Vite**
- **카카오맵 SDK** (지도 + 커스텀 마커)
- **JWT** (djangorestframework-simplejwt 기반 인증)
- **Pretendard** + **DM Sans** (폰트)
- CSS Variables 기반 디자인 시스템

---

## TODO (배포 전 처리 필요)

| 항목 | 위치 | 내용 |
|------|------|------|
| 위치 고정 해제 | `App.jsx` `handleLocationAllow` | 성동구 하드코딩 → `pos.coords` 실제 위치로 교체 |
| API_BASE 교체 | `App.jsx`, `CafeDetailSheet.jsx`, `utils/auth.js` | `localhost:8000` → 실제 배포 서버 주소 |