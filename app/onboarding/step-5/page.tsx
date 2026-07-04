'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Store } from '@/types'

export default function Step5Page() {
  const [store, setStore] = useState<Store | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrReady, setQrReady] = useState(false)

  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(d => setStore(d.store ?? null))
  }, [])

  useEffect(() => {
    if (!store) return

    const storeUrl = `${window.location.origin}/${store.qr_slug}`

    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, storeUrl, { width: 240, margin: 2 }, () => {
        setQrReady(true)
      })
    })
  }, [store])

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">Loading…</p>
      </main>
    )
  }

  const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/${store.qr_slug}` : ''

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-4xl">🎉</div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Step 5 of 5</p>
        <h1 className="mb-2 text-2xl font-bold">You're live!</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Print this QR code and post it around <span className="font-medium text-zinc-900">{store.name}</span>.
          Customers scan to ask where anything is.
        </p>

        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm">
            <canvas ref={canvasRef} className={qrReady ? '' : 'opacity-0'} />
            {!qrReady && (
              <div className="flex h-60 w-60 items-center justify-center">
                <p className="text-sm text-zinc-400">Generating QR…</p>
              </div>
            )}
          </div>
        </div>

        <p className="mb-6 break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600">
          {storeUrl}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to dashboard →
          </Link>
          <Link
            href="/onboarding/step-4"
            className="w-full text-sm text-zinc-400 underline underline-offset-2"
          >
            Keep tagging products
          </Link>
        </div>
      </div>
    </main>
  )
}
