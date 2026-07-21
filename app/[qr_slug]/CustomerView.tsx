'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import StoreMap from '@/components/customer/StoreMap'
import ChatInput from '@/components/customer/ChatInput'
import { localMatch, buildLocalReply } from '@/lib/productMatch'
import type { Store, Product } from '@/types'
import type { DraftProduct } from '@/lib/draftStore'

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

type Matchable = Product | DraftProduct

interface Props {
  store: Store
  products?: Matchable[]
  draftMode?: boolean
  compact?: boolean
}

export default function CustomerView({ store, products = [], draftMode = false, compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activePin, setActivePin] = useState<{ x_pct: number; y_pct: number; label: string } | null>(null)

  const taggedWithPins = products.filter(
    p => p.tagged && p.x_pct != null && p.y_pct != null
  )
  const suggestions = taggedWithPins.slice(0, 3)

  const accentStyle = store.primary_color
    ? ({ '--color-accent': store.primary_color } as CSSProperties)
    : undefined

  async function handleAsk(question: string) {
    setLoading(true)
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: 'Looking…', pending: true },
    ])

    const matchList = products.length
      ? products
      : []

    const optimistic = localMatch(question, matchList)
    if (optimistic) {
      const { pin } = buildLocalReply(optimistic, store.name)
      if (pin) setActivePin(pin)
    }

    if (draftMode) {
      const { message, pin } = buildLocalReply(optimistic, store.name)
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: message }
        return next
      })
      setActivePin(pin)
      setLoading(false)
      return
    }

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
      } else if (!optimistic || !buildLocalReply(optimistic).pin) {
        setActivePin(null)
      }
    } catch {
      const { message, pin } = buildLocalReply(optimistic, store.name)
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: message }
        return next
      })
      setActivePin(pin)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className={`flex flex-col bg-background ${compact ? 'min-h-[480px] rounded-xl border border-border overflow-hidden' : 'min-h-screen'}`}
      style={accentStyle}
    >
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {store.logo_url && (
            <img src={store.logo_url} alt="" className="h-8 w-8 rounded object-contain" />
          )}
          <div>
            <h1 className="font-semibold">{store.name}</h1>
            <p className="text-xs text-faint">Ask me where anything is</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {store.floor_plan_url && (
          <StoreMap floorPlanUrl={store.floor_plan_url} pin={activePin} />
        )}

        {messages.length === 0 && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAsk(`Where's the ${p.name.toLowerCase()}?`)}
                disabled={loading}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-foreground"
              >
                Where&apos;s the {p.name.toLowerCase()}?
              </button>
            ))}
          </div>
        )}

        {messages.length === 0 && suggestions.length === 0 && (
          <div className="rounded-xl bg-elevated px-4 py-3 text-sm text-muted">
            Ask me where to find anything — try &ldquo;where&rsquo;s the milk?&rdquo;
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-foreground text-background'
                  : msg.pending
                    ? 'bg-elevated text-faint animate-pulse'
                    : 'bg-elevated text-foreground'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-4">
        <ChatInput disabled={loading} onSubmit={handleAsk} />
      </div>

      {!compact && (
        <div className="flex items-center justify-center gap-2 bg-black py-2">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Powered by</span>
          <Image src="/logo.png" alt="Pinned" width={56} height={18} />
        </div>
      )}
    </main>
  )
}
