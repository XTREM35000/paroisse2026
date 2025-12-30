import React, { useRef, useState, useEffect } from 'react'
import BaseModal from './base-modal'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  verticalOnly?: boolean
  draggableOnMobile?: boolean
  initialY?: number
}

export default function DraggableModal({ open, onClose, children, verticalOnly = true, draggableOnMobile = false, initialY = 0 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [posY, setPosY] = useState(initialY)
  const dragging = useRef(false)
  const startY = useRef(0)

  useEffect(() => {
    setPosY(initialY)
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
    if (isInteractiveTarget(e.target)) return
    dragging.current = true
    startY.current = e.clientY - posY
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch {}
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    let newY = e.clientY - startY.current
    // Limit vertical movement so modal stays visible
    const max = Math.max(120, (window.innerHeight / 2) - 80)
    newY = Math.max(-max, Math.min(max, newY))
    setPosY(newY)
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch {}
  }

  if (!open) return null

  return (
    <BaseModal open={open} onClose={onClose}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translateY(${posY}px)`, touchAction: 'none' as const }}
        className="bg-background rounded-lg shadow max-w-2xl w-full p-0 overflow-hidden"
      >
        {children}
      </div>
    </BaseModal>
  )
}
