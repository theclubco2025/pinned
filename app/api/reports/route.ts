import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { ReportStatus, ReportType } from '@/types'

const REPORT_LABELS: Record<ReportType, string> = {
  missing: 'Item not here',
  out_of_stock: 'Out of stock',
  other: 'Problem reported',
}

async function verifyStaffPin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  pin: string
) {
  const { data: store } = await supabase
    .from('stores')
    .select('staff_pin, name')
    .eq('id', storeId)
    .single()
  if (!store?.staff_pin || store.staff_pin !== pin) return null
  return store
}

async function verifyOwnerStore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('id', storeId)
    .eq('owner_email', user.email!)
    .single()
  return store
}

async function sendReportPush(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  storeName: string,
  type: ReportType,
  productName: string | null
) {
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@pinned.app'
  if (!vapidPrivate || !vapidPublic) return

  try {
    const webpush = await import('web-push')
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('store_id', storeId)

    const label = REPORT_LABELS[type]
    const detail = productName ? `${productName} — ${label}` : label
    const payload = JSON.stringify({
      title: `${storeName}: customer report`,
      body: detail,
    })

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch {
        // subscription expired
      }
    }
  } catch {
    // push not configured
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { storeId, productId, type, note } = body as {
    storeId: string
    productId?: string | null
    type: ReportType
    note?: string
  }

  if (!storeId || !type || !['missing', 'out_of_stock', 'other'].includes(type)) {
    return NextResponse.json({ error: 'Missing or invalid storeId/type' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: store } = await supabase.from('stores').select('id, name').eq('id', storeId).single()
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  let productName: string | null = null
  if (productId) {
    const { data: product } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single()
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    productName = product.name
  }

  const { data: report, error } = await supabase
    .from('customer_reports')
    .insert({
      store_id: storeId,
      product_id: productId ?? null,
      type,
      note: note?.trim() || null,
      status: 'open',
    })
    .select('id, store_id, product_id, type, note, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'out_of_stock' && productId) {
    await supabase.from('products').update({ in_stock: false }).eq('id', productId).eq('store_id', storeId)
  }

  await sendReportPush(supabase, storeId, store.name, type, productName)

  return NextResponse.json({ ok: true, report: { ...report, product_name: productName } })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId')
  const pin = searchParams.get('pin')
  const statusParam = searchParams.get('status') ?? 'open'

  if (!storeId) {
    return NextResponse.json({ error: 'Missing storeId' }, { status: 400 })
  }

  const supabase = await createClient()

  let authorized = false
  if (pin) {
    authorized = !!(await verifyStaffPin(supabase, storeId, pin))
  } else {
    authorized = !!(await verifyOwnerStore(supabase, storeId))
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('customer_reports')
    .select('id, store_id, product_id, type, note, status, created_at, products!left(name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (statusParam !== 'all') {
    query = query.eq('status', statusParam)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reports = (data ?? []).map(row => {
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

  return NextResponse.json({ reports })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { reportId, status, storeId, pin } = body as {
    reportId: string
    status: ReportStatus
    storeId: string
    pin?: string
  }

  if (!reportId || !storeId || status !== 'resolved') {
    return NextResponse.json({ error: 'Missing reportId, storeId, or invalid status' }, { status: 400 })
  }

  const supabase = await createClient()

  let authorized = false
  if (pin) {
    authorized = !!(await verifyStaffPin(supabase, storeId, pin))
  } else {
    authorized = !!(await verifyOwnerStore(supabase, storeId))
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('customer_reports')
    .update({ status: 'resolved' })
    .eq('id', reportId)
    .eq('store_id', storeId)
    .select('id, status')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Report not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, report: data })
}
