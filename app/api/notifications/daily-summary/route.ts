import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@pinned.app'

  if (!vapidPrivate || !vapidPublic) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 503 })
  }

  const webpush = await import('web-push')
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const supabase = await createClient()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: stores } = await supabase.from('stores').select('id, name')

  let sent = 0
  for (const store of stores ?? []) {
    const { count } = await supabase
      .from('queries')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .gte('created_at', yesterday.toISOString())

    if (!count || count === 0) continue

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('store_id', store.id)

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: 'Pinned daily summary',
            body: `${count} shopper${count === 1 ? '' : 's'} used your map today at ${store.name}`,
          })
        )
        sent++
      } catch {
        // subscription expired — ignore
      }
    }
  }

  return NextResponse.json({ sent })
}
