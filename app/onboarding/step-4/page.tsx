'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpeedTagger from '@/components/onboarding/SpeedTagger'
import ZoneTagger from '@/components/onboarding/ZoneTagger'
import {
  loadDraft,
  saveDraft,
  countTagged,
  type DraftStore,
  type DraftProduct,
} from '@/lib/draftStore'
import type { Store, Product } from '@/types'

export default function Step4Page() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [draft, setDraft] = useState<DraftStore | null>(null)
  const [products, setProducts] = useState<(Product | DraftProduct)[]>([])
  const [loading, setLoading] = useState(true)
  const [draftMode, setDraftMode] = useState(true)
  const [taggedTotal, setTaggedTotal] = useState(0)
  const [showZone, setShowZone] = useState(false)

  useEffect(() => {
    async function load() {
      const d = loadDraft()
      setDraft(d)

      const storeRes = await fetch('/api/stores')
      if (storeRes.ok) {
        const storeData = await storeRes.json()
        const s: Store = storeData.store
        if (s) {
          setStore(s)
          setDraftMode(false)
          const prodRes = await fetch(`/api/products?storeId=${s.id}`)
          const prodData = await prodRes.json()
          const all = prodData.products as Product[]
          const untagged = all.filter(p => !p.tagged)
          setTaggedTotal(all.filter(p => p.tagged && p.x_pct != null).length)
          setProducts(untagged)
          setLoading(false)
          return
        }
      }

      setDraftMode(true)
      setTaggedTotal(countTagged(d))
      setProducts(d.products.filter(p => !p.tagged))
      setLoading(false)
    }
    load()
  }, [router])

  function handleDraftTag(productId: string, x_pct: number, y_pct: number, aisleLabel?: string) {
    const d = loadDraft()
    const next: DraftStore = {
      ...d,
      products: d.products.map(p =>
        p.id === productId
          ? { ...p, x_pct, y_pct, tagged: true, aisle_label: aisleLabel ?? p.aisle_label }
          : p
      ),
    }
    saveDraft(next)
    setDraft(next)
    setTaggedTotal(countTagged(next))
    setProducts(next.products.filter(p => !p.tagged))
  }

  function handleDraftSkip(productId: string) {
    const d = loadDraft()
    const next: DraftStore = {
      ...d,
      products: d.products.map(p => (p.id === productId ? { ...p, tagged: true } : p)),
    }
    saveDraft(next)
    setDraft(next)
    setTaggedTotal(countTagged(next))
    setProducts(next.products.filter(p => !p.tagged))
  }

  function handleDraftBulkTag(productIds: string[], x_pct: number, y_pct: number, aisleLabel: string) {
    const d = loadDraft()
    const ids = new Set(productIds)
    const next: DraftStore = {
      ...d,
      products: d.products.map(p =>
        ids.has(p.id)
          ? { ...p, x_pct, y_pct, tagged: true, aisle_label: aisleLabel }
          : p
      ),
    }
    saveDraft(next)
    setDraft(next)
    setTaggedTotal(countTagged(next))
    setProducts(next.products.filter(p => !p.tagged))
    setShowZone(false)
  }

  const floorPlanUrl = draftMode ? draft?.floorPlanUrl : store?.floor_plan_url

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-faint">Loading your floor plan…</p>
      </main>
    )
  }

  if (!floorPlanUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-muted">No floor plan yet.</p>
        <button onClick={() => router.push('/onboarding/step-2')} className="mt-4 text-sm underline">
          Go back and add one
        </button>
      </main>
    )
  }

  if (!products.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-muted">All products are tagged.</p>
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
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 3 of 5</p>
        <h1 className="mb-2 text-2xl font-bold">Tag each product</h1>
        <p className="mb-4 text-sm text-muted">
          Tap where each item lives. Tag your top 10 to go live — add the rest anytime.
        </p>

        <button
          type="button"
          onClick={() => setShowZone(z => !z)}
          className="mb-4 text-sm text-faint underline underline-offset-2 hover:text-muted"
        >
          {showZone ? 'Hide bulk zone tagger' : 'Bulk tag by aisle/zone →'}
        </button>

        {showZone && (
          <div className="mb-6">
            <ZoneTagger
              floorPlanUrl={floorPlanUrl}
              products={products}
              draftMode={draftMode}
              onBulkTag={handleDraftBulkTag}
              onComplete={() => {
                if (draftMode) setProducts(loadDraft().products.filter(p => !p.tagged))
                else router.refresh()
              }}
            />
          </div>
        )}

        <SpeedTagger
          storeId={store?.id}
          floorPlanUrl={floorPlanUrl}
          products={products}
          draftMode={draftMode}
          onTag={handleDraftTag}
          onSkip={handleDraftSkip}
          taggedCount={taggedTotal}
          onGoLiveEarly={() => router.push('/onboarding/step-5')}
          onComplete={() => router.push('/onboarding/step-5')}
        />
      </div>
    </main>
  )
}
