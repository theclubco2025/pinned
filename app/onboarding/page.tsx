'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('rate') || m.includes('exceeded') || m.includes('limit')) {
    return "Email limit reached (Supabase's built-in email is capped). Use email + password above, or wait and retry."
  }
  if (m.includes('sending') && (m.includes('email') || m.includes('mail'))) {
    return 'The email server rejected the send. Use email + password instead (no email needed), or fix SMTP in Supabase.'
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Wrong email or password. Try again, or switch to “Create account”.'
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'That email already has an account — switch to “Log in”.'
  }
  if (m.includes('confirm') && m.includes('email')) {
    return 'This account still needs email confirmation. Turn off “Confirm email” in Supabase → Authentication → Email, or confirm via the email.'
  }
  if (m.includes('password') && m.includes('should') && m.includes('6')) {
    return 'Password must be at least 6 characters.'
  }
  if (m.includes('expired')) return 'That link expired. Send a new one below.'
  if (m.includes('token') || m.includes('missing')) return 'That link was invalid. Enter the 6-digit code from the email instead.'
  return message || 'Something went wrong. Please try again.'
}

type Method = 'password' | 'link'
type Mode = 'landing' | 'login'

export default function OnboardingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('landing')
  const [method, setMethod] = useState<Method>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawError, setRawError] = useState('')

  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (!err) return
    queueMicrotask(() => {
      setMode('login')
      setError(friendlyError(err))
      setRawError(err)
    })
  }, [])

  function reset() {
    setError('')
    setRawError('')
  }

  function showError(message: string) {
    setError(friendlyError(message))
    setRawError(message)
    console.error('[Pinned auth]', message)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 6) return
    setLoading(true)
    reset()

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        showError(authError.message)
        setLoading(false)
        return
      }
      if (data.session) {
        router.push('/dashboard')
        return
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not reach the server.')
    }
    setLoading(false)
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    reset()
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      })
      if (authError) showError(authError.message)
      else setSent(true)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not reach the server.')
    }
    setLoading(false)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    const token = code.trim()
    if (token.length < 6) return
    setVerifying(true)
    reset()
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (authError) showError(authError.message)
      else router.push('/dashboard')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not reach the server.')
    }
    setVerifying(false)
  }

  const errorBlock = error && (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
      <p className="text-sm text-red-500">{error}</p>
      {rawError && rawError !== error && (
        <p className="mt-1 font-mono text-[11px] text-red-400/80">Details: {rawError}</p>
      )}
    </div>
  )

  const inputClass =
    'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-foreground'
  const primaryBtn =
    'w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40'

  if (mode === 'landing') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-5 flex justify-center rounded-2xl bg-black px-6 py-8">
              <Image src="/logo.png" alt="Pinned" width={200} height={63} priority />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Your store. Askable.</h1>
            <p className="mt-3 text-muted">
              Customers scan a QR, ask where anything is, and get a pin on your floor plan.
              Set it up in minutes — no account required to try.
            </p>
            <p className="mt-3 text-xs text-faint">
              Grocery · hardware · pharmacy · garden center · liquor · bookstore
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/onboarding/step-2"
              className="w-full rounded-xl bg-foreground py-3.5 text-center text-sm font-medium text-background hover:opacity-90"
            >
              Set up your store — try free →
            </Link>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted hover:bg-elevated hover:text-foreground"
            >
              Log in to your dashboard
            </button>
          </div>

          <ul className="mt-8 space-y-2 text-sm text-muted">
            <li className="flex gap-2"><span className="text-faint">1.</span> Name your store & pick a floor plan</li>
            <li className="flex gap-2"><span className="text-faint">2.</span> Paste products, pin the top ones</li>
            <li className="flex gap-2"><span className="text-faint">3.</span> Print the QR — customers find anything</li>
          </ul>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-5 flex justify-center rounded-2xl bg-black px-6 py-8">
            <Image src="/logo.png" alt="Pinned" width={200} height={63} priority />
          </div>
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Log in to manage your store map.</p>
        </div>

        {method === 'password' ? (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className={inputClass}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className={inputClass}
              />
              <button type="submit" disabled={loading || !email || password.length < 6} className={primaryBtn}>
                {loading ? 'Please wait…' : 'Log in'}
              </button>
              {errorBlock}
            </form>

            <button
              onClick={() => { setMethod('link'); reset() }}
              className="text-center text-xs text-faint underline underline-offset-2 hover:text-muted"
            >
              Email me a magic link instead →
            </button>
          </div>
        ) : !sent ? (
          <div className="flex flex-col gap-4">
            <form onSubmit={sendLink} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={inputClass}
              />
              <button type="submit" disabled={loading || !email} className={primaryBtn}>
                {loading ? 'Sending…' : 'Email me a sign-in link'}
              </button>
              {errorBlock}
            </form>
            <button
              onClick={() => { setMethod('password'); reset() }}
              className="text-center text-xs text-faint underline underline-offset-2 hover:text-muted"
            >
              ← Use email + password instead
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-elevated px-4 py-4 text-center">
              <p className="text-sm font-medium text-foreground">Check your email</p>
              <p className="mt-1 text-xs text-muted">
                Sent to {email}. Click the link, or enter the 6-digit code below.
              </p>
            </div>

            <form onSubmit={verifyCode} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground">Enter your code</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-foreground outline-none focus:border-foreground"
              />
              <button type="submit" disabled={verifying || code.length < 6} className={primaryBtn}>
                {verifying ? 'Verifying…' : 'Verify & continue'}
              </button>
              {errorBlock}
            </form>

            <button
              onClick={() => { setSent(false); setCode(''); reset() }}
              className="text-xs text-faint underline underline-offset-2 hover:text-muted"
            >
              Use a different email
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 text-center">
          <Link href="/onboarding/step-2" className="text-sm font-medium underline underline-offset-2">
            New here? Set up a store without logging in →
          </Link>
          <button
            type="button"
            onClick={() => { setMode('landing'); reset() }}
            className="text-xs text-faint underline underline-offset-2 hover:text-muted"
          >
            ← Back
          </button>
        </div>
      </div>
    </main>
  )
}
