'use client'

import { useState } from 'react'

export default function PushNotifications() {
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function subscribe() {
    if (!supported) return
    setLoading(true)

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setLoading(false)
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setLoading(false)
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      setSubscribed(true)
    } catch {
      // push not available
    }
    setLoading(false)
  }

  if (!supported) return null

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-2 text-sm font-medium">Daily summaries</p>
      <p className="mb-4 text-xs text-muted">Get notified when shoppers use your map.</p>
      <button
        type="button"
        onClick={subscribe}
        disabled={loading || subscribed}
        className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-elevated disabled:opacity-40"
      >
        {subscribed ? 'Notifications enabled' : loading ? 'Enabling…' : 'Enable notifications'}
      </button>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
