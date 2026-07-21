'use client'

import { STARTER_PACKS, type StarterPackId } from '@/lib/starterPacks'

interface Props {
  selected: StarterPackId | null
  onSelect: (id: StarterPackId) => void
}

export default function StoreTypePicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STARTER_PACKS.map(pack => {
        const active = selected === pack.id
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => onSelect(pack.id)}
            className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
              active
                ? 'border-accent bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-background'
                : 'border-border bg-surface hover:border-muted'
            }`}
          >
            <span className="block text-sm font-semibold">{pack.label}</span>
            <span className="mt-1 block text-xs text-muted">{pack.products.length} starter items</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => onSelect('grocery')}
        className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
          selected === null
            ? 'border-border bg-surface hover:border-muted'
            : 'border-border bg-surface hover:border-muted'
        }`}
        disabled
        title="Pick a category above, or use Other in step 3"
        style={{ display: 'none' }}
      >
        Other
      </button>
    </div>
  )
}

export type { StarterPackId }
