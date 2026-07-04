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
        className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
      />
      <button
        type="submit"
        disabled={!question.trim() || disabled}
        className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
      >
        {disabled ? '…' : 'Ask'}
      </button>
    </form>
  )
}
