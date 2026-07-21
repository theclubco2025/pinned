'use client'

import { useState } from 'react'
import type { Store } from '@/types'

export default function BrandingPanel({ store }: { store: Store }) {
  const [color, setColor] = useState(store.primary_color ?? '#4f46e5')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(store.logo_url)

  async function saveColor() {
    setSaving(true)
    await fetch('/api/stores/branding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primaryColor: color }),
    })
    setSaving(false)
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/stores/branding', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) setLogoUrl(data.url)
    setUploading(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-4 text-sm font-medium">Store branding</p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Accent color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border"
            />
            <button
              type="button"
              onClick={saveColor}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-elevated disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save color'}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Store logo</label>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="mb-2 h-12 object-contain" />
          )}
          <input type="file" accept="image/*" onChange={uploadLogo} disabled={uploading} className="text-sm" />
        </div>
      </div>
    </div>
  )
}
