import type { StarterPackId } from '@/lib/starterPacks'

export interface ZoneRect {
  x: number
  y: number
  w: number
  h: number
}

export interface Zone {
  id: string
  label: string
  category: string
  rect: ZoneRect
  color: string
}

export interface FloorPlan {
  id: string
  label: string
  storeType: StarterPackId
  viewBox: { w: number; h: number }
  entrance: { x: number; y: number }
  checkout?: ZoneRect
  restrooms?: ZoneRect
  zones: Zone[]
}

export interface MapPin {
  x_pct: number
  y_pct: number
  label?: string
  active?: boolean
}

export interface RoutePoint {
  x: number
  y: number
}
