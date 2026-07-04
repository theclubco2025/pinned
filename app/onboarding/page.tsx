'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'

export default function OnboardingPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">📬</div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-zinc-500">
            We sent a magic link to <span className="font-medium text-zinc-900">{email}</span>
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-zinc-400 underline underline-offset-2"
          >
            Use a different email
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-5 flex justify-center rounded-2xl bg-black px-6 py-8">
            <Image src="/logo.png" alt="Pinned" width={200} height={63} priority />
          </div>
          <p className="text-zinc-500">
            Turn your store into a map customers can ask questions to. Set it up in minutes.
          </p>
          <p className="mt-3 text-xs text-zinc-400">
            Grocery · hardware · pharmacy · garden center · liquor · bookstore — any store with aisles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {loading ? 'Sending link…' : 'Continue with email'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <p className="mt-4 text-center text-xs text-zinc-400">
          No password — we'll email you a sign-in link.
        </p>

        <div className="mt-6 text-center">
          <Link href="/demo" className="text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600">
            Preview the app without signing in →
          </Link>
        </div>
      </div>
    </main>
  )
}
