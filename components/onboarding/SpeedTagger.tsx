'use client'

import { useState, useRef } from 'react'
import type { Product } from '@/types'
import type { DraftProduct } from '@/lib/draftStore'
import FloorPlanSVG from '@/components/floorplan/FloorPlanSVG'
import { getFloorPlan, snapToZoneCenter } from '@/lib/floorPlans/templates'
import { autoPlaceProducts } from '@/lib/floorPlans/autoPlace'

type TagProduct = Product | DraftProduct

interface Props {
  storeId?: string
  floorPlanUrl: string
  templateId?: string | null
  products: TagProduct[]
  draftMode?: boolean
  onTag?: (productId: string, x_pct: number, y_pct: number, aisleLabel?: string) => void
  onSkip?: (productId: string) => void
  onComplete: () => void
  onGoLiveEarly?: () => void
  taggedCount?: number
  storeType?: string | null
}

export default function SpeedTagger({
  storeId,
  floorPlanUrl,
  templateId,
  products,
  draftMode = false,
  onTag,
  onSkip,
  onComplete,
  onGoLiveEarly,
  taggedCount: externalTaggedCount,
  storeType,
}: Props) {
  const [index, setIndex] = useState(0)
  const [pin, setPin] = useState<{ x: number; y: number; label?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [localTagged, setLocalTagged] = useState(0)
  const [reviewMode, setReviewMode] = useState(false)
  const [autoPlacing, setAutoPlacing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const plan = getFloorPlan(templateId ?? storeType ?? null)
  const useStructured = !!plan

  const current = products[index]
  const taggedCount = externalTaggedCount ?? localTagged
  const showGoLive = taggedCount >= 10 && onGoLiveEarly

  async function saveTag(productId: string, x_pct?: number, y_pct?: number, skip = false, aisleLabel?: string) {
    setSaving(true)
    if (draftMode && onTag && onSkip) {
      if (skip) onSkip(productId)
      else if (x_pct != null && y_pct != null) onTag(productId, x_pct, y_pct, aisleLabel)
    } else if (storeId) {
      await fetch('/api/products/tag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, x_pct, y_pct, skip, aisle_label: aisleLabel }),
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

  function placePinFromPct(x_pct: number, y_pct: number) {
    if (plan) {
      const snapped = snapToZoneCenter(plan, x_pct, y_pct)
      setPin({ x: snapped.x_pct, y: snapped.y_pct, label: snapped.zone.label })
    } else {
      setPin({ x: x_pct, y: y_pct })
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = imgRef.current!.getBoundingClientRect()
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100
    placePinFromPct(x_pct, y_pct)
  }

  function handleSvgClick(x_pct: number, y_pct: number) {
    placePinFromPct(x_pct, y_pct)
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.max(1, Math.min(4, z + (e.deltaY < 0 ? 0.15 : -0.15))))
  }

  function handlePinDragStart(e: React.PointerEvent) {
    e.stopPropagation()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: pin!.x, py: pin!.y }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100 / zoom
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100 / zoom
    const nx = Math.max(2, Math.min(98, dragStart.current.px + dx))
    const ny = Math.max(2, Math.min(98, dragStart.current.py + dy))
    if (plan) {
      const snapped = snapToZoneCenter(plan, nx, ny)
      setPin({ x: snapped.x_pct, y: snapped.y_pct, label: snapped.zone.label })
    } else {
      setPin({ x: nx, y: ny })
    }
  }

  function handlePointerUp() {
    setDragging(false)
    dragStart.current = null
  }

  async function handleAutoPlace() {
    if (!products.length) return
    setAutoPlacing(true)
    try {
      if (draftMode && plan) {
        const suggestions = autoPlaceProducts(
          plan,
          products.map(p => ({ id: p.id, name: p.name }))
        )
        for (const s of suggestions) {
          onTag?.(s.productId, s.x_pct, s.y_pct, s.aisle_label)
        }
        setReviewMode(true)
      } else if (storeId && plan) {
        const res = await fetch('/api/products/auto-place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId,
            storeType: templateId ?? storeType,
            products: products.map(p => ({ id: p.id, name: p.name })),
          }),
        })
        if (res.ok) setReviewMode(true)
      }
    } finally {
      setAutoPlacing(false)
    }
  }

  if (!current && !reviewMode) return null

  const progress = products.length ? Math.round((index / products.length) * 100) : 100

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          {reviewMode ? 'Auto-placed — review on dashboard' : `${index + 1} of ${products.length}`}
          {taggedCount > 0 && ` · ${taggedCount} tagged total`}
        </div>
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-elevated overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {useStructured && !reviewMode && (
        <button
          type="button"
          onClick={handleAutoPlace}
          disabled={autoPlacing}
          className="w-full rounded-xl border border-accent/40 bg-accent/10 py-2.5 text-sm font-medium text-foreground hover:bg-accent/20 disabled:opacity-50"
        >
          {autoPlacing ? 'Placing products…' : '✨ Auto-place my products'}
        </button>
      )}

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

      {!reviewMode && current && (
        <>
          <div className="rounded-xl bg-elevated border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-faint mb-1">Tap where you find:</p>
            <p className="text-xl font-semibold">{current.name}</p>
            {pin?.label && (
              <p className="mt-1 text-xs text-accent">Snapped to {pin.label}</p>
            )}
          </div>

          <div
            ref={containerRef}
            className="relative select-none rounded-xl overflow-hidden border border-border bg-elevated touch-none"
            onWheel={handleWheel}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center',
              }}
            >
              {useStructured && plan ? (
                <FloorPlanSVG
                  plan={plan}
                  activePin={pin ? { x_pct: pin.x, y_pct: pin.y, label: pin.label } : null}
                  onClick={handleSvgClick}
                  interactive
                />
              ) : (
                <img
                  ref={imgRef}
                  src={floorPlanUrl}
                  alt="Floor plan"
                  className="w-full cursor-crosshair"
                  onClick={handleImageClick}
                  draggable={false}
                />
              )}
            </div>
            {pin && !useStructured && (
              <div
                className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
                onPointerDown={handlePinDragStart}
              >
                <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-lg" />
              </div>
            )}
            {pin && useStructured && (
              <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                Pinch/scroll to zoom · drag pin to adjust
              </p>
            )}
          </div>

          <div className="flex gap-2 text-xs text-faint">
            <button type="button" onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="rounded border border-border px-2 py-1">Zoom +</button>
            <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="rounded border border-border px-2 py-1">Zoom −</button>
            <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="rounded border border-border px-2 py-1">Reset</button>
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
              onClick={() => pin && saveTag(current.id, pin.x, pin.y, false, pin.label)}
              disabled={!pin || saving}
              className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Confirm pin'}
            </button>
          </div>
        </>
      )}
      {reviewMode && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-4 text-center">
          <p className="text-sm font-medium">Products auto-placed on your map!</p>
          <p className="mt-1 text-xs text-muted">Looks right? Continue to preview — you can adjust pins anytime.</p>
          <button
            type="button"
            onClick={onComplete}
            className="mt-3 w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Continue to preview →
          </button>
        </div>
      )}
    </div>
  )
}
