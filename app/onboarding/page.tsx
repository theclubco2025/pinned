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
type PwMode = 'signup' | 'login'

export default function OnboardingPage() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pwMode, setPwMode] = useState<PwMode>('signup')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawError, setRawError] = useState('')
  const [notice, setNotice] = useState('')

  // Magic-link path
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) {
      setError(friendlyError(err))
      setRawError(err)
    }
  }, [])

  function reset() {
    setError('')
    setRawError('')
    setNotice('')
  }

  function showError(message: string) {
    setError(friendlyError(message))
    setRawError(message)
    console.error('[Pinned auth]', message)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 6) return
    setLoading(true)
    reset()

    try {
      const supabase = createClient()

      if (pwMode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) { showError(authError.message); setLoading(false); return }
        if (data.session) {
          router.push('/onboarding/step-2') // confirmation off → logged in
          return
        }
        // No session → email confirmation is ON. Offer to log in after confirming.
        setNotice('Account created. If sign-in doesn’t continue automatically, confirm your email, then use “Log in”.')
        const { data: loginData } = await supabase.auth.signInWithPassword({ email, password })
        if (loginData.session) { router.push('/onboarding/step-2'); return }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) { showError(authError.message); setLoading(false); return }
        if (data.session) { router.push('/dashboard'); return }
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
      else router.push('/onboarding/step-2')
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-5 flex justify-center rounded-2xl bg-black px-6 py-8">
            <Image src="/logo.png" alt="Pinned" width={200} height={63} priority />
          </div>
          <p className="text-muted">
            Turn your store into a map customers can ask questions to. Set it up in minutes.
          </p>
          <p className="mt-3 text-xs text-faint">
            Grocery · hardware · pharmacy · garden center · liquor · bookstore — any store with aisles.
          </p>
        </div>

        {method === 'password' ? (
          <div className="flex flex-col gap-4">
            {/* Sign up / Log in toggle */}
            <div className="flex rounded-xl border border-border bg-surface p-1 text-sm">
              <button
                onClick={() => { setPwMode('signup'); reset() }}
                className={`flex-1 rounded-lg py-2 font-medium transition-colors ${pwMode === 'signup' ? 'bg-foreground text-background' : 'text-muted'}`}
              >
                Create account
              </button>
              <button
                onClick={() => { setPwMode('login'); reset() }}
                className={`flex-1 rounded-lg py-2 font-medium transition-colors ${pwMode === 'login' ? 'bg-foreground text-background' : 'text-muted'}`}
              >
                Log in
              </button>
            </div>

            <form onSubmit={handlePassword} className="flex flex-col gap-3">
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
                placeholder="Password (min 6 characters)"
                autoComplete={pwMode === 'signup' ? 'new-password' : 'current-password'}
                required
                className={inputClass}
              />
              <button type="submit" disabled={loading || !email || password.length < 6} className={primaryBtn}>
                {loading ? 'Please wait…' : pwMode === 'signup' ? 'Create account & continue' : 'Log in'}
              </button>
              {notice && <p className="text-xs text-muted">{notice}</p>}
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
              <div className="mb-2 text-3xl">📬</div>
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

        <div className="mt-6 text-center">
          <Link href="/demo" className="text-sm text-faint underline underline-offset-2 hover:text-muted">
            Preview the app without signing in →
          </Link>
        </div>
      </div>
    </main>
  )
}
