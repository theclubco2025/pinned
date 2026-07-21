'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Props {
  onSuccess: () => void
}

export default function AccountGate({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 6) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.session) {
        onSuccess()
        return
      }
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) {
        setError('Account created — confirm your email, then log in.')
        setLoading(false)
        return
      }
      if (loginData.session) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-left">
      <h2 className="mb-1 text-lg font-bold">Create free account to go live</h2>
      <p className="mb-4 text-sm text-muted">Save your store and get your permanent QR link.</p>
      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-border"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email || password.length < 6}
          className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Saving…' : 'Create account & go live'}
        </button>
      </form>
    </div>
  )
}
