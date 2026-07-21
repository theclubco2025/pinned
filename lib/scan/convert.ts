import type { FloorPlan, Zone } from '@/lib/floorPlans/types'
import type { StarterPackId } from '@/lib/starterPacks'
import type { RoomScan, ScannedObject } from './types'

const TARGET_W = 600

// Map RoomPlan / native categories onto our styled zone categories.
const CATEGORY_MAP: Record<string, string> = {
  shelf: 'grocery',
  storage: 'grocery',
  refrigerator: 'dairy',
  oven: 'bakery',
  counter: 'checkout',
  table: 'produce',
  sink: 'plumbing',
  bed: 'grocery',
  sofa: 'grocery',
  cabinet: 'grocery',
}

function mapCategory(raw: string): string {
  const key = raw.toLowerCase()
  return CATEGORY_MAP[key] ?? key
}

/**
 * Convert a real-world RoomScan (meters) into the app's FloorPlan structure
 * (a 600-wide viewBox). Deterministic and dependency-free so it can run on the
 * server (upload endpoint) or client (native bridge) identically.
 */
export function roomScanToFloorPlan(
  scan: RoomScan,
  meta: { id: string; label: string; storeType: StarterPackId }
): FloorPlan {
  const scale = TARGET_W / Math.max(scan.bounds.width, 0.001)
  const viewW = Math.round(scan.bounds.width * scale)
  const viewH = Math.round(scan.bounds.depth * scale)

  const zones: Zone[] = scan.objects
    .filter(o => mapCategory(o.category) !== 'checkout')
    .map((o: ScannedObject, i) => {
      const w = Math.max(24, o.size.w * scale)
      const h = Math.max(24, o.size.d * scale)
      return {
        id: o.id || `zone-${i}`,
        label: o.label || titleCase(o.category),
        category: mapCategory(o.category),
        rect: {
          x: clamp(o.center.x * scale - w / 2, 6, viewW - w - 6),
          y: clamp(o.center.y * scale - h / 2, 6, viewH - h - 6),
          w,
          h,
        },
        color: '#27272a',
      }
    })

  const counter = scan.objects.find(o => mapCategory(o.category) === 'checkout')
  const checkout = counter
    ? {
        x: clamp(counter.center.x * scale - (counter.size.w * scale) / 2, 6, viewW - 6),
        y: clamp(counter.center.y * scale - (counter.size.d * scale) / 2, 6, viewH - 6),
        w: Math.max(60, counter.size.w * scale),
        h: Math.max(24, counter.size.d * scale),
      }
    : undefined

  const door = scan.doors[0]
  const entrance = door
    ? { x: clamp(door.center.x * scale, 20, viewW - 20), y: viewH - 8 }
    : { x: Math.round(viewW / 2), y: viewH - 8 }

  return {
    id: meta.id,
    label: meta.label,
    storeType: meta.storeType,
    viewBox: { w: viewW, h: viewH },
    entrance,
    checkout,
    zones,
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}
