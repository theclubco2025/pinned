'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CustomerView from '@/app/[qr_slug]/CustomerView'
import QRPoster from '@/components/dashboard/QRPoster'
import AccountGate from '@/components/onboarding/AccountGate'
import {
  loadDraft,
  clearDraft,
  draftToStoreLike,
  emptyDraft,
  type DraftStore,
} from '@/lib/draftStore'
import type { Store } from '@/types'

export default function Step5Page() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [draft, setDraft] = useState<DraftStore>(emptyDraft())
  const [draftMode, setDraftMode] = useState(true)
  const [persisting, setPersisting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(loadDraft())
  }, [])

  useEffect(() => {
    fetch('/api/stores')
      .then(r => (r.ok ? r.json() : { store: null }))
      .then(data => {
        if (data.store) {
          setStore(data.store)
          setDraftMode(false)
        }
      })
  }, [])

  async function persistDraft() {
    const d = loadDraft()
    if (!d.storeName.trim()) return
    setPersisting(true)
    setError('')

    try {
      const res = await fetch('/api/draft/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: d.storeName,
          floorPlanUrl: d.floorPlanUrl,
          storeType: d.storeType,
          templateId: d.templateId,
          products: d.products,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not save store')
        setPersisting(false)
        return
      }
      clearDraft()
      setStore(data.store)
      setDraftMode(false)
      router.refresh()
    } catch {
      setError('Something went wrong saving your store')
    }
    setPersisting(false)
  }

  async function copyLink() {
    if (!store) return
    await navigator.clipboard.writeText(`${window.location.origin}/${store.qr_slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewStore = draftMode
    ? draftToStoreLike(draft)
    : store

  const storeUrl = store
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${store.qr_slug}`
    : ''

  if (!previewStore) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-faint">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="text-center">
          <div className="mb-4 text-4xl">🎉</div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 4 of 5 · You&apos;re live</p>
          <h1 className="text-2xl font-bold">{previewStore.name} is ready!</h1>
          <p className="mt-2 text-sm text-muted">
            Try it below — then {draftMode ? 'create an account to save' : 'print your QR and post it by the entrance'}.
          </p>
        </div>

        <CustomerView
          store={previewStore}
          products={draft.products}
          draftMode={draftMode}
          templateId={draft.templateId ?? draft.storeType}
          compact
        />

        {draftMode ? (
          <AccountGate onSuccess={persistDraft} />
        ) : (
          <>
            {store && (
              <>
                <QRPoster storeName={store.name} storeUrl={storeUrl} />
                <button
                  type="button"
                  onClick={copyLink}
                  className="w-full break-all rounded-lg border border-border bg-elevated px-3 py-2 font-mono text-xs text-muted hover:text-foreground"
                >
                  {copied ? '✓ Copied to clipboard' : storeUrl}
                </button>
              </>
            )}
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="w-full rounded-xl bg-foreground py-3 text-center text-sm font-medium text-background hover:opacity-90"
              >
                Go to dashboard →
              </Link>
              <Link href="/onboarding/step-4" className="text-center text-sm text-faint underline">
                Keep tagging products
              </Link>
            </div>
          </>
        )}

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        {persisting && <p className="text-center text-sm text-muted">Saving your store…</p>}
      </div>
    </main>
  )
}
