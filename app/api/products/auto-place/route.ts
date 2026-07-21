import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getFloorPlan } from '@/lib/floorPlans/templates'
import { autoPlaceProducts } from '@/lib/floorPlans/autoPlace'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { storeId, storeType, products } = body as {
    storeId: string
    storeType?: string | null
    products: { id: string; name: string }[]
  }

  if (!storeId || !products?.length) {
    return NextResponse.json({ error: 'Missing storeId or products' }, { status: 400 })
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id, store_type')
    .eq('id', storeId)
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const plan = getFloorPlan(storeType ?? store.store_type ?? 'grocery')
  if (!plan) {
    return NextResponse.json({ error: 'No structured floor plan for this store type' }, { status: 400 })
  }

  const suggestions = autoPlaceProducts(plan, products)

  for (const s of suggestions) {
    await supabase
      .from('products')
      .update({
        x_pct: s.x_pct,
        y_pct: s.y_pct,
        tagged: true,
        aisle_label: s.aisle_label,
        category: s.zoneId,
      })
      .eq('id', s.productId)
      .eq('store_id', storeId)
  }

  return NextResponse.json({ placed: suggestions.length, suggestions })
}
