import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { Product, Store } from '@/types'
import DashboardQR from './DashboardQR'
import ThemeToggle from '@/components/ThemeToggle'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/onboarding')

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_email', user.email!)
    .single()

  if (!store) redirect('/onboarding/step-2')

  const { data: products } = await supabase
    .from('products')
    .select('id, tagged')
    .eq('store_id', store.id)

  const total = products?.length ?? 0
  const tagged = products?.filter((p: Pick<Product, 'id' | 'tagged'>) => p.tagged).length ?? 0

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{(store as Store).name}</h1>
            <p className="text-sm text-muted">Your Pinned dashboard</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-3xl font-bold">{total}</p>
            <p className="mt-1 text-sm text-muted">Products</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-3xl font-bold">{tagged}</p>
            <p className="mt-1 text-sm text-muted">Tagged</p>
          </div>
        </div>

        <DashboardQR store={store as Store} />

        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding/step-4"
            className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-elevated"
          >
            <div>
              <p className="font-medium">Tag products</p>
              <p className="text-sm text-muted">{total - tagged} untagged remaining</p>
            </div>
            <span className="text-faint">→</span>
          </Link>
          <Link
            href="/onboarding/step-2"
            className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-elevated"
          >
            <div>
              <p className="font-medium">Update floor plan</p>
              <p className="text-sm text-muted">{(store as Store).floor_plan_url ? 'Uploaded' : 'Not uploaded'}</p>
            </div>
            <span className="text-faint">→</span>
          </Link>
          <Link
            href={`/${(store as Store).qr_slug}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-elevated"
          >
            <div>
              <p className="font-medium">Preview customer view</p>
              <p className="text-sm text-muted">/{(store as Store).qr_slug}</p>
            </div>
            <span className="text-faint">→</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
