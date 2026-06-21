import { useState, useEffect, useRef, useCallback } from 'react'
import CafeList from './components/CafeList'
import CategoryPrioritySelector from './components/CategoryPrioritySelector'
import WorkspaceMarker from './components/WorkspaceMarker'
import './App.css'

const API_BASE = 'http://localhost:8000'
const SEONGDONG_CENTER = { lat: 37.5633, lng: 127.0371 }

// 바텀시트 높이 단계 (vh 기준)
const SNAP_POINTS = {
  collapsed: 15,   // 핸들만 보임
  half: 45,        // 절반
  full: 85,        // 거의 전체
}

function App() {
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [priorityOrder, setPriorityOrder] = useState([])
  const [activeCafe, setActiveCafe] = useState(null)
  const [map, setMap] = useState(null)
  const [mobilePanel, setMobilePanel] = useState(false)

  // 바텀시트 드래그 상태
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS.half)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  const sheetRef = useRef(null)
  const mapRef = useRef(null)

  // 카카오맵 초기화
  useEffect(() => {
    const init = () => {
      if (!mapRef.current || !window.kakao?.maps) return
      window.kakao.maps.load(() => {
        const kakaoMap = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(SEONGDONG_CENTER.lat, SEONGDONG_CENTER.lng),
          level: 4,
        })
        setMap(kakaoMap)
      })
    }
    if (window.kakao?.maps) init()
    else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]')
      script?.addEventListener('load', init)
      return () => script?.removeEventListener('load', init)
    }
  }, [])

  // 카페 데이터
  useEffect(() => {
    fetch(`${API_BASE}/api/spaces/`)
      .then((r) => { if (!r.ok) throw new Error(`서버 오류 ${r.status}`); return r.json() })
      .then(setCafes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleCafeClick = (cafe) => {
    setActiveCafe(cafe)
    if (map) {
      map.panTo(new window.kakao.maps.LatLng(
        parseFloat(cafe.latitude),
        parseFloat(cafe.longitude)
      ))
    }
  }

  // 드래그 시작
  const onDragStart = useCallback((clientY) => {
    isDragging.current = true
    startY.current = clientY
    startHeight.current = sheetHeight
    document.body.style.userSelect = 'none'
  }, [sheetHeight])

  // 드래그 중
  const onDragMove = useCallback((clientY) => {
    if (!isDragging.current) return
    const deltaY = startY.current - clientY
    const deltaVh = (deltaY / window.innerHeight) * 100
    const newHeight = Math.min(SNAP_POINTS.full, Math.max(SNAP_POINTS.collapsed, startHeight.current + deltaVh))
    setSheetHeight(newHeight)
  }, [])

  // 드래그 끝 → 가장 가까운 스냅 포인트로
  const onDragEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.userSelect = ''

    const points = Object.values(SNAP_POINTS)
    const closest = points.reduce((prev, curr) =>
      Math.abs(curr - sheetHeight) < Math.abs(prev - sheetHeight) ? curr : prev
    )
    setSheetHeight(closest)
  }, [sheetHeight])

  // 마우스 이벤트
  useEffect(() => {
    const onMove = (e) => onDragMove(e.clientY)
    const onEnd = () => onDragEnd()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
    }
  }, [onDragMove, onDragEnd])

  // 터치 이벤트
  useEffect(() => {
    const onMove = (e) => onDragMove(e.touches[0].clientY)
    const onEnd = () => onDragEnd()
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onDragMove, onDragEnd])

  return (
    <div className="app-root">
      {/* 카카오맵 전체 배경 */}
      <div ref={mapRef} className="kakao-map" />

      {/* 마커들 */}
      {map && cafes.map((cafe) => (
        <WorkspaceMarker
          key={cafe.id}
          map={map}
          cafe={cafe}
          priorityOrder={priorityOrder}
          isActive={activeCafe?.id === cafe.id}
          onClick={handleCafeClick}
        />
      ))}

      {/* 플로팅 헤더 */}
      <header className="float-header">
        <span className="header-logo">Track<span>Look</span> 🗺️</span>
        <span className="header-sub">성동구 카공 카페 찾기</span>
      </header>

      {/* PC: 플로팅 우선순위 패널 */}
      <div className="float-priority">
        <CategoryPrioritySelector
          priorityOrder={priorityOrder}
          onChange={setPriorityOrder}
        />
      </div>

      {/* 모바일: 우선순위 토글 버튼 */}
      <button
        className="mobile-priority-btn"
        onClick={() => setMobilePanel(true)}
      >
        ✨ 우선순위 설정 {priorityOrder.length > 0 && `(${priorityOrder.length}/5)`}
      </button>

      {/* 모바일: 슬라이드업 패널 */}
      {mobilePanel && (
        <div className="mobile-priority-panel">
          <div className="list-handle" />
          <CategoryPrioritySelector
            priorityOrder={priorityOrder}
            onChange={(order) => {
              setPriorityOrder(order)
              if (order.length === 5) setMobilePanel(false)
            }}
          />
          <button className="priority-reset" style={{ marginTop: 12 }} onClick={() => setMobilePanel(false)}>
            닫기
          </button>
        </div>
      )}

      {/* 드래그 가능한 바텀시트 */}
      <div
        ref={sheetRef}
        className="bottom-sheet"
        style={{ height: `${sheetHeight}vh` }}
      >
        {/* 드래그 핸들 */}
        <div
          className="sheet-handle-area"
          onMouseDown={(e) => onDragStart(e.clientY)}
          onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
        >
          <div className="list-handle" />
          <div className="list-top">
            <span className="list-title">
              {priorityOrder.length === 5 ? '🎯 최적 카페 순위' : '카페 목록'}
            </span>
            {!loading && <span className="list-count">{cafes.length}곳</span>}
          </div>
        </div>

        {/* 스크롤 가능한 카드 영역 */}
        <div className="sheet-scroll">
          {loading && (
            <div className="empty-state">
              <div className="spinner" />
              <p>카페 불러오는 중</p>
            </div>
          )}
          {error && (
            <div className="empty-state">
              <span className="empty-state-icon">⚠️</span>
              <p>백엔드 서버에 연결할 수 없어요</p>
              <small>{error}</small>
            </div>
          )}
          {!loading && !error && (
            <CafeList
              cafes={cafes}
              priorityOrder={priorityOrder}
              activeCafeId={activeCafe?.id}
              onCafeClick={handleCafeClick}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App