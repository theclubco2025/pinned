import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { storeId, lines } = body as { storeId: string; lines: string[] }

  if (!storeId || !lines?.length) {
    return NextResponse.json({ error: 'Missing storeId or lines' }, { status: 400 })
  }

  // Verify ownership
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const rows = lines
    .map(l => l.trim())
    .filter(Boolean)
    .map(name => ({ store_id: storeId, name, tagged: false }))

  const { data: products, error } = await supabase
    .from('products')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) return NextResponse.json({ error: 'Missing storeId' }, { status: 400 })

  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('updated_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: products ?? [] })
}
