'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import FloorPlanSVG from '@/components/floorplan/FloorPlanSVG'
import { getFloorPlan } from '@/lib/floorPlans/templates'
import { computeRoute } from '@/lib/floorPlans/route'

function HeroVisual() {
  const plan = getFloorPlan('grocery')!
  // Dairy zone center → the classic "where's the milk?" demo.
  const pin = { x_pct: 12.5, y_pct: 25, label: 'Dairy · Aisle 1', active: true }
  const route = computeRoute(plan, pin.x_pct, pin.y_pct)

  return (
    <div className="relative w-full max-w-[560px]">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-accent/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3 shadow-2xl">
        <FloorPlanSVG plan={plan} activePin={pin} route={route} />
      </div>

      {/* floating conversation proof */}
      <div className="fade-rise absolute -left-3 top-6 rounded-2xl border border-white/10 bg-black/70 px-3.5 py-2 text-sm text-white shadow-xl backdrop-blur">
        Where&rsquo;s the oat milk?
      </div>
      <div className="fade-rise absolute -right-3 bottom-8 rounded-2xl border border-accent/30 bg-accent/20 px-3.5 py-2 text-sm text-white shadow-xl backdrop-blur [animation-delay:0.3s]">
        Dairy · Aisle 1 — ~14 steps →
      </div>
    </div>
  )
}

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
    'w-full border-b border-white/15 bg-transparent px-0 py-3 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-white/50'
  const primaryBtn =
    'w-full bg-white px-6 py-3.5 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40'

  if (mode === 'landing') {
    return (
      <main className="min-h-screen bg-background text-white">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-10">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Pinned" width={92} height={29} priority />
            </div>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-sm text-white/60 hover:text-white"
            >
              Log in
            </button>
          </div>

          {/* Hero */}
          <section className="grid items-start gap-12 pt-24 pb-16 md:grid-cols-[1.15fr_.85fr] md:pt-[120px] md:pb-[80px]">
            <div className="max-w-2xl">
              <h1 className="text-pretty text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                Every aisle, every product — pinned for your customers.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/60 md:text-xl">
                Customers scan a QR and instantly see where anything is located in your store.
              </p>

              <div className="mt-10 flex flex-col items-start gap-4">
                <Link
                  href="/onboarding/step-2"
                  className="inline-flex items-center justify-center bg-white px-6 py-3.5 text-sm font-medium text-black hover:bg-white/90"
                >
                  Start your store
                </Link>
                <p className="text-sm text-white/40">
                  Grocery · hardware · pharmacy · garden center · liquor · bookstore
                </p>
              </div>
            </div>

            <div className="justify-self-end">
              <HeroVisual />
            </div>
          </section>

          {/* Narrative steps */}
          <section className="pt-24 pb-16 md:pt-[120px] md:pb-[80px]">
            <h2 className="text-pretty text-[clamp(2rem,4vw,2.5rem)] font-medium leading-tight tracking-[-0.01em]">
              Set up in minutes
            </h2>

            <div className="mt-10 max-w-3xl border-t border-white/10">
              <div className="flex items-start justify-between gap-8 border-b border-white/10 py-8">
                <div>
                  <p className="text-xl font-medium text-white">Choose your floor plan</p>
                  <p className="mt-2 text-[18px] leading-relaxed text-white/60">
                    Use a template or upload a photo of your layout.
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-8 border-b border-white/10 py-8">
                <div>
                  <p className="text-xl font-medium text-white">Pin your top products</p>
                  <p className="mt-2 text-[18px] leading-relaxed text-white/60">
                    Start with your best-sellers. Tag the rest anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-8 py-8">
                <div>
                  <p className="text-xl font-medium text-white">Print your QR for customers</p>
                  <p className="mt-2 text-[18px] leading-relaxed text-white/60">
                    Post it by the entrance. Customers ask, the map answers.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <div className="flex items-center justify-between pt-10">
          <Image src="/logo.png" alt="Pinned" width={92} height={29} priority />
          <button
            type="button"
            onClick={() => { setMode('landing'); reset() }}
            className="text-sm text-white/60 hover:text-white"
          >
            Back
          </button>
        </div>

        <section className="grid items-start gap-12 pt-24 pb-16 md:grid-cols-[1.15fr_.85fr] md:pt-[120px] md:pb-[80px]">
          <div className="max-w-xl">
            <h2 className="text-pretty text-[clamp(2rem,4vw,2.5rem)] font-medium leading-tight tracking-[-0.01em]">
              Welcome back
            </h2>
            <p className="mt-4 text-[18px] leading-relaxed text-white/60">
              Log in to manage your store map.
            </p>
          </div>
          <div className="justify-self-end">
            <HeroVisual />
          </div>
        </section>

        {method === 'password' ? (
          <div className="max-w-md border-t border-white/10 pt-10 pb-16">
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
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
              className="mt-6 text-left text-sm text-white/60 hover:text-white"
            >
              Use a magic link instead
            </button>
          </div>
        ) : !sent ? (
          <div className="max-w-md border-t border-white/10 pt-10 pb-16">
            <form onSubmit={sendLink} className="flex flex-col gap-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
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
              className="mt-6 text-left text-sm text-white/60 hover:text-white"
            >
              Use email + password instead
            </button>
          </div>
        ) : (
          <div className="max-w-md border-t border-white/10 pt-10 pb-16">
            <p className="text-sm font-medium text-white">Check your email</p>
            <p className="mt-2 text-[18px] leading-relaxed text-white/60">
              Sent to {email}. Click the link, or enter the 6-digit code below.
            </p>

            <form onSubmit={verifyCode} className="mt-8 flex flex-col gap-6">
              <label className="text-sm font-medium text-white/60">Enter your code</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-center font-mono text-xl tracking-[0.3em] text-white placeholder:text-white/25 outline-none focus:border-white/50"
              />
              <button type="submit" disabled={verifying || code.length < 6} className={primaryBtn}>
                {verifying ? 'Verifying…' : 'Verify & continue'}
              </button>
              {errorBlock}
            </form>

            <button
              onClick={() => { setSent(false); setCode(''); reset() }}
              className="mt-6 text-left text-sm text-white/60 hover:text-white"
            >
              Use a different email
            </button>
          </div>
        )}

        <div className="pb-16">
          <Link href="/onboarding/step-2" className="text-sm text-white/60 hover:text-white">
            New here? Start your store →
          </Link>
        </div>
      </div>
    </main>
  )
}
