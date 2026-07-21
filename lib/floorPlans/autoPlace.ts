import type { FloorPlan } from './types'
import { pctFromPlan } from './templates'

export interface AutoPlaceInput {
  id: string
  name: string
}

export interface AutoPlaceResult {
  productId: string
  zoneId: string
  x_pct: number
  y_pct: number
  aisle_label: string
}

const KEYWORD_RULES: { pattern: RegExp; categories: string[] }[] = [
  { pattern: /milk|dairy|cheese|yogurt|butter|egg/i, categories: ['dairy'] },
  { pattern: /meat|beef|chicken|pork|fish/i, categories: ['meat'] },
  { pattern: /bread|bakery|roll|bagel/i, categories: ['bakery'] },
  { pattern: /produce|banana|apple|vegetable|fruit|tomato/i, categories: ['produce', 'plants'] },
  { pattern: /drink|juice|soda|water|beer|wine|vodka|whiskey|tequila|prosecco/i, categories: ['beverages', 'beer', 'wine', 'spirits', 'mixers'] },
  { pattern: /tool|hammer|screw|drill|wd-?40|tape|nail|bulb|cord/i, categories: ['tools', 'hardware'] },
  { pattern: /paint|roller|brush/i, categories: ['paint'] },
  { pattern: /plumb|pipe|faucet/i, categories: ['plumbing'] },
  { pattern: /vitamin|medicine|ibuprofen|allergy|cough|band-?aid|rx|otc/i, categories: ['vitamins', 'otc', 'pharmacy'] },
  { pattern: /beauty|shampoo|toothpaste|sunscreen|sanitizer/i, categories: ['beauty'] },
  { pattern: /soil|mulch|seed|plant|pot|fertilizer|hose|garden/i, categories: ['soil', 'seeds', 'plants', 'pots', 'tools'] },
  { pattern: /book|fiction|novel|magazine|biograph|puzzle/i, categories: ['fiction', 'nonfiction', 'kids', 'stationery'] },
  { pattern: /pen|notebook|stationery/i, categories: ['stationery'] },
]

function matchZoneByKeywords(plan: FloorPlan, name: string) {
  for (const rule of KEYWORD_RULES) {
    if (!rule.pattern.test(name)) continue
    for (const cat of rule.categories) {
      const zone = plan.zones.find(z => z.category === cat || z.id.includes(cat))
      if (zone) return zone
    }
  }
  return null
}

function hashOffset(id: string): { dx: number; dy: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return { dx: ((h % 7) - 3) * 2, dy: (((h >> 3) % 7) - 3) * 2 }
}

/** Deterministic client-side auto-placement using keyword rules + zone centers. */
export function autoPlaceProducts(
  plan: FloorPlan,
  products: AutoPlaceInput[]
): AutoPlaceResult[] {
  const usedZones = new Map<string, number>()
  const results: AutoPlaceResult[] = []

  for (const p of products) {
    let zone = matchZoneByKeywords(plan, p.name)
    if (!zone) {
      const idx = results.length % plan.zones.length
      zone = plan.zones[idx]
    }

    const count = usedZones.get(zone.id) ?? 0
    usedZones.set(zone.id, count + 1)
    const cx = zone.rect.x + zone.rect.w / 2
    const cy = zone.rect.y + zone.rect.h / 2
    const base = pctFromPlan(plan, cx, cy)
    const off = hashOffset(p.id + String(count))
    const x_pct = Math.max(5, Math.min(95, base.x_pct + off.dx))
    const y_pct = Math.max(5, Math.min(95, base.y_pct + off.dy))

    results.push({
      productId: p.id,
      zoneId: zone.id,
      x_pct,
      y_pct,
      aisle_label: zone.label,
    })
  }

  return results
}
