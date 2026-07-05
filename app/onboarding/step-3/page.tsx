'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Store } from '@/types'

export default function Step3Page() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(d => setStore(d.store ?? null))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!store || !text.trim()) return

    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    if (!lines.length) return

    setSaving(true)
    setError('')

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id, lines }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Could not save products')
    } else {
      router.push('/onboarding/step-4')
    }
    setSaving(false)
  }

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-faint">Loading…</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 3 of 5</p>
        <h1 className="mb-2 text-2xl font-bold">Add your products</h1>
        <p className="mb-6 text-sm text-muted">
          One product per line. Copy-paste from a spreadsheet or just type them in.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"Whole milk\nOrganic eggs\nSourdough bread\nCheddar cheese"}
            rows={12}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-foreground resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving…' : `Save products & start tagging →`}
          </button>
        </form>
      </div>
    </main>
  )
}
