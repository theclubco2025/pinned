export interface MatchableProduct {
  id: string
  name: string
  x_pct?: number | null
  y_pct?: number | null
  tagged?: boolean
  aisle_label?: string | null
}

export function localMatch<T extends MatchableProduct>(
  question: string,
  products: T[]
): T | null {
  const q = question.toLowerCase()
  let best: { product: T; score: number } | null = null
  for (const p of products) {
    const name = p.name.toLowerCase()
    let score = 0
    if (q.includes(name)) score = name.length * 2
    else {
      for (const word of name.split(/\s+/)) {
        if (word.length > 2 && q.includes(word)) score += word.length
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { product: p, score }
  }
  return best?.product ?? null
}

export function localMatchAll<T extends MatchableProduct>(
  question: string,
  products: T[],
  limit = 5
): T[] {
  const q = question.toLowerCase()
  const scored: { product: T; score: number }[] = []
  for (const p of products) {
    const name = p.name.toLowerCase()
    let score = 0
    if (q.includes(name)) score = name.length * 2
    else {
      for (const word of name.split(/\s+/)) {
        if (word.length > 2 && q.includes(word)) score += word.length
      }
    }
    if (score > 0) scored.push({ product: p, score })
  }
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, limit)
  if (top.length <= 1) return top.map(s => s.product)
  const threshold = top[0].score * 0.6
  return top.filter(s => s.score >= threshold).map(s => s.product)
}

export function buildLocalReply(
  product: MatchableProduct | null,
  storeName?: string
): { message: string; pin: { x_pct: number; y_pct: number; label: string } | null } {
  if (!product) {
    return {
      message: "It doesn't look like the store carries that — ask a team member to be sure.",
      pin: null,
    }
  }
  const mapped =
    product.tagged && product.x_pct != null && product.y_pct != null
  if (mapped) {
    return {
      message: `Found it — ${product.name} is marked on the map. Follow the pin!`,
      pin: {
        x_pct: product.x_pct!,
        y_pct: product.y_pct!,
        label: product.aisle_label || product.name,
      },
    }
  }
  return {
    message: `${storeName ?? 'The store'} carries ${product.name}, but the exact spot isn't pinned yet — ask a team member.`,
    pin: null,
  }
}
