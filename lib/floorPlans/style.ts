// Designed visual language for store maps.
// Each category maps to a rich gradient + accent + a compact SVG icon path,
// so structured templates read as a real, professionally drawn store map
// instead of flat colored rectangles.

export interface ZoneStyle {
  from: string
  to: string
  stroke: string
  glow: string
  /** 24x24 viewBox path drawn centered in the zone as a subtle icon */
  icon: string
  /** true for long walkable aisles — renders shelving detail */
  aisle?: boolean
}

// Compact 24x24 icon paths (single-path glyphs, stroke-friendly).
const ICONS = {
  milk: 'M8 2h8l-1 4v0l2 4v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10l1-4z',
  meat: 'M12 3a7 7 0 0 0-7 7c0 3 2 5 4 6l2 5 2-5c2-1 4-3 4-6a7 7 0 0 0-5-6.7z',
  bread: 'M4 11a5 3 0 0 1 16 0v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  leaf: 'M20 4C10 4 4 10 4 20c8 0 16-6 16-16zM4 20l8-8',
  bottle: 'M10 2h4v3l1 3v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8l1-3z',
  cart: 'M3 4h2l2 12h11l2-8H6M9 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01',
  wrench: 'M14 6a4 4 0 0 0-5 5l-6 6 3 3 6-6a4 4 0 0 0 5-5l-3 3-3-3z',
  paint: 'M4 4h13v6H4zM8 10v3a2 2 0 0 0 2 2v5M17 6h3v4h-3',
  pipe: 'M4 8h6V4h4v4h6v4h-6v8h-4v-8H4z',
  pill: 'M7 13l6-6a4 4 0 0 1 6 6l-6 6a4 4 0 0 1-6-6zM10 10l4 4',
  heart: 'M12 21C6 16 3 12 3 8a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 8-9 13z',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  seed: 'M12 3c4 4 4 10 0 14-4-4-4-10 0-14zM12 17v4',
  pot: 'M5 9h14l-2 11H7zM5 9l1-4h12l1 4',
  book: 'M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4v13a3 3 0 0 1 3-3h1z',
  pen: 'M4 20l3-1 11-11-2-2L5 17zM14 6l4 4',
  shelf: 'M4 6h16M4 12h16M4 18h16',
  box: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10',
} as const

interface Palette {
  from: string
  to: string
  stroke: string
  glow: string
  icon: keyof typeof ICONS
  aisle?: boolean
}

const CATEGORY: Record<string, Palette> = {
  dairy: { from: '#1e3a5f', to: '#0f2440', stroke: '#3b82f6', glow: '#3b82f6', icon: 'milk' },
  meat: { from: '#5c1a3a', to: '#3a0f24', stroke: '#f43f5e', glow: '#f43f5e', icon: 'meat' },
  bakery: { from: '#5c4a1a', to: '#3a2f10', stroke: '#f59e0b', glow: '#f59e0b', icon: 'bread' },
  produce: { from: '#14532d', to: '#0b3a1f', stroke: '#22c55e', glow: '#22c55e', icon: 'leaf' },
  beverages: { from: '#1e2a5c', to: '#111a3a', stroke: '#6366f1', glow: '#6366f1', icon: 'bottle' },
  grocery: { from: '#27272a', to: '#18181b', stroke: '#71717a', glow: '#a1a1aa', icon: 'cart', aisle: true },

  tools: { from: '#5c4a1a', to: '#3a2f10', stroke: '#f59e0b', glow: '#f59e0b', icon: 'wrench' },
  paint: { from: '#1e2a5c', to: '#111a3a', stroke: '#6366f1', glow: '#6366f1', icon: 'paint' },
  plumbing: { from: '#134e4a', to: '#0b302e', stroke: '#14b8a6', glow: '#14b8a6', icon: 'pipe' },
  hardware: { from: '#27272a', to: '#18181b', stroke: '#71717a', glow: '#a1a1aa', icon: 'box', aisle: true },

  pharmacy: { from: '#5c1a3a', to: '#3a0f24', stroke: '#ec4899', glow: '#ec4899', icon: 'pill' },
  otc: { from: '#27272a', to: '#18181b', stroke: '#71717a', glow: '#a1a1aa', icon: 'pill', aisle: true },
  vitamins: { from: '#14532d', to: '#0b3a1f', stroke: '#22c55e', glow: '#22c55e', icon: 'heart' },
  beauty: { from: '#1e3a5f', to: '#0f2440', stroke: '#3b82f6', glow: '#3b82f6', icon: 'sparkle' },

  plants: { from: '#14532d', to: '#0b3a1f', stroke: '#22c55e', glow: '#22c55e', icon: 'leaf' },
  soil: { from: '#5c4a1a', to: '#3a2f10', stroke: '#f59e0b', glow: '#f59e0b', icon: 'seed' },
  seeds: { from: '#3f3a14', to: '#26240c', stroke: '#eab308', glow: '#eab308', icon: 'seed', aisle: true },
  pots: { from: '#1e2a5c', to: '#111a3a', stroke: '#6366f1', glow: '#6366f1', icon: 'pot' },

  wine: { from: '#5c1a2a', to: '#3a0f1a', stroke: '#e11d48', glow: '#e11d48', icon: 'bottle' },
  beer: { from: '#5c4a1a', to: '#3a2f10', stroke: '#f59e0b', glow: '#f59e0b', icon: 'bottle' },
  spirits: { from: '#42215c', to: '#2a1439', stroke: '#a855f7', glow: '#a855f7', icon: 'bottle' },
  mixers: { from: '#134e4a', to: '#0b302e', stroke: '#14b8a6', glow: '#14b8a6', icon: 'bottle', aisle: true },

  fiction: { from: '#1e2a5c', to: '#111a3a', stroke: '#6366f1', glow: '#6366f1', icon: 'book', aisle: true },
  nonfiction: { from: '#5c1a3a', to: '#3a0f24', stroke: '#ec4899', glow: '#ec4899', icon: 'book', aisle: true },
  kids: { from: '#5c4a1a', to: '#3a2f10', stroke: '#f59e0b', glow: '#f59e0b', icon: 'sparkle' },
  stationery: { from: '#14532d', to: '#0b3a1f', stroke: '#22c55e', glow: '#22c55e', icon: 'pen' },
}

const FALLBACK: Palette = { from: '#27272a', to: '#18181b', stroke: '#71717a', glow: '#a1a1aa', icon: 'shelf', aisle: true }

export function zoneStyle(category: string): ZoneStyle {
  const p = CATEGORY[category] ?? FALLBACK
  return {
    from: p.from,
    to: p.to,
    stroke: p.stroke,
    glow: p.glow,
    icon: ICONS[p.icon],
    aisle: p.aisle,
  }
}
