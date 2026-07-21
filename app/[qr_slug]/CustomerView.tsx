'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import Image from 'next/image'
import StoreMap from '@/components/customer/StoreMap'
import ChatInput from '@/components/customer/ChatInput'
import { localMatch, localMatchAll, buildLocalReply } from '@/lib/productMatch'
import { getFloorPlan } from '@/lib/floorPlans/templates'
import { routeHint } from '@/lib/floorPlans/route'
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
  templateId?: string | null
}

export default function CustomerView({
  store,
  products = [],
  draftMode = false,
  compact = false,
  templateId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activePin, setActivePin] = useState<{ x_pct: number; y_pct: number; label: string } | null>(null)
  const [routeHintText, setRouteHintText] = useState<string | null>(null)
  const [disambiguation, setDisambiguation] = useState<Matchable[]>([])
  const [analyticsSuggestions, setAnalyticsSuggestions] = useState<string[]>([])

  const resolvedTemplateId = templateId ?? store.store_type ?? null
  const plan = getFloorPlan(resolvedTemplateId)

  const taggedWithPins = products.filter(
    p => p.tagged && p.x_pct != null && p.y_pct != null
  )
  const defaultSuggestions = taggedWithPins.slice(0, 3).map(
    p => `Where's the ${p.name.toLowerCase()}?`
  )

  useEffect(() => {
    if (draftMode) return
    fetch('/api/analytics')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.topQuestions?.length) {
          setAnalyticsSuggestions(data.topQuestions.slice(0, 3).map((q: { question: string }) => q.question))
        }
      })
      .catch(() => {})
  }, [draftMode])

  const suggestions = analyticsSuggestions.length ? analyticsSuggestions : defaultSuggestions

  const accentStyle = store.primary_color
    ? ({ '--color-accent': store.primary_color } as CSSProperties)
    : undefined

  function applyPin(product: Matchable) {
    if (product.x_pct != null && product.y_pct != null) {
      setActivePin({
        x_pct: product.x_pct,
        y_pct: product.y_pct,
        label: product.aisle_label || product.name,
      })
      if (plan) {
        setRouteHintText(routeHint(plan, product.x_pct, product.y_pct))
      }
    } else {
      setActivePin(null)
      setRouteHintText(null)
    }
  }

  async function resolveAsk(question: string, forcedProduct?: Matchable) {
    setLoading(true)
    setDisambiguation([])
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: 'Looking…', pending: true },
    ])

    const matches = localMatchAll(question, products)
    if (!forcedProduct && matches.length > 1) {
      setDisambiguation(matches)
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          text: `I found a few matches — which one did you mean?`,
        }
        return next
      })
      setLoading(false)
      return
    }

    const optimistic = forcedProduct ?? matches[0] ?? localMatch(question, products)
    if (optimistic) applyPin(optimistic)

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
        let text = result.message
        if (plan && result.x_pct != null && result.y_pct != null) {
          text += ` ${routeHint(plan, result.x_pct, result.y_pct)}`
        }
        next[next.length - 1] = { role: 'assistant', text }
        return next
      })

      if (result.x_pct != null && result.y_pct != null) {
        setActivePin({
          x_pct: result.x_pct,
          y_pct: result.y_pct,
          label: result.aisle_label || result.name || '',
        })
        if (plan) setRouteHintText(routeHint(plan, result.x_pct, result.y_pct))
      } else if (!optimistic || !buildLocalReply(optimistic).pin) {
        setActivePin(null)
        setRouteHintText(null)
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

  function handleDisambiguationPick(product: Matchable) {
    setDisambiguation([])
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (lastUser) resolveAsk(lastUser.text, product)
  }

  return (
    <main
      className={`flex flex-col bg-background transition-colors duration-300 ${compact ? 'min-h-[480px] rounded-xl border border-border overflow-hidden' : 'min-h-screen'}`}
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
        {(store.floor_plan_url || plan) && (
          <div className="transition-opacity duration-500">
            <StoreMap
              floorPlanUrl={store.floor_plan_url ?? ''}
              templateId={resolvedTemplateId}
              pin={activePin}
            />
            {routeHintText && activePin && (
              <p className="mt-2 text-sm text-accent">{routeHintText}</p>
            )}
          </div>
        )}

        {messages.length === 0 && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => resolveAsk(q.endsWith('?') ? q : `Where's the ${q}?`)}
                disabled={loading}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-foreground transition-colors"
              >
                {q.endsWith('?') ? q : `Where's the ${q}?`}
              </button>
            ))}
          </div>
        )}

        {disambiguation.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {disambiguation.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDisambiguationPick(p)}
                className="rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {p.name}
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
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-all`}>
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
        <ChatInput disabled={loading} onSubmit={resolveAsk} />
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
