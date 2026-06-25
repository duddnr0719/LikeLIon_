import { SCORE_CATEGORIES, calcWeightedScore } from '../constants/scoreConfig'

// 거리 m → 표시용 문자열
function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// 두 좌표 사이 거리(m) — Haversine
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function ScoreDots({ score }) {
  const filled = Math.round(score)
  return (
    <div className="score-dots">
      {[1,2,3,4,5].map((i) => (
        <span key={i} className={`score-dot ${i <= filled ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

function CafeCard({ cafe, rank, priorityOrder, userLocation, isActive, onClick }) {
  // 거리 계산 (위치 있을 때만)
  const distance = userLocation
    ? getDistanceMeters(
        userLocation.lat, userLocation.lng,
        parseFloat(cafe.latitude), parseFloat(cafe.longitude)
      )
    : null

  return (
    <div
      className={`cafe-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(cafe)}
    >
      <div className="cafe-card-top">
        <span className="cafe-card-name">
          {rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : `${rank}. `}{cafe.name}
        </span>
        <div className="cafe-card-badges">
          {/* 거리 뱃지 — 위치 ON일 때만 */}
          {distance !== null && (
            <span className="cafe-distance-badge">
              📍 {formatDistance(distance)}
            </span>
          )}
          {/* 가중치 점수 뱃지 — 우선순위 5개 완성 시 */}
          {priorityOrder.length === 5 && (
            <span className="cafe-weighted-score">
              {(calcWeightedScore(cafe, priorityOrder) * 100).toFixed(0)}점
            </span>
          )}
        </div>
      </div>
      <p className="cafe-card-addr">{cafe.address}</p>
      <div className="cafe-score-row">
        {SCORE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="cafe-score-pill">
            <span className="cafe-score-emoji">{cat.emoji}</span>
            <ScoreDots score={cafe[cat.key] ?? 0} />
          </div>
        ))}
      </div>
    </div>
  )
}

// App.jsx에서 이미 정렬·슬라이스된 cafes를 받으므로 여기선 그대로 렌더링
function CafeList({ cafes, priorityOrder, userLocation, activeCafeId, onCafeClick }) {
  if (cafes.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">☕</span>
        <p>카페를 불러오는 중이에요</p>
      </div>
    )
  }

  return (
    <div className="cafe-cards-col">
      {cafes.map((cafe, idx) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          rank={idx + 1}
          priorityOrder={priorityOrder}
          userLocation={userLocation}
          isActive={activeCafeId === cafe.id}
          onClick={onCafeClick}
        />
      ))}
    </div>
  )
}

export default CafeList