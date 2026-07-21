import type { StarterPackId } from '@/lib/starterPacks'
import type { RoomScan } from '@/lib/scan/types'
import type { FloorPlan } from '@/lib/floorPlans/types'
import { roomScanToFloorPlan } from '@/lib/scan/convert'

export interface DraftProduct {
  id: string
  name: string
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
  aisle_label: string | null
}

export interface DraftStore {
  storeName: string
  storeType: StarterPackId | null
  floorPlanUrl: string | null
  templateId: string | null
  scan: RoomScan | null
  floorPlan: FloorPlan | null
  products: DraftProduct[]
}

const STORAGE_KEY = 'pinned-draft'

function newId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyDraft(): DraftStore {
  return {
    storeName: '',
    storeType: null,
    floorPlanUrl: null,
    templateId: null,
    scan: null,
    floorPlan: null,
    products: [],
  }
}

export function loadDraft(): DraftStore {
  if (typeof window === 'undefined') return emptyDraft()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyDraft()
    return JSON.parse(raw) as DraftStore
  } catch {
    return emptyDraft()
  }
}

export function saveDraft(draft: DraftStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota errors
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function draftProductFromName(name: string): DraftProduct {
  return {
    id: newId(),
    name,
    x_pct: null,
    y_pct: null,
    tagged: false,
    aisle_label: null,
  }
}

export function draftToStoreLike(draft: DraftStore) {
  let floorPlan = draft.floorPlan
  if (!floorPlan && draft.scan?.bounds) {
    floorPlan = roomScanToFloorPlan(draft.scan, {
      id: 'draft-scan',
      label: draft.storeName || 'Scanned store',
      storeType: draft.storeType ?? 'grocery',
    })
  }
  return {
    id: 'draft',
    name: draft.storeName,
    floor_plan_url: draft.floorPlanUrl,
    floor_plan: floorPlan,
    qr_slug: 'preview',
    owner_email: '',
    created_at: new Date().toISOString(),
    primary_color: null,
    logo_url: null,
    store_type: draft.storeType,
  }
}

export function draftProductsToMatchable(draft: DraftStore) {
  return draft.products.map(p => ({
    id: p.id,
    name: p.name,
    x_pct: p.x_pct,
    y_pct: p.y_pct,
    tagged: p.tagged,
    aisle_label: p.aisle_label,
  }))
}

export function countTagged(draft: DraftStore): number {
  return draft.products.filter(p => p.tagged && p.x_pct != null).length
}
