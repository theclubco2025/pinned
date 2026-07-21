'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CustomerReport, ReportType } from '@/types'

const TYPE_LABELS: Record<ReportType, string> = {
  missing: 'Not here',
  out_of_stock: 'Out of stock',
  other: 'Problem',
}

function StaffContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get('storeId') ?? ''
  const [pin, setPin] = useState('')
  const [verified, setVerified] = useState(false)
  const [data, setData] = useState<{
    storeName: string
    unmatched: { question: string; created_at: string }[]
    reports: CustomerReport[]
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

  async function resolveReport(reportId: string) {
    const res = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, storeId, status: 'resolved', pin }),
    })
    if (res.ok && data) {
      setData({
        ...data,
        reports: data.reports.filter(r => r.id !== reportId),
      })
    }
  }

  if (!storeId) {
    return <p className="text-muted">Missing store ID.</p>
  }

  if (!verified) {
    return (
      <form onSubmit={verify} className="mx-auto max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Staff mode</h1>
        <p className="text-sm text-muted">Enter your store PIN to see customer questions and reports.</p>
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
        <h2 className="mb-3 text-sm font-medium">Customer reports</h2>
        {!data?.reports.length ? (
          <p className="text-sm text-muted">No open reports — all clear.</p>
        ) : (
          <ul className="space-y-2">
            {data.reports.map(r => (
              <li key={r.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{TYPE_LABELS[r.type]}</p>
                    {r.product_name && <p className="text-muted">{r.product_name}</p>}
                    {r.note && <p className="mt-1 text-xs text-faint">{r.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => resolveReport(r.id)}
                    className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
                  >
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
