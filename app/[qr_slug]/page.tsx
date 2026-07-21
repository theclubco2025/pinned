import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import CustomerView from './CustomerView'
import type { Product, Store } from '@/types'

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

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('tagged', true)

  return (
    <CustomerView
      store={store as Store}
      products={(products ?? []) as Product[]}
      templateId={store.store_type}
    />
  )
}
