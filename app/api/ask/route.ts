import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { localMatch } from '@/lib/productMatch'

interface ProductRow {
  id: string
  name: string
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
  aisle_label: string | null
  in_stock?: boolean | null
}

function extractJson(text: string): { productId: string | null; message: string } | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1))
    if (typeof parsed !== 'object' || parsed === null) return null
    return {
      productId: parsed.productId ?? null,
      message: typeof parsed.message === 'string' ? parsed.message : '',
    }
  } catch {
    return null
  }
}

function respond(product: ProductRow | null, message: string) {
  const outOfStock = product?.in_stock === false
  const mapped =
    !!product && product.tagged && product.x_pct != null && product.y_pct != null && !outOfStock
  return NextResponse.json({
    productId: product?.id ?? null,
    name: product?.name ?? null,
    aisle_label: product?.aisle_label ?? null,
    x_pct: mapped ? product!.x_pct : null,
    y_pct: mapped ? product!.y_pct : null,
    message: outOfStock && product
      ? `${product.name} looks out of stock right now — ask a team member to confirm.`
      : message,
  })
}

async function logQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  question: string,
  matchedProductId: string | null
) {
  try {
    await supabase.from('queries').insert({
      store_id: storeId,
      question,
      matched_product_id: matchedProductId,
    })
  } catch {
    // queries table may not exist yet — ignore
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { question, storeId } = body as { question: string; storeId: string }

  if (!question?.trim() || !storeId) {
    return NextResponse.json({ error: 'Missing question or storeId' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from('products')
    .select('id, name, x_pct, y_pct, tagged, aisle_label, in_stock')
    .eq('store_id', storeId)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const products = (data ?? []) as ProductRow[]
  if (!products.length) {
    await logQuery(supabase, storeId, question, null)
    return respond(null, "This store hasn't added its products yet — ask a team member.")
  }

  const quickMatch = localMatch(question, products)

  const productContext = products.map(p => ({
    id: p.id,
    name: p.name,
    mapped: p.tagged && p.x_pct != null,
  }))

  try {
    const client = new Anthropic({
      apiKey: process.env.CLAUDE_PINNED || process.env.ANTHROPIC_API_KEY,
    })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are a friendly in-store assistant. Match the customer's question to exactly one product from the list, or none.
Reply with ONLY a JSON object, no markdown, no extra text:
{"productId": "<id from the list or null>", "message": "<warm 1-2 sentence reply>"}
Guidance:
- Match on meaning, not just exact words (e.g. "something to clean windows" → glass cleaner).
- If matched and "mapped" is true: confirm you found it and name the item; tell them to look for the pin on the map.
- If matched but "mapped" is false: say the store carries it but the exact spot isn't pinned yet, so ask a team member.
- If nothing matches: set productId to null and say it doesn't look like the store carries it, suggest asking a team member. Never invent a location.`,
      messages: [
        {
          role: 'user',
          content: `Products: ${JSON.stringify(productContext)}\n\nCustomer question: ${question}`,
        },
      ],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const parsed = extractJson(text)

    if (parsed) {
      const product = parsed.productId ? products.find(p => p.id === parsed.productId) ?? null : null
      const message = parsed.message || (product
        ? `${product.name} — look for the pin on the map!`
        : "It doesn't look like the store carries that — ask a team member to be sure.")
      await logQuery(supabase, storeId, question, product?.id ?? null)
      return respond(product, message)
    }
  } catch {
    // fall through to local match
  }

  const product = quickMatch ?? localMatch(question, products)
  if (!product) {
    await logQuery(supabase, storeId, question, null)
    return respond(null, "It doesn't look like the store carries that — ask a team member to be sure.")
  }
  const mapped = product.tagged && product.x_pct != null
  await logQuery(supabase, storeId, question, product.id)
  return respond(
    product,
    mapped
      ? `Found it — ${product.name} is marked on the map. Follow the pin!`
      : `The store carries ${product.name}, but the exact spot isn't pinned yet — ask a team member.`
  )
}
