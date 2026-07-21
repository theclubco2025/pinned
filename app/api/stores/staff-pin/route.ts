import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { staffPin } = body as { staffPin: string }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 })

  const { error } = await supabase
    .from('stores')
    .update({ staff_pin: staffPin || null })
    .eq('id', store.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
