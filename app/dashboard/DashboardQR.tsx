'use client'

import QRPoster from '@/components/dashboard/QRPoster'
import type { Store } from '@/types'

export default function DashboardQR({ store }: { store: Store }) {
  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${store.qr_slug}`

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-3 text-sm font-medium">Customer QR code</p>
      <QRPoster storeName={store.name} storeUrl={storeUrl} qrSize={180} />
    </div>
  )
}
