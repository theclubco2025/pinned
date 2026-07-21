'use client'

import { useState } from 'react'
import type { ReportType } from '@/types'

interface Props {
  storeId: string
  productId: string | null
  productName?: string | null
  draftMode?: boolean
}

export default function CustomerReportActions({
  storeId,
  productId,
  productName,
  draftMode = false,
}: Props) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  async function submit(type: ReportType, withNote?: string) {
    if (draftMode) {
      setConfirmation('Thanks — we would notify the team in live mode.')
      return
    }
    setSubmitting(true)
    setConfirmation('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          productId,
          type,
          note: withNote?.trim() || undefined,
        }),
      })
      if (res.ok) {
        setConfirmation('Thanks — we told the team.')
        setShowNote(false)
        setNote('')
      } else {
        setConfirmation('Could not send report. Try again or ask staff.')
      }
    } catch {
      setConfirmation('Could not send report. Try again or ask staff.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fade-rise mt-3 space-y-2">
      <p className="text-xs text-faint">
        {productName ? `Looking for ${productName}?` : 'Something wrong?'} Let the team know:
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit('missing')}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-400/50 hover:text-foreground disabled:opacity-50"
        >
          Not here
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit('out_of_stock')}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-amber-400/50 hover:text-foreground disabled:opacity-50"
        >
          Out of stock
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => setShowNote(v => !v)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
        >
          Report a problem
        </button>
      </div>
      {showNote && (
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What went wrong?"
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-foreground"
          />
          <button
            type="button"
            disabled={submitting || !note.trim()}
            onClick={() => submit('other', note)}
            className="shrink-0 rounded-xl bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
      {confirmation && <p className="text-xs text-accent">{confirmation}</p>}
    </div>
  )
}
