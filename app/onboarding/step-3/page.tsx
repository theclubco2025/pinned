'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadDraft,
  saveDraft,
  draftProductFromName,
  emptyDraft,
  type DraftStore,
} from '@/lib/draftStore'
import { parseProducts, parseCsvProducts } from '@/lib/parseProducts'
import { STARTER_PACKS } from '@/lib/starterPacks'
import type { Store } from '@/types'

export default function Step3Page() {
  const router = useRouter()
  const [draft] = useState<DraftStore>(() =>
    typeof window !== 'undefined' ? loadDraft() : emptyDraft()
  )
  const [store, setStore] = useState<Store | null>(null)
  const [text, setText] = useState(() => {
    if (typeof window === 'undefined') return ''
    const d = loadDraft()
    return d.products.length ? d.products.map(p => p.name).join('\n') : ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const csvRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/stores')
      .then(r => (r.ok ? r.json() : { store: null }))
      .then(data => {
        if (data.store) {
          setStore(data.store)
          setAuthenticated(true)
        }
      })
      .catch(() => {})
  }, [])

  function applyStarterPack(id: string) {
    const pack = STARTER_PACKS.find(p => p.id === id)
    if (pack) setText(pack.products.join('\n'))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const lines = parseProducts(text)
    if (!lines.length) return

    setSaving(true)
    setError('')

    if (authenticated && store) {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, lines }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not save products')
        setSaving(false)
        return
      }
    } else {
      const d = loadDraft()
      const next: DraftStore = {
        ...d,
        products: lines.map(name => draftProductFromName(name)),
      }
      saveDraft(next)
    }

    router.push('/onboarding/step-4')
    setSaving(false)
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const names = parseCsvProducts(reader.result as string)
      if (names.length) setText(names.join('\n'))
    }
    reader.readAsText(file)
  }

  if (!draft.storeName.trim() && !text.trim()) {
    // first visit ok
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 2 of 5</p>
        <h1 className="mb-2 text-2xl font-bold">Add your products</h1>
        <p className="mb-4 text-sm text-muted">One per line, import CSV, or start from a category pack.</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {STARTER_PACKS.map(pack => (
            <button
              key={pack.id}
              type="button"
              onClick={() => applyStarterPack(pack.id)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-foreground hover:text-foreground"
            >
              {pack.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'Whole milk\nOrganic eggs\nSourdough bread'}
            rows={12}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm outline-none focus:border-foreground"
          />
          <p className="text-xs text-faint">{parseProducts(text).length} products detected</p>

          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFile} />
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-elevated"
          >
            Import CSV
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save products & start tagging →'}
          </button>
        </form>
      </div>
    </main>
  )
}
