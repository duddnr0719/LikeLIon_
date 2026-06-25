# 🔌 API 명세서

---

## 0. 공통 규칙

| 항목 | 값 |
|---|---|
| **Base URL (로컬)** | `http://localhost:8000` |
| **Base URL (배포)** | 미정 |
| **Content-Type** | `application/json` |
| **인증** | 없음 |

### HTTP 상태 코드

| Code | 의미 | 사용 시점 |
|---|---|---|
| 200 | OK | 조회 성공 |
| 404 | Not Found | 해당 카페 없음 |
| 500 | Server Error | 백엔드 내부 오류 |

---

## 1. 엔드포인트 요약

| # | Method | URL | 설명 | 상태 |
|---|---|---|---|---|
| 1 | `GET` | `/api/spaces/` | 카페 목록 조회 (필터·정렬 포함) | ✅ |
| 2 | `GET` | `/api/spaces/<id>/` | 카페 단일 상세 조회 | ✅ |

> 상태: ⬜ 미구현 / 🟡 개발중 / ✅ 완료

---

## 2. 엔드포인트별 상세

### 1️⃣ `GET /api/spaces/` — 카페 목록 조회

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---|---|---|---|---|
| `ordering` | string | ❌ | 정렬 기준 (`-`는 내림차순) | `-score_comfort` |
| `min_score_plug` | float | ❌ | 콘센트 최소 점수 | `4` |
| `min_score_wifi` | float | ❌ | 와이파이 최소 점수 | `4` |
| `min_score_noise` | float | ❌ | 소음 최소 점수 (높을수록 조용) | `4` |
| `min_score_comfort` | float | ❌ | 눈치 최소 점수 (높을수록 편함) | `4` |
| `min_score_table` | float | ❌ | 테이블 최소 점수 (0 또는 5) | `5` |

**ordering 허용값**
```
score_plug, -score_plug
score_wifi, -score_wifi
score_noise, -score_noise
score_comfort, -score_comfort
score_table, -score_table
name, -name
```

**Response — 200 OK**
```json
[
  {
    "id": 1,
    "name": "아우프글렛 금호점",
    "address": "서울 성동구 독서당로51길 7",
    "latitude": "37.5488664",
    "longitude": "127.0262200",
    "score_plug": 3.0,
    "score_wifi": 3.0,
    "score_noise": 3.0,
    "score_comfort": 5.0,
    "score_table": 5.0,
    "total_review_count": 10,
    "last_scored_at": "2026-05-28T12:27:49Z"
  }
]
```

**호출 예시**
```bash
# 전체 목록 (눈치 점수 높은 순)
curl "http://localhost:8000/api/spaces/?ordering=-score_comfort"

# 콘센트 + 와이파이 모두 4점 이상
curl "http://localhost:8000/api/spaces/?min_score_plug=4&min_score_wifi=4"

# 조용하고 테이블 좋은 카페
curl "http://localhost:8000/api/spaces/?min_score_noise=4&min_score_table=5"

# 카공 최적 종합
curl "http://localhost:8000/api/spaces/?min_score_plug=4&min_score_wifi=4&ordering=-score_comfort"
```

---

### 2️⃣ `GET /api/spaces/<id>/` — 카페 단일 상세 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `id` | integer | 카페 고유 ID |

**Response — 200 OK**
```json
{
  "id": 1,
  "name": "아우프글렛 금호점",
  "address": "서울 성동구 독서당로51길 7",
  "latitude": "37.5488664",
  "longitude": "127.0262200",
  "score_plug": 3.0,
  "score_wifi": 3.0,
  "score_noise": 3.0,
  "score_comfort": 5.0,
  "score_table": 5.0,
  "total_review_count": 10,
  "last_scored_at": "2026-05-28T12:27:49Z"
}
```

**Response — 404 Not Found**
```json
{ "detail": "찾을 수 없습니다." }
```

**호출 예시**
```bash
curl "http://localhost:8000/api/spaces/1/"
```

---

## 3. 5대 지표 설명

| 필드 | 범위 | 의미 |
|---|---|---|
| `score_plug` | 1.0 ~ 5.0 | 콘센트 개수·접근성 (5=자리마다 / 3=벽면만 / 1=없음) |
| `score_wifi` | 1.0 ~ 5.0 | 와이파이 속도·안정성 (5=기가급 / 3=무난 / 1=먹통) |
| `score_noise` | 1.0 ~ 5.0 | 소음 수준 (5=독서실 / 3=백색소음 / 1=클럽) |
| `score_comfort` | 1.0 ~ 5.0 | 눈치·체류 편의 (5=눈치제로 / 3=적당 / 1=가시방석) |
| `score_table` | 0.0 또는 5.0 | 테이블 크기·높이 (5=작업하기 좋음 / 0=좁거나 언급없음) |

> 채점 기준 상세: `backend/prompt_rule.md` 참고

---

## 4. 외부 API

| API | 용도 | 인증 | 호출 주체 |
|---|---|---|---|
| 카카오 로컬 API | 성동구 카페 목록 수집 | REST API Key | 백엔드 (관리 커맨드) |
| 카카오맵 JavaScript SDK | 프론트 지도 렌더링 | JavaScript Key | 프론트엔드 |
| 네이버 블로그 검색 API | 카페별 리뷰 크롤링 | Client ID/Secret | 백엔드 (관리 커맨드) |

> **주의:** JavaScript Key는 브라우저에 노출되므로 카카오 콘솔에서 **허용 도메인 등록** 필수
> - 개발: `http://localhost:5173` (Vite 기본 포트)
> - 배포: 실제 도메인 추가

---

## 5. CORS 설정

```python
# backend/config/settings.py (이미 적용됨)
INSTALLED_APPS = [..., 'corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]

# 개발용
CORS_ALLOW_ALL_ORIGINS = True

# 배포 시 (개발용 제거 후 화이트리스트로 교체)
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
]
```

---
