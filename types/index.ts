export interface Store {
  id: string
  name: string
  floor_plan_url: string | null
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
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
  updated_at: string
}

export interface QueryLog {
  id: string
  store_id: string
  question: string
  matched_product_id: string | null
  created_at: string
}
