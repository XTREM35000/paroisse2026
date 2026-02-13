import React, { useRef, useEffect } from 'react'
import BaseModal from './base-modal'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  verticalOnly?: boolean
  draggableOnMobile?: boolean
  dragHandleOnly?: boolean
  initialY?: number
  center?: boolean
  maxWidthClass?: string
}

export default function DraggableModal({
  open,
  onClose,
  children,
  verticalOnly = true,
  draggableOnMobile = false,
  dragHandleOnly = false,
  initialY = 0,
  center = false,
  maxWidthClass = 'max-w-4xl',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startX = useRef(0)
  const pos = useRef({ x: 0, y: initialY })

  useEffect(() => {
    pos.current = { x: 0, y: initialY }
    if (ref.current) {
      ref.current.style.transform = `translate(0px, ${initialY}px)`
    }
  }, [initialY, open])

  function isTouchDevice() {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }

  function isInteractiveTarget(target: EventTarget | null) {
    try {
      const el = target as Element | null
      if (!el) return false
      const tag = el.tagName?.toLowerCase()
      if (!tag) return false
      const interactive = ['input', 'textarea', 'select', 'button', 'a', 'svg', 'path', 'label']
      if (interactive.includes(tag)) return true
      if (el.closest && el.closest('button, a, input, textarea, select, label')) return true
      return false
    } catch {
      return false
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!open) return
    if (isTouchDevice() && !draggableOnMobile) return

    if (dragHandleOnly) {
      const el = e.target as Element | null
      if (!el?.closest('[data-drag-handle]')) return
    }

    if (isInteractiveTarget(e.target)) return

    dragging.current = true

    startY.current = e.clientY - pos.current.y
    startX.current = e.clientX - pos.current.x

    try { (e.target as Element).setPointerCapture(e.pointerId) } catch {
      // Ignore pointer capture errors
    }
    try { document.body.style.userSelect = 'none' } catch {
      // Ignore style errors
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !ref.current) return

    let newY = e.clientY - startY.current
    const vMax = Math.max(200, window.innerHeight - 160)
    newY = Math.max(-vMax, Math.min(vMax, newY))

    if (verticalOnly) {
      pos.current.y = newY
      ref.current.style.transform = `translate(0px, ${newY}px)`
      return
    }

    let newX = e.clientX - startX.current
    const hMax = Math.max(200, Math.floor(window.innerWidth / 2) - 80)
    newX = Math.max(-hMax, Math.min(hMax, newX))

    pos.current = { x: newX, y: newY }
    ref.current.style.transform = `translate(${newX}px, ${newY}px)`
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch {
      // Ignore pointer release errors
    }
    try { document.body.style.userSelect = '' } catch {
      // Ignore style errors
    }
  }

  if (!open) return null

  return (
    <BaseModal open={open} onClose={onClose} center={center}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translate(0px, ${initialY}px)`, touchAction: 'none' as const }}
        className={`bg-background rounded-lg shadow ${maxWidthClass} w-full p-0 overflow-hidden cursor-grab`}
      >
        {children}
      </div>
    </BaseModal>
  )
}
