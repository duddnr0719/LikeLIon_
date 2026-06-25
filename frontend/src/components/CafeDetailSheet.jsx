import { useState, useEffect } from 'react'
import { SCORE_CATEGORIES } from '../constants/scoreConfig'

const API_BASE = 'http://localhost:8000'

// 별점 0.5 단위 표시 컴포넌트
function StarRating({ score, max = 5 }) {
  const stars = []
  for (let i = 1; i <= max; i++) {
    if (score >= i) {
      stars.push(<span key={i} className="star full">★</span>)
    } else if (score >= i - 0.5) {
      stars.push(<span key={i} className="star half">★</span>)
    } else {
      stars.push(<span key={i} className="star empty">★</span>)
    }
  }
  return <span className="star-row">{stars}</span>
}

// 날짜 포맷 YYYY.MM.DD
function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 지표별 점수 행
function ScoreRow({ emoji, label, score }) {
  const pct = score != null ? (score / 5) * 100 : 0
  return (
    <div className="detail-score-row">
      <span className="detail-score-label">
        <span className="detail-score-emoji">{emoji}</span>
        {label}
      </span>
      <div className="detail-score-bar-wrap">
        <div className="detail-score-bar">
          <div className="detail-score-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="detail-score-value">
          {score != null ? score.toFixed(1) : '-'}
        </span>
      </div>
    </div>
  )
}

// 리뷰 카드
function ReviewCard({ review }) {
  // SpaceReview에는 score_table 없음 → 4개 지표만 표시
  const reviewCategories = SCORE_CATEGORIES.filter((c) => c.key !== 'score_table')
  const avg =
    reviewCategories.reduce((sum, c) => sum + (review[c.key] ?? 0), 0) /
    reviewCategories.length

  return (
    <div className="review-card">
      <div className="review-card-top">
        <StarRating score={avg} />
        <span className="review-date">{formatDate(review.created_at)}</span>
      </div>
      <div className="review-scores">
        {reviewCategories.map((cat) => (
          <span key={cat.key} className="review-score-chip">
            {cat.emoji} {review[cat.key]?.toFixed(1) ?? '-'}
          </span>
        ))}
      </div>
      {review.comment && (
        <p className="review-comment">{review.comment}</p>
      )}
    </div>
  )
}

function CafeDetailSheet({ cafe, onClose }) {
  const [reviews, setReviews] = useState([])
  const [reviewLoading, setReviewLoading] = useState(true)
  const [reviewError, setReviewError] = useState(null)

  // 리뷰 fetch
  useEffect(() => {
    if (!cafe) return
    setReviewLoading(true)
    setReviewError(null)
    fetch(`${API_BASE}/api/spaces/${cafe.id}/reviews/`)
      .then((r) => { if (!r.ok) throw new Error(`서버 오류 ${r.status}`); return r.json() })
      .then(setReviews)
      .catch((e) => setReviewError(e.message))
      .finally(() => setReviewLoading(false))
  }, [cafe])

  if (!cafe) return null

  // score_table: 0.0 or 5.0 → 고정 뱃지
  const hasTable = parseFloat(cafe.score_table) === 5

  // 리뷰 가능한 카테고리 (score_table 제외)
  const reviewableCategories = SCORE_CATEGORIES.filter((c) => c.key !== 'score_table')

  return (
    // backdrop 클릭 시 닫힘
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-sheet" onClick={(e) => e.stopPropagation()}>

        {/* 핸들 + 헤더 */}
        <div className="detail-handle-wrap">
          <div className="list-handle" />
        </div>

        <div className="detail-scroll">
          {/* 카페 기본 정보 */}
          <div className="detail-header">
            <div className="detail-title-row">
              <h2 className="detail-name">{cafe.name}</h2>
              {hasTable && (
                <span className="detail-table-badge">🪑 넓은 테이블</span>
              )}
            </div>
            <p className="detail-address">📌 {cafe.address}</p>
            <div className="detail-meta">
              {cafe.phone && (
                <a className="detail-meta-btn" href={`tel:${cafe.phone}`}>📞 {cafe.phone}</a>
              )}
              {cafe.kakao_url && (
                <a className="detail-meta-btn" href={cafe.kakao_url} target="_blank" rel="noreferrer">
                  🗺️ 카카오맵
                </a>
              )}
            </div>
          </div>

          <hr className="detail-divider" />

          {/* 5대 지표 점수 */}
          <section className="detail-section">
            <h3 className="detail-section-title">카공 지표 점수</h3>
            <div className="detail-scores">
              {reviewableCategories.map((cat) => (
                <ScoreRow
                  key={cat.key}
                  emoji={cat.emoji}
                  label={cat.label}
                  score={cafe[cat.key]}
                />
              ))}
              {/* 테이블은 고정 뱃지로만 */}
              <div className="detail-score-row">
                <span className="detail-score-label">
                  <span className="detail-score-emoji">🪑</span>테이블
                </span>
                <span className={`detail-table-tag ${hasTable ? 'good' : 'bad'}`}>
                  {hasTable ? '넓고 편함' : '보통'}
                </span>
              </div>
            </div>
            <p className="detail-review-count">
              리뷰 {cafe.total_review_count}개 기반
            </p>
          </section>

          <hr className="detail-divider" />

          {/* 리뷰 목록 */}
          <section className="detail-section">
            <h3 className="detail-section-title">방문 리뷰</h3>

            {reviewLoading && (
              <div className="empty-state">
                <div className="spinner" />
                <p>리뷰 불러오는 중</p>
              </div>
            )}

            {reviewError && (
              <div className="empty-state">
                <span className="empty-state-icon">⚠️</span>
                <p>리뷰를 불러올 수 없어요</p>
                <small>{reviewError}</small>
              </div>
            )}

            {!reviewLoading && !reviewError && reviews.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">✍️</span>
                <p>아직 리뷰가 없어요</p>
              </div>
            )}

            {!reviewLoading && !reviewError && reviews.length > 0 && (
              <div className="review-list">
                {reviews.map((rv) => (
                  <ReviewCard key={rv.id} review={rv} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 닫기 버튼 */}
        <button className="detail-close-btn" onClick={onClose}>✕</button>
      </div>
    </div>
  )
}

export default CafeDetailSheet