'use client'

import { useEffect, useRef, useState } from 'react'
import type { Store } from '@/types'

export default function DashboardQR({ store }: { store: Store }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${store.qr_slug}`

  useEffect(() => {
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, storeUrl, { width: 180, margin: 2 }, () => setReady(true))
    })
  }, [storeUrl])

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-3 text-sm font-medium">Customer QR code</p>
      <div className="flex items-center gap-5">
        <div className="shrink-0 rounded-lg bg-white p-2">
          <canvas ref={canvasRef} className={ready ? 'block' : 'hidden'} />
          {!ready && <div className="h-[180px] w-[180px] animate-pulse rounded bg-zinc-100" />}
        </div>
        <div className="min-w-0 space-y-2">
          <p className="break-all font-mono text-xs text-muted">{storeUrl}</p>
          <p className="text-xs text-faint">Print and post near the entrance</p>
        </div>
      </div>
    </div>
  )
}
