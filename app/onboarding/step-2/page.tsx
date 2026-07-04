'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FloorPlanUpload from '@/components/onboarding/FloorPlanUpload'

export default function Step2Page() {
  const router = useRouter()
  const [storeName, setStoreName] = useState('')
  const [storeId, setStoreId] = useState<string | null>(null)
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null)
  const [creatingStore, setCreatingStore] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault()
    if (!storeName.trim()) return
    setCreatingStore(true)
    setError('')

    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: storeName.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Could not create store')
    } else {
      setStoreId(data.store.id)
    }
    setCreatingStore(false)
  }

  function handleNext() {
    router.push('/onboarding/step-3')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Step 2 of 5</p>
        <h1 className="mb-6 text-2xl font-bold">Set up your store</h1>

        {!storeId ? (
          <form onSubmit={handleCreateStore} className="flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700">Store name</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder="e.g. Sullivan's Grocery"
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={creatingStore || !storeName.trim()}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
            >
              {creatingStore ? 'Creating…' : 'Create store'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-400">Store created</p>
              <p className="font-medium">{storeName}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Upload your floor plan
              </label>
              <FloorPlanUpload
                storeId={storeId}
                onUploaded={url => setFloorPlanUrl(url)}
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!floorPlanUrl}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
            >
              Next: Add products →
            </button>
            {!floorPlanUrl && (
              <button
                onClick={handleNext}
                className="w-full text-center text-sm text-zinc-400 underline underline-offset-2"
              >
                Skip floor plan for now
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
