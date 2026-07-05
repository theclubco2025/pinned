'use client'

import { useState } from 'react'

interface Props {
  disabled?: boolean
  onSubmit: (question: string) => void
}

export default function ChatInput({ disabled, onSubmit }: Props) {
  const [question, setQuestion] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || disabled) return
    onSubmit(q)
    setQuestion('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Where can I find…"
        className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-foreground"
      />
      <button
        type="submit"
        disabled={!question.trim() || disabled}
        className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
      >
        {disabled ? '…' : 'Ask'}
      </button>
    </form>
  )
}
