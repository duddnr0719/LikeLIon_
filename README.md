# TrackLook 🗺️

성동구 카공족(노트북 작업자/학생)을 위한 카페 추천 서비스.
네이버 리뷰를 AI로 분석해 콘센트·와이파이·소음·눈치·테이블 5대 지표를 점수화합니다.

---

## 프로젝트 구조

```
LikeLIon_/
├── backend/   Django REST API (포트 8000)
└── frontend/  React + Vite (포트 3000)
```

---

## 백엔드 셋업

```bash
cd backend

# 가상환경 생성 및 패키지 설치
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에서 SECRET_KEY 입력 (나머지는 데이터 업데이트 시에만 필요)

# DB 초기화 및 데이터 로드
python manage.py migrate
python manage.py loaddata seongdong_cafes   # 성동구 카페 258개 데이터 즉시 로드
python manage.py load_raw_reviews           # 블로그 리뷰 3,456건 로드 (data/reviews_raw.csv)

# 서버 실행
python manage.py runserver
# → http://localhost:8000
```

---

## 프론트엔드 셋업

```bash
cd frontend

# 패키지 설치
npm install

# 환경변수 설정 (.gitignore에 포함되어 있어 직접 생성 필요)
cp .env.example .env.local
# .env.local 에 아래 두 값 입력:
#   VITE_API_BASE_URL=http://localhost:8000
#   VITE_KAKAO_JS_KEY=발급받은_카카오_JavaScript_키

# 개발 서버 실행
npm run dev
# → http://localhost:3000
```

> **카카오 JavaScript 키 발급:** [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 앱 키 → JavaScript 키
> 발급 후 콘솔에서 허용 도메인에 `http://localhost:3000` 등록 필요

---

## API 목록

상세 명세: [`docs/03_API명세서.md`](docs/03_API명세서.md)

| Method | URL | 설명 | 인증 |
|---|---|---|---|
| `POST` | `/api/auth/register/` | 회원가입 | 불필요 |
| `POST` | `/api/auth/login/` | 로그인 (JWT 토큰 발급) | 불필요 |
| `POST` | `/api/auth/logout/` | 로그아웃 (토큰 블랙리스트) | 불필요 |
| `POST` | `/api/auth/token/refresh/` | access token 재발급 | 불필요 |
| `GET` | `/api/spaces/` | 카페 목록 조회 (필터·정렬) | 불필요 |
| `GET` | `/api/spaces/<id>/` | 카페 단일 상세 조회 | 불필요 |
| `GET` | `/api/spaces/<id>/reviews/` | 리뷰 목록 조회 | 불필요 |
| `POST` | `/api/spaces/<id>/reviews/` | 리뷰 작성 | **필요** |
| `DELETE` | `/api/spaces/<id>/reviews/<review_id>/` | 리뷰 삭제 (본인만) | **필요** |
| `GET` | `/api/spaces/<id>/raw-reviews/` | 블로그 리뷰 목록 조회 | 불필요 |

---

## 인증 방식 (JWT)

로그인 후 발급받은 **access token**을 인증이 필요한 요청 헤더에 포함합니다.

```
Authorization: Bearer <access_token>
```

- access token 유효기간: **30분**
- refresh token 유효기간: **7일**
- 토큰 재발급 시 refresh token도 함께 교체됨 (`ROTATE_REFRESH_TOKENS`)

### 로그인 예시

```js
// 로그인
const res = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'myuser', password: 'Test1234!' })
})
const { access, refresh } = await res.json()
localStorage.setItem('access', access)
localStorage.setItem('refresh', refresh)

// 인증이 필요한 요청
await fetch('http://localhost:8000/api/spaces/1/reviews/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access')}`
  },
  body: JSON.stringify({ score_plug: 4, score_wifi: 4, score_noise: 4, score_comfort: 4 })
})
```

---

## 카페 목록 조회

### 필터 파라미터

| 파라미터 | 설명 | 예시 |
|---|---|---|
| `ordering` | 정렬 기준 (`-` 붙이면 내림차순) | `?ordering=-score_comfort` |
| `min_score_plug` | 콘센트 최소 점수 | `?min_score_plug=4` |
| `min_score_wifi` | 와이파이 최소 점수 | `?min_score_wifi=4` |
| `min_score_noise` | 소음 최소 점수 | `?min_score_noise=4` |
| `min_score_comfort` | 눈치 최소 점수 | `?min_score_comfort=4` |
| `min_score_table` | 테이블 최소 점수 (0 또는 5) | `?min_score_table=5` |

```bash
# 눈치 안 보이는 카페 순
GET /api/spaces/?ordering=-score_comfort

