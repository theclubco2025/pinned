import type { FloorPlan } from './types'
import { getFloorPlan } from './templates'
import type { Store } from '@/types'

/**
 * Prefer a persisted LiDAR-derived floor plan; fall back to the store-type template.
 */
export function resolveStorePlan(
  store: Pick<Store, 'floor_plan' | 'store_type'>,
  templateId?: string | null
): FloorPlan | null {
  if (store.floor_plan && typeof store.floor_plan === 'object' && store.floor_plan.viewBox) {
    return store.floor_plan as FloorPlan
  }
  return getFloorPlan(templateId ?? store.store_type ?? null) ?? null
}
