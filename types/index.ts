import type { FloorPlan } from '@/lib/floorPlans/types'
import type { RoomScan } from '@/lib/scan/types'

export interface Store {
  id: string
  name: string
  floor_plan_url: string | null
  floor_plan?: FloorPlan | null
  floor_scan?: RoomScan | null
  store_type?: string | null
  qr_slug: string
  owner_email: string
  created_at: string
  staff_pin?: string | null
  primary_color?: string | null
  logo_url?: string | null
}

export interface Product {
  id: string
  store_id: string
  name: string
  aisle_label: string | null
  category?: string | null
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
  in_stock?: boolean
  updated_at: string
}

export type ReportType = 'missing' | 'out_of_stock' | 'other'
export type ReportStatus = 'open' | 'resolved'

export interface CustomerReport {
  id: string
  store_id: string
  product_id: string | null
  type: ReportType
  note: string | null
  status: ReportStatus
  created_at: string
  product_name?: string | null
}

export interface QueryLog {
  id: string
  store_id: string
  question: string
  matched_product_id: string | null
  created_at: string
}
