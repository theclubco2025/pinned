'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface Props {
  storeName: string
  storeUrl: string
  qrSize?: number
}

export default function QRPoster({ storeName, storeUrl, qrSize = 280 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, storeUrl, { width: qrSize, margin: 2 })
      }
    })
  }, [storeUrl, qrSize])

  return (
    <div>
      <div id="qr-poster" className="qr-poster mx-auto max-w-md rounded-2xl border border-border bg-white p-8 text-center text-black">
        <div className="mb-4 flex justify-center">
          <Image src="/logo.png" alt="Pinned" width={120} height={38} />
        </div>
        <h2 className="mb-1 text-2xl font-bold">{storeName}</h2>
        <p className="mb-6 text-sm text-zinc-600">Scan to find anything in the store</p>
        <div className="mb-6 flex justify-center">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-xs text-zinc-500">Point your camera at the QR code — no app download needed</p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-elevated no-print"
      >
        Print / Save as PDF
      </button>
    </div>
  )
}
