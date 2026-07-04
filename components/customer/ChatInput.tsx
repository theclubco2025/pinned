'use client'

import { useState } from 'react'

interface AskResult {
  productId: string | null
  x_pct: number | null
  y_pct: number | null
  message: string
}

interface Props {
  storeId: string
  onResult: (result: AskResult, question: string) => void
}

export default function ChatInput({ storeId, onResult }: Props) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || loading) return

    const q = question.trim()
    setLoading(true)
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, storeId }),
    })
    const data: AskResult = await res.json()
    onResult(data, q)
    setLoading(false)
    setQuestion('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Where can I find…"
        disabled={loading}
        className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!question.trim() || loading}
        className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
      >
        {loading ? '…' : 'Ask'}
      </button>
    </form>
  )
}
