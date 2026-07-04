'use client'

import { useState } from 'react'
import StoreMap from '@/components/customer/StoreMap'
import ChatInput from '@/components/customer/ChatInput'
import type { Store } from '@/types'

interface AskResult {
  productId: string | null
  x_pct: number | null
  y_pct: number | null
  message: string
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  result?: AskResult
}

export default function CustomerView({ store }: { store: Store }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [activePin, setActivePin] = useState<{ x_pct: number; y_pct: number; label: string } | null>(null)

  function handleResult(question: string, result: AskResult) {
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: result.message, result },
    ])

    if (result.x_pct != null && result.y_pct != null) {
      setActivePin({ x_pct: result.x_pct, y_pct: result.y_pct, label: '' })
    } else {
      setActivePin(null)
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
            Ask me where to find anything — milk, bread, batteries…
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
                  : 'bg-zinc-100 text-zinc-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100 px-4 py-4">
        <ChatInput
          storeId={store.id}
          onResult={(result, question) => handleResult(question ?? '', result)}
        />
      </div>
    </main>
  )
}
