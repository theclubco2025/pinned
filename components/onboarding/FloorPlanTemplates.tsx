'use client'

import { FLOOR_TEMPLATES } from '@/lib/floorTemplates'
import FloorPlanSVG from '@/components/floorplan/FloorPlanSVG'
import { getFloorPlan } from '@/lib/floorPlans/templates'

interface Props {
  selectedId: string | null
  onSelect: (templateId: string, url: string) => void
}

export default function FloorPlanTemplates({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {FLOOR_TEMPLATES.map(t => {
        const plan = getFloorPlan(t.id)
        const selected = selectedId === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id, t.url)}
            className={`relative min-h-[140px] overflow-hidden rounded-lg border-2 text-left transition-all ${
              selected
                ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background'
                : 'border-border bg-surface hover:border-muted'
            }`}
          >
            {selected && (
              <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                ✓
              </span>
            )}
            <div className="bg-elevated/50 p-2">
              {plan ? (
                <FloorPlanSVG plan={plan} className="h-24 w-full" thumbnail />
              ) : (
                <img src={t.url} alt={t.label} className="h-24 w-full object-contain" />
              )}
            </div>
            <p
              className={`border-t px-3 py-2.5 text-sm font-medium ${
                selected ? 'border-accent/30 bg-accent/10 text-foreground' : 'border-border text-muted'
              }`}
            >
              {t.label}
            </p>
          </button>
        )
      })}
    </div>
  )
}
