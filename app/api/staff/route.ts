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

  return NextResponse.json({
    storeName: store.name,
    unmatched,
    totalToday: queries?.length ?? 0,
  })
}
