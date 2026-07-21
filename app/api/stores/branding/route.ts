import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { primaryColor, logoUrl } = body as { primaryColor?: string; logoUrl?: string }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 })

  const update: Record<string, string | null> = {}
  if (primaryColor !== undefined) update.primary_color = primaryColor || null
  if (logoUrl !== undefined) update.logo_url = logoUrl || null

  const { error } = await supabase.from('stores').update(update).eq('id', store.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 })

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `logos/${store.id}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('pinned-assets')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('pinned-assets').getPublicUrl(path)
  await supabase.from('stores').update({ logo_url: publicUrl }).eq('id', store.id)

  return NextResponse.json({ url: publicUrl })
}
