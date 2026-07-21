'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloorPlanUpload from '@/components/onboarding/FloorPlanUpload'
import FloorPlanTemplates from '@/components/onboarding/FloorPlanTemplates'
import StoreTypePicker from '@/components/onboarding/StoreTypePicker'
import {
  loadDraft,
  saveDraft,
  emptyDraft,
  type DraftStore,
} from '@/lib/draftStore'
import { getTemplate } from '@/lib/floorTemplates'
import type { StarterPackId } from '@/lib/starterPacks'
import { createClient } from '@/lib/supabase-browser'

type FloorMode = 'template' | 'upload'
type Step = 'type' | 'floor'

export default function Step2Page() {
  const router = useRouter()
  const [draft, setDraft] = useState<DraftStore>(() =>
    typeof window !== 'undefined' ? loadDraft() : emptyDraft()
  )
  const [authenticated, setAuthenticated] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(() =>
    typeof window !== 'undefined' && loadDraft().storeType ? 'floor' : 'type'
  )
  const [floorMode, setFloorMode] = useState<FloorMode>('template')
  const [creatingStore, setCreatingStore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setAuthenticated(!!user)
        if (user) {
          fetch('/api/stores')
            .then(r => r.json())
            .then(d => {
              if (d.store) {
                setStoreId(d.store.id)
                setDraft(prev => ({
                  ...(prev ?? loadDraft()),
                  storeName: d.store.name,
                  storeType: (d.store.store_type as StarterPackId) ?? prev?.storeType ?? null,
                  floorPlanUrl: d.store.floor_plan_url ?? prev?.floorPlanUrl ?? null,
                  templateId: (d.store.store_type as string) ?? prev?.templateId ?? null,
                }))
              }
            })
        }
      })
  }, [])

  function updateDraft(partial: Partial<DraftStore>) {
    setDraft(prev => {
      const next = { ...(prev ?? loadDraft()), ...partial }
      saveDraft(next)
      return next
    })
  }

  function handleStoreTypeSelect(id: StarterPackId) {
    const template = getTemplate(id)
    updateDraft({
      storeType: id,
      templateId: id,
      floorPlanUrl: template?.url ?? null,
    })
    setStep('floor')
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!draft?.storeName.trim()) return

    if (authenticated) {
      setCreatingStore(true)
      setError('')
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.storeName.trim(),
          storeType: draft.storeType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not create store')
        setCreatingStore(false)
        return
      }
      setStoreId(data.store.id)
      setCreatingStore(false)
    }

    saveDraft(draft)
    router.push('/onboarding/step-3')
  }

  const hasFloor = !!draft.floorPlanUrl || !!draft.templateId

  if (step === 'type') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 1 of 5 · No account needed</p>
          <h1 className="mb-2 text-2xl font-bold">What kind of store?</h1>
          <p className="mb-6 text-sm text-muted">
            We&apos;ll tailor your floor plan and starter products to your store type.
          </p>

          <StoreTypePicker selected={draft.storeType} onSelect={handleStoreTypeSelect} />

          <p className="mt-4 text-center text-sm text-faint">
            Already have an account?{' '}
            <Link href="/onboarding" className="underline hover:text-muted">Log in</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 1 of 5 · No account needed</p>
        <h1 className="mb-2 text-2xl font-bold">Set up your store</h1>
        <p className="mb-6 text-sm text-muted">Name your store and confirm your floor plan.</p>

        <button
          type="button"
          onClick={() => setStep('type')}
          className="mb-4 text-sm text-faint underline underline-offset-2 hover:text-muted"
        >
          ← Change store type
        </button>

        <form onSubmit={handleContinue} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Store name</label>
            <input
              type="text"
              value={draft.storeName}
              onChange={e => updateDraft({ storeName: e.target.value })}
              placeholder="e.g. Sullivan's Grocery"
              required
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>

          <div>
            <div className="mb-2 flex rounded-xl border border-border bg-surface p-1 text-sm">
              <button
                type="button"
                onClick={() => setFloorMode('template')}
                className={`flex-1 rounded-lg py-2 font-medium ${floorMode === 'template' ? 'bg-foreground text-background' : 'text-muted'}`}
              >
                Use a template
              </button>
              <button
                type="button"
                onClick={() => setFloorMode('upload')}
                className={`flex-1 rounded-lg py-2 font-medium ${floorMode === 'upload' ? 'bg-foreground text-background' : 'text-muted'}`}
              >
                Upload photo
              </button>
            </div>

            {floorMode === 'template' ? (
              <FloorPlanTemplates
                selectedId={draft.templateId}
                onSelect={(id, url) => updateDraft({ templateId: id, storeType: id as StarterPackId, floorPlanUrl: url })}
              />
            ) : authenticated && storeId ? (
              <FloorPlanUpload
                storeId={storeId}
                onUploaded={url => updateDraft({ floorPlanUrl: url, templateId: null })}
              />
            ) : (
              <FloorPlanUpload
                draftMode
                onUploaded={url => updateDraft({ floorPlanUrl: url, templateId: null })}
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={creatingStore || !draft.storeName.trim() || !hasFloor}
            className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            {creatingStore ? 'Creating…' : 'Next: Add products →'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-faint">
          Already have an account?{' '}
          <Link href="/onboarding" className="underline hover:text-muted">Log in</Link>
        </p>
      </div>
    </main>
  )
}
