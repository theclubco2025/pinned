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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="mb-3 text-sm font-medium">Customer QR code</p>
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <canvas ref={canvasRef} className={ready ? '' : 'opacity-0'} />
          {!ready && <div className="h-[180px] w-[180px] rounded-lg bg-zinc-100 animate-pulse" />}
        </div>
        <div className="min-w-0 space-y-2">
          <p className="break-all font-mono text-xs text-zinc-500">{storeUrl}</p>
          <p className="text-xs text-zinc-400">Print and post near the entrance</p>
        </div>
      </div>
    </div>
  )
}
