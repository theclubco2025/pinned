'use client'

import { FLOOR_TEMPLATES } from '@/lib/floorTemplates'

interface Props {
  selectedId: string | null
  onSelect: (templateId: string, url: string) => void
}

export default function FloorPlanTemplates({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FLOOR_TEMPLATES.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id, t.url)}
          className={`overflow-hidden rounded-xl border bg-white text-left transition-colors ${
            selectedId === t.id ? 'border-foreground ring-2 ring-foreground' : 'border-border hover:border-muted'
          }`}
        >
          <img src={t.url} alt={t.label} className="w-full" />
          <p className="px-2 py-2 text-xs font-medium text-foreground">{t.label}</p>
        </button>
      ))}
    </div>
  )
}
