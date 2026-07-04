import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import CustomerView from './CustomerView'
import type { Store } from '@/types'

export default async function StorePage({
  params,
}: {
  params: Promise<{ qr_slug: string }>
}) {
  const { qr_slug } = await params

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('qr_slug', qr_slug)
    .single()

  if (!store) notFound()

  return <CustomerView store={store as Store} />
}
