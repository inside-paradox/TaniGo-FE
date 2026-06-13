'use client'

import { useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CELL, ELEMEN_META, FIXTURE_STYLE, warnaDef } from '@/lib/denah-elemen'
import type { ElemenDenah } from '@/types'

interface DenahCanvasProps {
  kolom: number
  baris: number
  elemen: ElemenDenah[]
  selectedId: string | null
  onMove: (id: string, x: number, y: number) => void
  onSelect: (id: string) => void
}

export function DenahCanvas({ kolom, baris, elemen, selectedId, onMove, onSelect }: DenahCanvasProps) {
  // A movement larger than the activation distance counts as a drag, so the
  // trailing click that follows a drag does not also open the detail panel.
  const draggedRef = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const el = elemen.find((e) => e.id === event.active.id)
    if (!el) return
    const { delta } = event
    if (Math.abs(delta.x) > 2 || Math.abs(delta.y) > 2) draggedRef.current = true
    const nextX = clamp(Math.round((el.x * CELL + delta.x) / CELL), 0, kolom - el.w)
    const nextY = clamp(Math.round((el.y * CELL + delta.y) / CELL), 0, baris - el.h)
    if (nextX !== el.x || nextY !== el.y) onMove(el.id, nextX, nextY)
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="relative shrink-0 rounded-lg bg-white shadow-inner"
          style={{
            width: kolom * CELL,
            height: baris * CELL,
            backgroundImage:
              'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        >
          {elemen.map((el) => (
            <DraggableElement
              key={el.id}
              el={el}
              selected={el.id === selectedId}
              onSelect={() => {
                if (draggedRef.current) {
                  draggedRef.current = false
                  return
                }
                onSelect(el.id)
              }}
            />
          ))}

          {elemen.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              Belum ada elemen — tambahkan rak atau fasilitas dari toolbar di atas.
            </div>
          )}
        </div>
      </DndContext>
    </div>
  )
}

function DraggableElement({
  el,
  selected,
  onSelect,
}: {
  el: ElemenDenah
  selected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: el.id })
  const meta = ELEMEN_META[el.tipe]
  const Icon = meta.icon

  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x * CELL,
    top: el.y * CELL,
    width: el.w * CELL,
    height: el.h * CELL,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 30 : selected ? 20 : 10,
  }

  const palette =
    el.tipe === 'rak' ? warnaDef(el.warna) : null
  const fixture = el.tipe !== 'rak' ? FIXTURE_STYLE[el.tipe] : null

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      {...listeners}
      {...attributes}
      className={cn(
        'flex touch-none flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border-2 p-1 text-center transition-shadow',
        isDragging ? 'cursor-grabbing shadow-lg' : 'cursor-grab',
        palette && [palette.bg, palette.border, palette.text],
        fixture && [fixture.bg, fixture.border, fixture.text],
        selected && 'ring-2 ring-green-600 ring-offset-1'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="max-w-full truncate text-xs font-bold leading-none">{el.kode}</span>
      {el.tipe === 'rak' && (
        <span className="text-[10px] leading-none opacity-70">{el.produkIds.length} produk</span>
      )}
    </button>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
