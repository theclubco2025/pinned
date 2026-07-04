import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { question, storeId } = body as { question: string; storeId: string }

  if (!question || !storeId) {
    return NextResponse.json({ error: 'Missing question or storeId' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('id, name, x_pct, y_pct, tagged, aisle_label')
    .eq('store_id', storeId)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  if (!products?.length) {
    return NextResponse.json({
      productId: null,
      x_pct: null,
      y_pct: null,
      message: "I don't see any products listed for this store yet.",
    })
  }

  const client = new Anthropic()

  const productContext = products.map(p => ({
    id: p.id,
    name: p.name,
    mapped: p.tagged && p.x_pct != null,
    aisle_label: p.aisle_label ?? null,
  }))

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `You are a helpful in-store assistant. Match the customer's question to a product.
Respond ONLY with valid JSON on a single line: {"productId":"uuid-or-null","message":"friendly 1-2 sentence reply"}
Rules:
- If matched and mapped=true, confirm the item is carried and mention the name naturally.
- If matched but mapped=false, say the store carries it but the exact spot isn't pinned yet.
- If no match, set productId to null and suggest browsing or asking staff.`,
    messages: [
      {
        role: 'user',
        content: `Products:\n${JSON.stringify(productContext)}\n\nCustomer: ${question}`,
      },
    ],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

  try {
    const parsed = JSON.parse(text) as { productId: string | null; message: string }
    const match = parsed.productId ? products.find(p => p.id === parsed.productId) : null

    return NextResponse.json({
      productId: parsed.productId ?? null,
      x_pct: match?.x_pct ?? null,
      y_pct: match?.y_pct ?? null,
      message: parsed.message,
    })
  } catch {
    return NextResponse.json({ productId: null, x_pct: null, y_pct: null, message: text })
  }
}
