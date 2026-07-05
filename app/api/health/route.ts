import { NextResponse } from 'next/server'

// Reports whether required config is present and well-formed — no secret
// values are ever returned. Hit /api/health on the deployed site to confirm
// the Vercel environment is set up correctly.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let supabaseUrlValid = false
  try {
    const u = new URL(url ?? '')
    supabaseUrlValid = u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    supabaseUrlValid = false
  }

  const anonLen = anon?.length ?? 0
  const anthropicKeyPresent = !!(process.env.CLAUDE_PINNED || process.env.ANTHROPIC_API_KEY)

  return NextResponse.json({
    ok: supabaseUrlValid && anonLen > 100 && anthropicKeyPresent,
    supabaseUrlPresent: !!url,
    supabaseUrlValid,
    // A real Supabase anon key is a JWT ~200+ chars. A short value here means
    // the wrong key (or a placeholder) was pasted into Vercel.
    supabaseAnonKeyPresent: !!anon,
    supabaseAnonKeyLength: anonLen,
    supabaseAnonKeyLooksValid: anonLen > 100,
    anthropicKeyPresent,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    siteUrlIsLocalhost: /localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_SITE_URL ?? ''),
  })
}
