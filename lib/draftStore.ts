import type { StarterPackId } from '@/lib/starterPacks'

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
  products: DraftProduct[]
}

const STORAGE_KEY = 'pinned-draft'

function newId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyDraft(): DraftStore {
  return { storeName: '', storeType: null, floorPlanUrl: null, templateId: null, products: [] }
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
  return {
    id: 'draft',
    name: draft.storeName,
    floor_plan_url: draft.floorPlanUrl,
    qr_slug: 'preview',
    owner_email: '',
    created_at: new Date().toISOString(),
    primary_color: null,
    logo_url: null,
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
