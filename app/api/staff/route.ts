import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { storeId, pin } = body as { storeId: string; pin: string }

  if (!storeId || !pin) {
    return NextResponse.json({ error: 'Missing storeId or pin' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('staff_pin')
    .eq('id', storeId)
    .single()

  if (!store?.staff_pin || store.staff_pin !== pin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId')
  const pin = searchParams.get('pin')

  if (!storeId || !pin) {
    return NextResponse.json({ error: 'Missing storeId or pin' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('staff_pin, name')
    .eq('id', storeId)
    .single()

  if (!store?.staff_pin || store.staff_pin !== pin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: queries } = await supabase
    .from('queries')
    .select('question, matched_product_id, created_at')
    .eq('store_id', storeId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  const unmatched = (queries ?? []).filter(q => !q.matched_product_id)

  const { data: reports } = await supabase
    .from('customer_reports')
    .select('id, store_id, product_id, type, note, status, created_at, products!left(name)')
    .eq('store_id', storeId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const mappedReports = (reports ?? []).map(row => {
    const products = row.products as { name: string } | { name: string }[] | null
    const productName = Array.isArray(products) ? products[0]?.name : products?.name
    return {
      id: row.id,
      store_id: row.store_id,
      product_id: row.product_id,
      type: row.type,
      note: row.note,
      status: row.status,
      created_at: row.created_at,
      product_name: productName ?? null,
    }
  })

  return NextResponse.json({
    storeName: store.name,
    unmatched,
    reports: mappedReports,
    totalToday: queries?.length ?? 0,
  })
}
