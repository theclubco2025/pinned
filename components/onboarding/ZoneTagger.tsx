'use client'

import { useState, useRef } from 'react'
import type { Product } from '@/types'
import type { DraftProduct } from '@/lib/draftStore'
import FloorPlanSVG from '@/components/floorplan/FloorPlanSVG'
import { getFloorPlan, snapToZoneCenter } from '@/lib/floorPlans/templates'

type TagProduct = Product | DraftProduct

interface Props {
  floorPlanUrl: string
  templateId?: string | null
  products: TagProduct[]
  draftMode?: boolean
  onBulkTag?: (productIds: string[], x_pct: number, y_pct: number, aisleLabel: string) => void
  onComplete: () => void
}

export default function ZoneTagger({
  floorPlanUrl,
  templateId,
  products,
  draftMode = false,
  onBulkTag,
  onComplete,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [aisleLabel, setAisleLabel] = useState('')
  const [pin, setPin] = useState<{ x: number; y: number; label?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const plan = getFloorPlan(templateId ?? null)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function placePin(x_pct: number, y_pct: number) {
    if (plan) {
      const snapped = snapToZoneCenter(plan, x_pct, y_pct)
      setPin({ x: snapped.x_pct, y: snapped.y_pct, label: snapped.zone.label })
      if (!aisleLabel) setAisleLabel(snapped.zone.label)
    } else {
      setPin({ x: x_pct, y: y_pct })
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = imgRef.current!.getBoundingClientRect()
    placePin(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100
    )
  }

  async function confirmZone() {
    if (!pin || selected.size === 0) return
    setSaving(true)
    const ids = [...selected]
    const label = aisleLabel.trim() || pin.label || 'Aisle'

    if (draftMode && onBulkTag) {
      onBulkTag(ids, pin.x, pin.y, label)
    } else {
      await fetch('/api/products/tag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: ids,
          x_pct: pin.x,
          y_pct: pin.y,
          aisle_label: label,
        }),
      })
    }
    setSaving(false)
    onComplete()
  }

  if (!products.length) return null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div>
        <h3 className="font-medium">Bulk tag by aisle/zone</h3>
        <p className="text-sm text-muted">Select products, name the zone, tap one spot on the map.</p>
      </div>

      <input
        type="text"
        value={aisleLabel}
        onChange={e => setAisleLabel(e.target.value)}
        placeholder="Zone name (e.g. Dairy, Aisle 3)"
        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground"
      />

      <div className="max-h-40 overflow-y-auto space-y-1">
        {products.map(p => (
          <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            {p.name}
          </label>
        ))}
      </div>

      <div className="relative select-none overflow-hidden rounded-xl border border-border bg-elevated">
        {plan ? (
          <FloorPlanSVG
            plan={plan}
            activePin={pin ? { x_pct: pin.x, y_pct: pin.y } : null}
            onClick={(x, y) => placePin(x, y)}
            interactive
            className="max-h-48"
          />
        ) : (
          <>
            <img
              ref={imgRef}
              src={floorPlanUrl}
              alt="Floor plan"
              className="w-full cursor-crosshair max-h-48 object-contain"
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
          </>
        )}
      </div>

      <button
        type="button"
        onClick={confirmZone}
        disabled={!pin || selected.size === 0 || saving}
        className="rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
      >
        {saving ? 'Saving…' : `Tag ${selected.size} products in this zone`}
      </button>
    </div>
  )
}
