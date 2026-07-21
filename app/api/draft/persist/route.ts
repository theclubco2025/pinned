import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 7)
  )
}

interface DraftProductPayload {
  name: string
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
  aisle_label: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { storeName, floorPlanUrl, storeType, templateId, products } = body as {
    storeName: string
    floorPlanUrl: string | null
    storeType?: string | null
    templateId?: string | null
    products: DraftProductPayload[]
  }

  if (!storeName?.trim()) {
    return NextResponse.json({ error: 'Store name required' }, { status: 400 })
  }

  let storeId: string
  let qrSlug: string

  const { data: existing } = await supabase
    .from('stores')
    .select('id, qr_slug')
    .eq('owner_email', user.email!)
    .single()

  if (existing) {
    storeId = existing.id
    qrSlug = existing.qr_slug
    await supabase.from('stores').update({ name: storeName.trim() }).eq('id', storeId)
    if (storeType ?? templateId) {
      await supabase
        .from('stores')
        .update({ store_type: storeType ?? templateId ?? null })
        .eq('id', storeId)
    }
  } else {
    qrSlug = slugify(storeName.trim())
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        name: storeName.trim(),
        owner_email: user.email!,
        qr_slug: qrSlug,
        store_type: storeType ?? templateId ?? null,
      })
      .select()
      .single()

    if (storeError) return NextResponse.json({ error: storeError.message }, { status: 500 })
    storeId = newStore.id
  }

  if (floorPlanUrl) {
    let publicUrl = floorPlanUrl

    if (floorPlanUrl.startsWith('data:')) {
      const match = floorPlanUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        const contentType = match[1]
        const buffer = Buffer.from(match[2], 'base64')
        const ext = contentType.includes('png') ? 'png' : 'jpg'
        const path = `floor-plans/${storeId}.${ext}`
        await supabase.storage.from('pinned-assets').upload(path, buffer, {
          contentType,
          upsert: true,
        })
        const { data: { publicUrl: url } } = supabase.storage.from('pinned-assets').getPublicUrl(path)
        publicUrl = url
      } else if (floorPlanUrl.startsWith('data:image/svg+xml,')) {
        const svg = decodeURIComponent(floorPlanUrl.replace('data:image/svg+xml,', ''))
        const path = `floor-plans/${storeId}.svg`
        await supabase.storage.from('pinned-assets').upload(path, svg, {
          contentType: 'image/svg+xml',
          upsert: true,
        })
        const { data: { publicUrl: url } } = supabase.storage.from('pinned-assets').getPublicUrl(path)
        publicUrl = url
      }
    }

    await supabase.from('stores').update({ floor_plan_url: publicUrl }).eq('id', storeId)
  }

  await supabase.from('products').delete().eq('store_id', storeId)

  if (products?.length) {
    const rows = products.map(p => ({
      store_id: storeId,
      name: p.name,
      x_pct: p.x_pct,
      y_pct: p.y_pct,
      tagged: p.tagged,
      aisle_label: p.aisle_label,
    }))

    const { error: prodError } = await supabase.from('products').insert(rows)
    if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 })
  }

  const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single()
  return NextResponse.json({ store })
}
