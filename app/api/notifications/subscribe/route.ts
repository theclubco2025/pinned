import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { subscription } = body as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  }

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 })

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      store_id: store.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'store_id,endpoint' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
