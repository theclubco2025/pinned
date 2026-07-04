'use client'

import { useState, useRef } from 'react'
import type { Product } from '@/types'

interface Props {
  storeId: string
  floorPlanUrl: string
  products: Product[]
  onComplete: () => void
}

export default function SpeedTagger({ floorPlanUrl, products, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const current = products[index]

  async function saveTag(productId: string, x_pct?: number, y_pct?: number, skip = false) {
    setSaving(true)
    await fetch('/api/products/tag', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, x_pct, y_pct, skip }),
    })
    setSaving(false)
    advance()
  }

  function advance() {
    setPin(null)
    if (index + 1 >= products.length) {
      onComplete()
    } else {
      setIndex(i => i + 1)
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = imgRef.current!.getBoundingClientRect()
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100
    setPin({ x: x_pct, y: y_pct })
  }

  if (!current) return null

  const progress = Math.round((index / products.length) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          {index + 1} of {products.length}
        </div>
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Tap where you find:</p>
        <p className="text-xl font-semibold">{current.name}</p>
      </div>

      <div className="relative select-none rounded-xl overflow-hidden border border-zinc-200">
        <img
          ref={imgRef}
          src={floorPlanUrl}
          alt="Floor plan"
          className="w-full cursor-crosshair"
          onClick={handleImageClick}
          draggable={false}
        />
        {pin && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg" />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => saveTag(current.id, undefined, undefined, true)}
          disabled={saving}
          className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={() => pin && saveTag(current.id, pin.x, pin.y)}
          disabled={!pin || saving}
          className="flex-1 rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Confirm pin'}
        </button>
      </div>
    </div>
  )
}
