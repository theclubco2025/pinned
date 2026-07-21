'use client'

import { useState } from 'react'

interface Props {
  disabled?: boolean
  onSubmit: (question: string) => void
}

export default function ChatInput({ disabled, onSubmit }: Props) {
  const [question, setQuestion] = useState('')
  const [listening, setListening] = useState(false)
  const voiceSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || disabled) return
    onSubmit(q)
    setQuestion('')
  }

  function startVoice() {
    if (!voiceSupported || disabled) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    setListening(true)
    rec.onresult = (ev: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = ev.results[0]?.[0]?.transcript?.trim()
      if (transcript) {
        onSubmit(transcript)
      }
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {voiceSupported && (
        <button
          type="button"
          onClick={startVoice}
          disabled={disabled || listening}
          className="rounded-full border border-border p-3 text-muted hover:border-accent hover:text-foreground disabled:opacity-40"
          aria-label="Voice input"
          title="Speak your question"
        >
          {listening ? '…' : '🎤'}
        </button>
      )}
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
