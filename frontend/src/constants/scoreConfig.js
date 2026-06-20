// 카공족 5대 지표 설정
export const SCORE_CATEGORIES = [
  {
    key: 'score_plug',
    emoji: '🔌',
    label: '콘센트',
    desc: '자리마다 있을수록 높음',
  },
  {
    key: 'score_wifi',
    emoji: '🛜',
    label: '와이파이',
    desc: '빠르고 안정적일수록 높음',
  },
  {
    key: 'score_noise',
    emoji: '🔊',
    label: '소음',
    desc: '조용할수록 높음',
  },
  {
    key: 'score_comfort',
    emoji: '🙄',
    label: '눈치',
    desc: '눈치 안 줄수록 높음',
  },
  {
    key: 'score_table',
    emoji: '🪑',
    label: '테이블',
    desc: '넓고 편할수록 높음',
  },
]

// 우선순위 가중치 (1순위 → 가장 높은 가중치)
export const PRIORITY_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08]

// 우선순위 적용해서 카페 총점 계산
export function calcWeightedScore(cafe, priorityOrder) {
  return priorityOrder.reduce((total, categoryKey, index) => {
    const weight = PRIORITY_WEIGHTS[index]
    const score = cafe[categoryKey] ?? 0
    // score_table은 0 or 5이므로 5점 기준으로 정규화
    const normalized = score / 5
    return total + normalized * weight
  }, 0)
}