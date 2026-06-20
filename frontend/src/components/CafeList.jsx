import { SCORE_CATEGORIES, calcWeightedScore } from '../constants/scoreConfig'

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

function CafeCard({ cafe, rank, priorityOrder, isActive, onClick }) {
  return (
    <div
      className={`cafe-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(cafe)}
    >
      <div className="cafe-card-top">
        <span className="cafe-card-name">
          {rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : ''}{cafe.name}
        </span>
        {priorityOrder.length === 5 && (
          <span className="cafe-weighted-score">
            {(calcWeightedScore(cafe, priorityOrder) * 100).toFixed(0)}점
          </span>
        )}
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

function CafeList({ cafes, priorityOrder, activeCafeId, onCafeClick }) {
  const sorted = priorityOrder.length === 5
    ? [...cafes].sort((a, b) => calcWeightedScore(b, priorityOrder) - calcWeightedScore(a, priorityOrder))
    : cafes

  if (cafes.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">☕</span>
        <p>카페를 불러오는 중이에요</p>
      </div>
    )
  }

  return (
    <div className="cafe-cards-row">
      {sorted.map((cafe, idx) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          rank={idx + 1}
          priorityOrder={priorityOrder}
          isActive={activeCafeId === cafe.id}
          onClick={onCafeClick}
        />
      ))}
    </div>
  )
}

export default CafeList