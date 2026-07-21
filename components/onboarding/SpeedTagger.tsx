'use client'

import { useState, useRef } from 'react'
import type { Product } from '@/types'
import type { DraftProduct } from '@/lib/draftStore'

type TagProduct = Product | DraftProduct

interface Props {
  storeId?: string
  floorPlanUrl: string
  products: TagProduct[]
  draftMode?: boolean
  onTag?: (productId: string, x_pct: number, y_pct: number, aisleLabel?: string) => void
  onSkip?: (productId: string) => void
  onComplete: () => void
  onGoLiveEarly?: () => void
  taggedCount?: number
}

export default function SpeedTagger({
  storeId,
  floorPlanUrl,
  products,
  draftMode = false,
  onTag,
  onSkip,
  onComplete,
  onGoLiveEarly,
  taggedCount: externalTaggedCount,
}: Props) {
  const [index, setIndex] = useState(0)
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [localTagged, setLocalTagged] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  const current = products[index]
  const taggedCount = externalTaggedCount ?? localTagged
  const showGoLive = taggedCount >= 10 && onGoLiveEarly

  async function saveTag(productId: string, x_pct?: number, y_pct?: number, skip = false) {
    setSaving(true)
    if (draftMode && onTag && onSkip) {
      if (skip) onSkip(productId)
      else if (x_pct != null && y_pct != null) onTag(productId, x_pct, y_pct)
    } else if (storeId) {
      await fetch('/api/products/tag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, x_pct, y_pct, skip }),
      })
    }
    setSaving(false)
    if (!skip && x_pct != null) setLocalTagged(c => c + 1)
    else if (skip) setLocalTagged(c => c + 1)
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

  const progress = products.length ? Math.round((index / products.length) * 100) : 100

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          {index + 1} of {products.length}
          {taggedCount > 0 && ` · ${taggedCount} tagged total`}
        </div>
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-elevated overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {showGoLive && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
          <p className="text-sm font-medium text-foreground">You&apos;ve tagged {taggedCount} products — enough to go live!</p>
          <button
            type="button"
            onClick={onGoLiveEarly}
            className="mt-2 w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Go live now — tag the rest later →
          </button>
        </div>
      )}

      <div className="rounded-xl bg-elevated border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-faint mb-1">Tap where you find:</p>
        <p className="text-xl font-semibold">{current.name}</p>
      </div>

      <div className="relative select-none rounded-xl overflow-hidden border border-border bg-white">
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
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
          >
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg" />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => saveTag(current.id, undefined, undefined, true)}
          disabled={saving}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted hover:bg-elevated disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => pin && saveTag(current.id, pin.x, pin.y)}
          disabled={!pin || saving}
          className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Confirm pin'}
        </button>
      </div>
    </div>
  )
}
