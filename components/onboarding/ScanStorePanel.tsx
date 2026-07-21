'use client'

import { useState, useSyncExternalStore } from 'react'
import { getScanCapability, requestStoreScan, type ScanCapability } from '@/lib/scan/capability'
import type { RoomScan } from '@/lib/scan/types'

interface Props {
  onScanned?: (scan: RoomScan) => void
}

// Capability can't change during a session — cache a stable snapshot so
// useSyncExternalStore doesn't loop, and SSR renders the neutral "checking" UI.
let cachedCap: ScanCapability | null = null
function capSnapshot(): ScanCapability {
  if (!cachedCap) cachedCap = getScanCapability()
  return cachedCap
}
const noopSubscribe = () => () => {}

export default function ScanStorePanel({ onScanned }: Props) {
  const cap = useSyncExternalStore<ScanCapability | null>(
    noopSubscribe,
    capSnapshot,
    () => null
  )
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  async function handleScan() {
    setScanning(true)
    setError('')
    try {
      const scan = await requestStoreScan()
      onScanned?.(scan)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    }
    setScanning(false)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative border-b border-border bg-gradient-to-br from-accent/15 via-transparent to-transparent px-5 py-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          LiDAR
        </span>
        <h3 className="mt-3 text-lg font-semibold text-foreground">Scan your real store</h3>
        <p className="mt-1 text-sm text-muted">
          Walk the aisles once. LiDAR maps your exact layout — real walls, real fixtures — into a
          precise, tappable store map. No templates, no guesswork.
        </p>
      </div>

      <div className="px-5 py-5">
        {cap?.supported ? (
          <>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {scanning ? 'Scanning your store…' : 'Start LiDAR scan'}
            </button>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-3">
              <span className="text-lg"></span>
              <p className="text-sm text-muted">{cap?.reason ?? 'Checking device…'}</p>
            </div>
            <p className="text-xs text-faint">
              For now, pick a template or upload a photo above — you can switch to a LiDAR scan the
              moment it&apos;s available, and your products carry over automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
