import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useAdminStore } from '@store/adminStore'
import type { AdminLayoutRect } from '@/theme/adminThemeTypes'

function clampLayoutValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function AdminLayoutItem({
  rootSelector,
  label,
  rect,
  editing,
  onChange,
  children,
  zIndex = 20,
}: {
  rootSelector: string
  label: string
  rect: AdminLayoutRect
  editing: boolean
  onChange: (rect: AdminLayoutRect) => void
  children: ReactNode
  zIndex?: number
}) {
  const beginLayoutChange = useAdminStore((state) => state.beginLayoutChange)

  const startPointerEdit = (
    event: ReactPointerEvent<HTMLButtonElement>,
    mode: 'move' | 'resize'
  ) => {
    if (!editing) return

    const root = event.currentTarget.closest(rootSelector) as HTMLElement | null
    if (!root) return

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    beginLayoutChange()

    const rootBounds = root.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const startRect = rect

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = ((moveEvent.clientX - startX) / rootBounds.width) * 100
      const dy = ((moveEvent.clientY - startY) / rootBounds.height) * 100

      if (mode === 'move') {
        onChange({
          ...startRect,
          x: clampLayoutValue(startRect.x + dx, 0, 100 - startRect.w),
          y: clampLayoutValue(startRect.y + dy, 0, 100 - startRect.h),
        })
        return
      }

      onChange({
        ...startRect,
        w: clampLayoutValue(startRect.w + dx, 4, 100 - startRect.x),
        h: clampLayoutValue(startRect.h + dy, 4, 100 - startRect.y),
      })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
        zIndex,
      }}
    >
      {editing ? (
        <button
          type="button"
          onPointerDown={(event) => startPointerEdit(event, 'move')}
          className="absolute -top-6 left-0 z-[80] cursor-move rounded border border-amber-300 bg-slate-950/90 px-2 py-1 text-[10px] font-black text-amber-200 shadow-lg"
        >
          {label}
        </button>
      ) : null}
      {editing ? (
        <button
          type="button"
          aria-label={`Ridimensiona ${label}`}
          onPointerDown={(event) => startPointerEdit(event, 'resize')}
          className="absolute -bottom-2 -right-2 z-[80] h-5 w-5 cursor-nwse-resize rounded border border-amber-300 bg-slate-950/90 text-[10px] font-black text-amber-200 shadow-lg"
        >
          R
        </button>
      ) : null}
      {editing ? (
        <div className="pointer-events-none absolute inset-0 z-[70] rounded border border-dashed border-amber-300/80" />
      ) : null}
      {children}
    </div>
  )
}
