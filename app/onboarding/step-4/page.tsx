'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpeedTagger from '@/components/onboarding/SpeedTagger'
import type { Store, Product } from '@/types'

export default function Step4Page() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const storeRes = await fetch('/api/stores')
      const storeData = await storeRes.json()
      const s: Store = storeData.store
      if (!s) { router.push('/onboarding/step-2'); return }
      setStore(s)

      const prodRes = await fetch(`/api/products?storeId=${s.id}`)
      const prodData = await prodRes.json()
      const untagged = (prodData.products as Product[]).filter(p => !p.tagged)
      setProducts(untagged)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-faint">Loading your floor plan…</p>
      </main>
    )
  }

  if (!store?.floor_plan_url) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-muted">No floor plan uploaded yet.</p>
        <button
          onClick={() => router.push('/onboarding/step-2')}
          className="mt-4 text-sm underline"
        >
          Go back and upload one
        </button>
      </main>
    )
  }

  if (!products.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-muted">All products are already tagged.</p>
        <button
          onClick={() => router.push('/onboarding/step-5')}
          className="mt-4 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          Continue →
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 4 of 5</p>
        <h1 className="mb-2 text-2xl font-bold">Tag each product</h1>
        <p className="mb-6 text-sm text-muted">
          Tap where each item lives on your floor plan. Hit Skip if you're not sure.
        </p>

        <SpeedTagger
          storeId={store.id}
          floorPlanUrl={store.floor_plan_url}
          products={products}
          onComplete={() => router.push('/onboarding/step-5')}
        />
      </div>
    </main>
  )
}
