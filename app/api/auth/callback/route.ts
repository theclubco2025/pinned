import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// Canonical origin for redirects — avoids proxy/origin mismatches on Vercel.
function siteOrigin(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  return requestOrigin
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/onboarding/step-2'
  const base = siteOrigin(origin)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  let errorMessage: string | null = null

  if (tokenHash && type) {
    // Robust flow — works across email clients / devices (no PKCE verifier needed).
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    errorMessage = error?.message ?? null
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    errorMessage = error?.message ?? null
  } else {
    errorMessage = 'This link is missing its verification token.'
  }

  if (!errorMessage) {
    return NextResponse.redirect(`${base}${next}`)
  }
  return NextResponse.redirect(`${base}/onboarding?error=${encodeURIComponent(errorMessage)}`)
}
