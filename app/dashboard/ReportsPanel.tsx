'use client'

import { useEffect, useState } from 'react'
import type { CustomerReport, ReportType } from '@/types'

const TYPE_LABELS: Record<ReportType, string> = {
  missing: 'Not here',
  out_of_stock: 'Out of stock',
  other: 'Problem',
}

interface Props {
  storeId: string
  pin?: string
}

export default function ReportsPanel({ storeId, pin }: Props) {
  const [reports, setReports] = useState<CustomerReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = pin
      ? `/api/reports?storeId=${storeId}&pin=${encodeURIComponent(pin)}&status=open`
      : `/api/reports?storeId=${storeId}&status=open`

    fetch(url)
      .then(r => (r.ok ? r.json() : { reports: [] }))
      .then(data => {
        setReports(data.reports ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [storeId, pin])

  async function resolveReport(reportId: string) {
    const res = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, storeId, status: 'resolved', pin }),
    })
    if (res.ok) {
      setReports(prev => prev.filter(r => r.id !== reportId))
    }
  }

  if (loading) return null

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Customer reports</p>
        {reports.length > 0 && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">
            {reports.length} open
          </span>
        )}
      </div>
      {!reports.length ? (
        <p className="text-sm text-muted">No open reports — all clear.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map(r => (
            <li key={r.id} className="rounded-xl border border-border bg-elevated px-4 py-3 text-sm">
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
  )
}
