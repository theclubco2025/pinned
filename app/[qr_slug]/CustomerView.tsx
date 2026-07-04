'use client'

import { useState } from 'react'
import Image from 'next/image'
import StoreMap from '@/components/customer/StoreMap'
import ChatInput from '@/components/customer/ChatInput'
import type { Store } from '@/types'

interface AskResult {
  productId: string | null
  name: string | null
  aisle_label: string | null
  x_pct: number | null
  y_pct: number | null
  message: string
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  pending?: boolean
}

export default function CustomerView({ store }: { store: Store }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activePin, setActivePin] = useState<{ x_pct: number; y_pct: number; label: string } | null>(null)

  async function handleAsk(question: string) {
    setLoading(true)
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: 'Looking…', pending: true },
    ])

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, storeId: store.id }),
      })
      const result: AskResult = await res.json()

      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: result.message }
        return next
      })

      if (result.x_pct != null && result.y_pct != null) {
        setActivePin({
          x_pct: result.x_pct,
          y_pct: result.y_pct,
          label: result.aisle_label || result.name || '',
        })
      } else {
        setActivePin(null)
      }
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          text: 'Sorry, something went wrong. Please try again.',
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-100 px-4 py-3">
        <h1 className="font-semibold">{store.name}</h1>
        <p className="text-xs text-zinc-400">Ask me where anything is</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {store.floor_plan_url && (
          <StoreMap floorPlanUrl={store.floor_plan_url} pin={activePin} />
        )}

        {messages.length === 0 && (
          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Ask me where to find anything — try &ldquo;where&rsquo;s the milk?&rdquo; or &ldquo;something to clean windows.&rdquo;
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-black text-white'
                  : msg.pending
                    ? 'bg-zinc-100 text-zinc-400 animate-pulse'
                    : 'bg-zinc-100 text-zinc-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100 px-4 py-4">
        <ChatInput disabled={loading} onSubmit={handleAsk} />
      </div>

      <div className="flex items-center justify-center gap-2 bg-black py-2">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Powered by</span>
        <Image src="/logo.png" alt="Pinned" width={56} height={18} />
      </div>
    </main>
  )
}
