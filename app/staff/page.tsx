'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function StaffContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get('storeId') ?? ''
  const [pin, setPin] = useState('')
  const [verified, setVerified] = useState(false)
  const [data, setData] = useState<{
    storeName: string
    unmatched: { question: string; created_at: string }[]
    totalToday: number
  } | null>(null)
  const [error, setError] = useState('')

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/staff?storeId=${storeId}&pin=${encodeURIComponent(pin)}`)
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Invalid PIN')
      return
    }
    setData(json)
    setVerified(true)
  }

  if (!storeId) {
    return <p className="text-muted">Missing store ID.</p>
  }

  if (!verified) {
    return (
      <form onSubmit={verify} className="mx-auto max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Staff mode</h1>
        <p className="text-sm text-muted">Enter your store PIN to see questions the AI couldn&apos;t answer today.</p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Store PIN"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-foreground"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background">
          Enter
        </button>
      </form>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold">{data?.storeName}</h1>
        <p className="text-sm text-muted">{data?.totalToday ?? 0} questions today</p>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-medium">Unmatched questions</h2>
        {!data?.unmatched.length ? (
          <p className="text-sm text-muted">No unmatched questions today — you&apos;re all caught up.</p>
        ) : (
          <ul className="space-y-2">
            {data.unmatched.map((q, i) => (
              <li key={i} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                {q.question}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function StaffPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <Suspense fallback={<p className="text-faint">Loading…</p>}>
        <StaffContent />
      </Suspense>
    </main>
  )
}
