import { useEffect, useRef } from 'react'
import { SCORE_CATEGORIES } from '../constants/scoreConfig'

function WorkspaceMarker({ map, cafe, priorityOrder, isActive, onClick }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!map || !window.kakao) return

    const position = new window.kakao.maps.LatLng(
      parseFloat(cafe.latitude),
      parseFloat(cafe.longitude)
    )

    // 마커 DOM 직접 생성 (문자열 아님 → 클릭 이벤트 정상 작동)
    const container = document.createElement('div')
    container.className = `map-marker${isActive ? ' active' : ''}`

    const dot = document.createElement('span')
    dot.className = 'map-marker-dot'

    const name = document.createElement('span')
    name.className = 'map-marker-name'
    name.textContent = cafe.name

    container.appendChild(dot)
    container.appendChild(name)

    // 클릭 이벤트
    container.addEventListener('click', (e) => {
      e.stopPropagation()
      onClick(cafe)
    })

    // 지도 드래그 방해 안 하도록
    container.addEventListener('mousedown', (e) => e.stopPropagation())
    container.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })

    const overlay = new window.kakao.maps.CustomOverlay({
      position,
      content: container,
      yAnchor: 1.3,
      zIndex: isActive ? 10 : 1,
    })

    overlay.setMap(map)
    overlayRef.current = overlay

    return () => {
      overlay.setMap(null)
    }
  }, [map, cafe, priorityOrder, isActive])

  return null
}

export default WorkspaceMarker