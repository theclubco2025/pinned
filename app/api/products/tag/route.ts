import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { productId, x_pct, y_pct, skip } = body as {
    productId: string
    x_pct?: number
    y_pct?: number
    skip?: boolean
  }

  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  const update = skip
    ? { tagged: true, updated_at: new Date().toISOString() }
    : { x_pct, y_pct, tagged: true, updated_at: new Date().toISOString() }

  const { error } = await supabase
    .from('products')
    .update(update)
    .eq('id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
