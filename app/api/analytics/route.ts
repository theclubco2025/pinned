import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 })

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: queries, error } = await supabase
    .from('queries')
    .select('question, matched_product_id, created_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({
      total: 0,
      last7Days: 0,
      unmatchedRate: 0,
      topQuestions: [],
    })
  }

  const all = queries ?? []
  const last7 = all.filter(q => new Date(q.created_at) >= weekAgo)
  const unmatched = all.filter(q => !q.matched_product_id).length

  const counts = new Map<string, number>()
  for (const q of all) {
    const key = q.question.toLowerCase().trim()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const topQuestions = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([question, count]) => ({ question, count }))

  return NextResponse.json({
    total: all.length,
    last7Days: last7.length,
    unmatchedRate: all.length ? Math.round((unmatched / all.length) * 100) : 0,
    topQuestions,
  })
}
