import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 7)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, storeType } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  // Check if store already exists for this user
  const { data: existing } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_email', user.email!)
    .single()

  if (existing) {
    return NextResponse.json({ store: existing })
  }

  const { data: store, error } = await supabase
    .from('stores')
    .insert({
      name: name.trim(),
      owner_email: user.email!,
      qr_slug: slugify(name.trim()),
      store_type: storeType ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ store })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_email', user.email!)
    .single()

  return NextResponse.json({ store: store ?? null })
}