# 콘센트 + 와이파이 모두 4점 이상
GET /api/spaces/?min_score_plug=4&min_score_wifi=4
```

---

## 리뷰 API

### 리뷰 작성 (로그인 필요)
```
POST /api/spaces/{id}/reviews/
Authorization: Bearer <access_token>
```

```json
{
  "score_plug": 4.5,
  "score_wifi": 3.0,
  "score_noise": 4.0,
  "score_comfort": 5.0,
  "comment": "콘센트 자리마다 있고 조용해서 좋아요"
}
```

- 점수는 **1~5, 0.5 단위**만 허용
- `comment`는 선택 입력
- 같은 카페에 **1인 1리뷰** 제한 (중복 시 403)

### 리뷰 목록 조회 (인증 불필요)
```
GET /api/spaces/{id}/reviews/
```

```json
[
  {
    "id": 1,
    "workspace": 1,
    "username": "myuser",
    "score_plug": 4.5,
    "score_wifi": 3.0,
    "score_noise": 4.0,
    "score_comfort": 5.0,
    "comment": "콘센트 자리마다 있고 조용해서 좋아요",
    "created_at": "2026-06-25T10:00:00Z"
  }
]
```

### 리뷰 삭제 (본인 리뷰만)
```
DELETE /api/spaces/{id}/reviews/{review_id}/
Authorization: Bearer <access_token>
```

- 본인 리뷰가 아닌 경우 403 반환

---

## 5대 지표 설명

| 지표 | 의미 | 점수 기준 |
|---|---|---|
| `score_plug` | 콘센트 개수·접근성 | 5=자리마다 / 3=벽면만 / 1=없음 |
| `score_wifi` | 와이파이 속도·안정성 | 5=기가급 / 3=무난 / 1=먹통 |
| `score_noise` | 소음 수준 | 5=독서실 / 3=백색소음 / 1=클럽 |
| `score_comfort` | 눈치·체류 편의 | 5=눈치 제로 / 3=적당 / 1=가시방석 |
| `score_table` | 테이블 크기·높이 | 5=작업하기 좋음 / 0=좁거나 언급 없음 |

> 채점 기준 상세: `backend/prompt_rule.md` 참고

---

## 데이터 업데이트 (선택사항)

새로 크롤링·점수화가 필요할 때 `.env`에 API 키 입력 후 아래 순서로 실행:

```bash
python manage.py fetch_cafes        # 카카오맵 API로 카페 목록 수집
python manage.py crawl_reviews      # 네이버 블로그 리뷰 크롤링
python manage.py score_workspaces   # L40 GPU 서버(Qwen3.5:122b)로 점수화
python manage.py enrich_cafes       # 카카오 API로 전화번호·URL 등 추가 정보 수집
```

- `--limit N` 옵션으로 일부만 처리, `--force`로 재처리

---

## 기술 스택

- **Backend**: Django 6.0 / Django REST Framework / SQLite
- **인증**: djangorestframework-simplejwt (JWT)
- **Frontend**: React 19 / Vite 8 / 카카오맵 SDK
- **크롤링**: 카카오 로컬 API, 네이버 블로그 검색 API
- **AI 분석**: Qwen3.5:122b-1m (Ollama, NVIDIA L40 GPU)
- **데이터**: 성동구 카페 258개 / 리뷰 3,693건
