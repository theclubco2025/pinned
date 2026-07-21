import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { productId, productIds, x_pct, y_pct, aisle_label, skip } = body as {
    productId?: string
    productIds?: string[]
    x_pct?: number
    y_pct?: number
    aisle_label?: string
    skip?: boolean
  }

  const ids = productIds?.length ? productIds : productId ? [productId] : []
  if (!ids.length) return NextResponse.json({ error: 'Missing productId(s)' }, { status: 400 })

  const update = skip
    ? { tagged: true, updated_at: new Date().toISOString() }
    : {
        x_pct,
        y_pct,
        tagged: true,
        updated_at: new Date().toISOString(),
        ...(aisle_label ? { aisle_label } : {}),
      }

  const { error } = await supabase.from('products').update(update).in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
