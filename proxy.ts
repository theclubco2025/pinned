import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// True only when both vars are present AND the URL is actually a URL —
// placeholder values (e.g. "your_supabase_url") must not crash the proxy.
function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    const draftSteps = [
      '/onboarding/step-2',
      '/onboarding/step-3',
      '/onboarding/step-4',
      '/onboarding/step-5',
    ]
    const isDraftStep = draftSteps.some(s => pathname === s || pathname.startsWith(s + '/'))

    if (!user && pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/step-2'
      return NextResponse.redirect(url)
    }

    if (!user && pathname === '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/step-2'
      return NextResponse.redirect(url)
    }

    if (!user && pathname.startsWith('/onboarding') && !isDraftStep && pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/step-2'
      return NextResponse.redirect(url)
    }
  } catch {
    // Never let an auth hiccup 500 the whole site — fail open to the page,
    // where server components / API routes enforce auth anyway.
    return NextResponse.next({ request })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
