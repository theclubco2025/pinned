'use client'

import { useEffect, useState } from 'react'

interface Analytics {
  total: number
  last7Days: number
  unmatchedRate: number
  topQuestions: { question: string; count: number }[]
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-4 text-sm font-medium">Customer questions</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-2xl font-bold">{data.total}</p>
          <p className="text-xs text-muted">All time</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{data.last7Days}</p>
          <p className="text-xs text-muted">Last 7 days</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{data.unmatchedRate}%</p>
          <p className="text-xs text-muted">Unmatched</p>
        </div>
      </div>
      {data.topQuestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Top searches</p>
          <ul className="space-y-1">
            {data.topQuestions.map((q, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="truncate text-muted">{q.question}</span>
                <span className="ml-2 shrink-0 text-faint">{q.count}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
