// src/components/ui/SwipeToDelete.tsx
import { useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onDelete: () => void
}

const SNAP_THRESHOLD = 80   // この距離以上スワイプで削除ゾーン表示
const DELETE_THRESHOLD = 160 // この距離以上スワイプで即削除

export default function SwipeToDelete({ children, onDelete }: Props) {
  const [offset, setOffset] = useState(0)
  // isDragging は useRef（イベントハンドラ内で同期的に参照するため）
  // dragging は useState（JSXのstyle計算に使うため — refはレンダー時に古い値を返す）
  const startX = useRef(0)
  const isDragging = useRef(false)
  const [dragging, setDragging] = useState(false)

  const onStart = (clientX: number) => {
    startX.current = clientX
    isDragging.current = true
    setDragging(true)
  }

  const onMove = (clientX: number) => {
    if (!isDragging.current) return
    const delta = clientX - startX.current
    if (delta < 0) setOffset(Math.max(delta, -DELETE_THRESHOLD))
  }

  const onEnd = () => {
    isDragging.current = false
    setDragging(false)
    if (offset <= -DELETE_THRESHOLD) {
      onDelete()
      setOffset(0)
    } else if (offset < -SNAP_THRESHOLD) {
      setOffset(-SNAP_THRESHOLD)
    } else {
      setOffset(0)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* 削除ゾーン（背景） */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 pr-5 text-white text-sm font-medium"
        style={{ width: SNAP_THRESHOLD }}
      >
        削除
      </div>
      {/* コンテンツ（スライドする） */}
      <div
        className="relative"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => { if (isDragging.current) onMove(e.clientX) }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        {children}
      </div>
    </div>
  )
}
