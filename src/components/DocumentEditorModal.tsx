import React, { useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  headerClassName?: string
}

export default function DocumentEditorModal({ 
  open, 
  onClose, 
  title, 
  children,
  headerClassName = 'bg-amber-900'
}: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const start = useRef({ x: 0, y: 0 })

  if (!open) return null

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    start.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    setPos({
      x: e.clientX - start.current.x,
      y: e.clientY - start.current.y,
    })
  }

  const onMouseUp = () => {
    dragging.current = false
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragging.current = false }}
        className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col border border-gray-200"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        {/* Header = seule zone draggable */}
        <div
          onMouseDown={onMouseDown}
          className={`cursor-grab active:cursor-grabbing select-none flex items-center justify-between px-6 py-4 ${headerClassName} text-white rounded-t-lg`}
        >
          <h3 className="font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
