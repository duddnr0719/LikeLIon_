import { SCORE_CATEGORIES } from '../constants/scoreConfig'

const GREEN_SHADES = ['var(--green-1)', 'var(--green-2)', 'var(--green-3)', 'var(--green-4)', 'var(--green-5)']

function CategoryPrioritySelector({ priorityOrder, onChange }) {
  const handleSelect = (key) => {
    const current = [...priorityOrder]
    const idx = current.indexOf(key)
    if (idx !== -1) {
      current.splice(idx, 1)
    } else if (current.length < 5) {
      current.push(key)
    }
    onChange(current)
  }

  return (
    <div>
      <p className="priority-panel-label">카공 우선순위</p>
      <div className="priority-chips">
        {SCORE_CATEGORIES.map((cat) => {
          const rank = priorityOrder.indexOf(cat.key)
          const isSelected = rank !== -1
          return (
            <button
              key={cat.key}
              className="priority-chip"
              data-rank={isSelected ? rank + 1 : undefined}
              onClick={() => handleSelect(cat.key)}
              title={cat.desc}
            >
              {isSelected && (
                <span className="priority-rank-badge">{rank + 1}</span>
              )}
              <span className="priority-chip-emoji">{cat.emoji}</span>
              <span className="priority-chip-label">{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* 진행 바 */}
      <div className="priority-progress">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="priority-progress-bar"
            style={{ background: i < priorityOrder.length ? GREEN_SHADES[i] : 'var(--border)' }}
          />
        ))}
        <span className="priority-progress-text">
          {priorityOrder.length === 5 ? '✓ 완성!' : `${priorityOrder.length}/5`}
        </span>
      </div>

      {priorityOrder.length > 0 && (
        <button className="priority-reset" onClick={() => onChange([])}>
          초기화
        </button>
      )}
    </div>
  )
}

export default CategoryPrioritySelector