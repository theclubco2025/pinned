'use client'

import { useState } from 'react'
import type { Store } from '@/types'

export default function StaffPinPanel({ store }: { store: Store }) {
  const [pin, setPin] = useState(store.staff_pin ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/stores/staff-pin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffPin: pin }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const staffUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/staff?storeId=${store.id}`
    : ''

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-2 text-sm font-medium">Staff mode</p>
      <p className="mb-4 text-xs text-muted">Set a PIN so staff can see unmatched customer questions.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="4–6 digit PIN"
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || pin.length < 4}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {saved ? 'Saved' : saving ? '…' : 'Save'}
        </button>
      </div>
      {pin.length >= 4 && (
        <p className="mt-3 break-all text-xs text-faint">
          Staff link: {staffUrl}
        </p>
      )}
    </div>
  )
}
