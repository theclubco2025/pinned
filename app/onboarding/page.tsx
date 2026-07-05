'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('rate') || m.includes('exceeded') || m.includes('limit')) {
    return "Email limit reached for now (Supabase's built-in email is capped). Wait a bit and try again, or enter a code you already received below."
  }
  if (m.includes('expired')) return 'That link expired. Send a new one below.'
  if (m.includes('token') || m.includes('missing')) return 'That link was invalid. Enter the 6-digit code from the email instead.'
  return message
}

export default function OnboardingPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Code-entry fallback (robust: no redirect / cross-device)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) setError(friendlyError(err))
  }, [])

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })

    if (authError) setError(friendlyError(authError.message))
    else setSent(true)
    setLoading(false)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    const token = code.trim()
    if (token.length < 6) return
    setVerifying(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (authError) setError(friendlyError(authError.message))
    else router.push('/onboarding/step-2')
    setVerifying(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
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

        {!sent ? (
          <form onSubmit={sendLink} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-foreground"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
            >
              {loading ? 'Sending…' : 'Continue with email'}
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>
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
              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
              >
                {verifying ? 'Verifying…' : 'Verify & continue'}
              </button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>

            <button
              onClick={() => { setSent(false); setCode(''); setError('') }}
              className="text-xs text-faint underline underline-offset-2 hover:text-muted"
            >
              Use a different email
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-faint">
          No password — we&apos;ll email you a link and a code.
        </p>

        <div className="mt-6 text-center">
          <Link href="/demo" className="text-sm text-faint underline underline-offset-2 hover:text-muted">
            Preview the app without signing in →
          </Link>
        </div>
      </div>
    </main>
  )
}
