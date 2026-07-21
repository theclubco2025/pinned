import type { FloorPlan, Zone } from './types'

function zone(
  id: string,
  label: string,
  category: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): Zone {
  return { id, label, category, rect: { x, y, w, h }, color }
}

const GROCERY: FloorPlan = {
  id: 'grocery',
  label: 'Grocery',
  storeType: 'grocery',
  viewBox: { w: 600, h: 400 },
  entrance: { x: 300, y: 385 },
  checkout: { x: 20, y: 300, w: 560, h: 50 },
  zones: [
    zone('dairy', 'Dairy', 'dairy', 20, 20, 110, 160, '#1e3a5f'),
    zone('meat', 'Meat', 'meat', 145, 20, 110, 100, '#5c1a3a'),
    zone('aisle1', 'Aisle 1', 'grocery', 145, 135, 110, 145, '#2a2a32'),
    zone('aisle2', 'Aisle 2', 'grocery', 270, 20, 110, 260, '#2a2a32'),
    zone('aisle3', 'Aisle 3', 'grocery', 395, 20, 70, 260, '#333338'),
    zone('bakery', 'Bakery', 'bakery', 480, 20, 100, 160, '#5c4a1a'),
    zone('produce', 'Produce', 'produce', 20, 195, 110, 85, '#1a4a3a'),
    zone('drinks', 'Drinks', 'beverages', 480, 195, 100, 85, '#2a2a5c'),
  ],
}

const HARDWARE: FloorPlan = {
  id: 'hardware',
  label: 'Hardware',
  storeType: 'hardware',
  viewBox: { w: 600, h: 400 },
  entrance: { x: 300, y: 385 },
  checkout: { x: 20, y: 310, w: 560, h: 50 },
  zones: [
    zone('tools', 'Tools', 'tools', 20, 20, 170, 120, '#5c4a1a'),
    zone('paint', 'Paint', 'paint', 210, 20, 170, 120, '#2a2a5c'),
    zone('plumbing', 'Plumbing', 'plumbing', 400, 20, 180, 120, '#333338'),
    zone('aisle-a', 'Aisle A', 'hardware', 20, 160, 270, 130, '#2a2a32'),
    zone('aisle-b', 'Aisle B', 'hardware', 310, 160, 270, 130, '#2a2a32'),
  ],
}

const PHARMACY: FloorPlan = {
  id: 'pharmacy',
  label: 'Pharmacy',
  storeType: 'pharmacy',
  viewBox: { w: 600, h: 400 },
  entrance: { x: 300, y: 385 },
  checkout: { x: 20, y: 320, w: 560, h: 40 },
  zones: [
    zone('rx', 'Rx Counter', 'pharmacy', 20, 20, 120, 280, '#5c1a3a'),
    zone('otc1', 'OTC 1', 'otc', 160, 20, 100, 280, '#2a2a32'),
    zone('otc2', 'OTC 2', 'otc', 280, 20, 100, 280, '#2a2a32'),
    zone('vitamins', 'Vitamins', 'vitamins', 400, 20, 180, 140, '#1a4a3a'),
    zone('beauty', 'Beauty', 'beauty', 400, 180, 180, 120, '#1e3a5f'),
  ],
}

const GARDEN: FloorPlan = {
  id: 'garden',
  label: 'Garden Center',
  storeType: 'garden',
  viewBox: { w: 600, h: 400 },
  entrance: { x: 300, y: 385 },
  checkout: { x: 20, y: 360, w: 560, h: 30 },
  zones: [
    zone('outdoor', 'Outdoor Plants', 'plants', 20, 20, 260, 150, '#1a4a3a'),
    zone('soil', 'Soil & Mulch', 'soil', 300, 20, 280, 150, '#5c4a1a'),
    zone('tools', 'Tools', 'tools', 20, 190, 180, 150, '#2a2a32'),
    zone('seeds', 'Seeds', 'seeds', 220, 190, 180, 150, '#2a2a32'),
    zone('pots', 'Pots', 'pots', 420, 190, 160, 150, '#2a2a5c'),
  ],
}

const LIQUOR: FloorPlan = {
  id: 'liquor',
  label: 'Liquor',
  storeType: 'liquor',
  viewBox: { w: 600, h: 400 },
  entrance: { x: 300, y: 385 },
  checkout: { x: 20, y: 320, w: 560, h: 40 },
  zones: [
    zone('wine', 'Wine', 'wine', 20, 20, 130, 280, '#5c4a1a'),
    zone('beer', 'Beer', 'beer', 170, 20, 130, 280, '#2a2a5c'),
    zone('spirits', 'Spirits', 'spirits', 320, 20, 130, 280, '#5c1a3a'),
    zone('mixers', 'Mixers', 'mixers', 470, 20, 110, 280, '#333338'),
  ],
}

const BOOKSTORE: FloorPlan = {
  id: 'bookstore',
  label: 'Bookstore',
  storeType: 'bookstore',
  viewBox: { w: 600, h: 400 },
  entrance: { x: 300, y: 385 },
  checkout: { x: 20, y: 320, w: 560, h: 40 },
  zones: [
    zone('fiction', 'Fiction', 'fiction', 20, 20, 170, 280, '#2a2a5c'),
    zone('nonfiction', 'Non-Fiction', 'nonfiction', 210, 20, 170, 280, '#5c1a3a'),
    zone('kids', 'Kids', 'kids', 400, 20, 180, 130, '#5c4a1a'),
    zone('stationery', 'Stationery', 'stationery', 400, 170, 180, 130, '#1a4a3a'),
  ],
}

export const FLOOR_PLANS: FloorPlan[] = [
  GROCERY,
  HARDWARE,
  PHARMACY,
  GARDEN,
  LIQUOR,
  BOOKSTORE,
]

export function getFloorPlan(id: string | null | undefined): FloorPlan | undefined {
  if (!id) return undefined
  return FLOOR_PLANS.find(p => p.id === id)
}

export function pctFromPlan(plan: FloorPlan, x: number, y: number): { x_pct: number; y_pct: number } {
  return {
    x_pct: (x / plan.viewBox.w) * 100,
    y_pct: (y / plan.viewBox.h) * 100,
  }
}

export function planCoordsFromPct(plan: FloorPlan, x_pct: number, y_pct: number): { x: number; y: number } {
  return {
    x: (x_pct / 100) * plan.viewBox.w,
    y: (y_pct / 100) * plan.viewBox.h,
  }
}

export function findNearestZone(plan: FloorPlan, x_pct: number, y_pct: number): Zone | null {
  const { x, y } = planCoordsFromPct(plan, x_pct, y_pct)
  let best: { zone: Zone; dist: number } | null = null
  for (const z of plan.zones) {
    const cx = z.rect.x + z.rect.w / 2
    const cy = z.rect.y + z.rect.h / 2
    const dist = Math.hypot(cx - x, cy - y)
    if (!best || dist < best.dist) best = { zone: z, dist }
  }
  return best?.zone ?? null
}

export function snapToZoneCenter(plan: FloorPlan, x_pct: number, y_pct: number): {
  x_pct: number
  y_pct: number
  zone: Zone
} {
  const zoneMatch = findNearestZone(plan, x_pct, y_pct)!
  const cx = zoneMatch.rect.x + zoneMatch.rect.w / 2
  const cy = zoneMatch.rect.y + zoneMatch.rect.h / 2
  const pct = pctFromPlan(plan, cx, cy)
  return { ...pct, zone: zoneMatch }
}
