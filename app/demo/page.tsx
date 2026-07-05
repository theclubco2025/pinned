'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Floor plan SVG (data URL so <img> rendering and click math both work) ──

const FLOOR_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#f9fafb"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="110" height="160" fill="#dbeafe" rx="6"/>
  <text x="75" y="105" text-anchor="middle" fill="#1e40af" font-size="13" font-weight="600">DAIRY</text>
  <rect x="145" y="20" width="110" height="100" fill="#fce7f3" rx="6"/>
  <text x="200" y="75" text-anchor="middle" fill="#9d174d" font-size="13" font-weight="600">MEAT</text>
  <rect x="145" y="135" width="110" height="145" fill="#f3f4f6" rx="6"/>
  <text x="200" y="215" text-anchor="middle" fill="#6b7280" font-size="12">AISLE 1</text>
  <rect x="270" y="20" width="110" height="260" fill="#f3f4f6" rx="6"/>
  <text x="325" y="152" text-anchor="middle" fill="#6b7280" font-size="12">AISLE 2</text>
  <rect x="395" y="20" width="70" height="260" fill="#f3f4f6" rx="6"/>
  <text x="430" y="152" text-anchor="middle" fill="#9ca3af" font-size="11">AISLE 3</text>
  <rect x="480" y="20" width="100" height="160" fill="#fef3c7" rx="6"/>
  <text x="530" y="105" text-anchor="middle" fill="#92400e" font-size="13" font-weight="600">BAKERY</text>
  <rect x="20" y="195" width="110" height="85" fill="#d1fae5" rx="6"/>
  <text x="75" y="242" text-anchor="middle" fill="#065f46" font-size="13" font-weight="600">PRODUCE</text>
  <rect x="480" y="195" width="100" height="85" fill="#e0e7ff" rx="6"/>
  <text x="530" y="242" text-anchor="middle" fill="#3730a3" font-size="13" font-weight="600">DRINKS</text>
  <rect x="20" y="300" width="560" height="50" fill="#1f2937" rx="6"/>
  <text x="300" y="330" text-anchor="middle" fill="white" font-size="13" font-weight="600" letter-spacing="2">CHECKOUT</text>
  <rect x="260" y="370" width="80" height="22" fill="white" rx="3"/>
  <text x="300" y="384" text-anchor="middle" fill="#6b7280" font-size="11">ENTRANCE</text>
</svg>`

const FLOOR_URL = `data:image/svg+xml,${encodeURIComponent(FLOOR_SVG)}`

// ─── Types + defaults ───────────────────────────────────────────────────────

interface DemoProduct {
  id: number
  name: string
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
}

const DEFAULT_STORE = "Sullivan's Grocery"
const DEFAULT_PRODUCTS = [
  'Whole Milk',
  'Organic Eggs',
  'Sourdough Bread',
  'Chicken Breast',
  'Orange Juice',
  'WD-40',
  'Batteries',
  'Cheddar Cheese',
].join('\n')

const AUTO_SPOTS: [number, number][] = [
  [12, 30], [12, 55], [33, 22], [33, 52], [45, 40], [55, 30],
  [55, 55], [71, 35], [88, 25], [88, 58], [12, 68], [33, 65],
]

function parseProducts(text: string): string[] {
  const lines = text.includes('\n') ? text.split('\n') : text.split(',')
  return [...new Set(lines.map(l => l.trim()).filter(Boolean))]
}

function matchProduct(question: string, products: DemoProduct[]): DemoProduct | null {
  const q = question.toLowerCase()
  let best: { p: DemoProduct; score: number } | null = null
  for (const p of products) {
    const name = p.name.toLowerCase()
    let score = 0
    if (q.includes(name)) score = name.length * 2
    else {
      for (const w of name.split(/\s+/)) {
        if (w.length > 2 && q.includes(w)) score += w.length
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { p, score }
  }
  return best?.p ?? null
}

// ─── Demo wizard ─────────────────────────────────────────────────────────────

const STEP_LABELS = ['Store', 'Products', 'Tag', 'Go live', 'Customer']

export default function DemoPage() {
  const [step, setStep] = useState(0)

  const [storeName, setStoreName] = useState(DEFAULT_STORE)
  const [productText, setProductText] = useState(DEFAULT_PRODUCTS)
  const [products, setProducts] = useState<DemoProduct[]>([])

  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const [chatQ, setChatQ] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [activePin, setActivePin] = useState<{ x: number; y: number; label: string } | null>(null)

  const untagged = products.filter(p => !p.tagged)
  const taggedCount = products.length - untagged.length
  const current = untagged[0]

  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const url = `${window.location.origin}/demo`
      import('qrcode').then(QR => QR.toCanvas(canvasRef.current!, url, { width: 220, margin: 2 }))
    }
  }, [step])

  function startTagging() {
    const names = parseProducts(productText)
    if (!names.length) return
    setProducts(names.map((name, i) => ({ id: i, name, x_pct: null, y_pct: null, tagged: false })))
    setPendingPin(null)
    setStep(2)
  }

  function handleFloorClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = imgRef.current!.getBoundingClientRect()
    setPendingPin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  function confirmPin() {
    if (!pendingPin || !current) return
    setProducts(prev => prev.map(p =>
      p.id === current.id ? { ...p, x_pct: pendingPin.x, y_pct: pendingPin.y, tagged: true } : p
    ))
    setPendingPin(null)
    if (untagged.length <= 1) setStep(3)
  }

  function skipPin() {
    if (!current) return
    setProducts(prev => prev.map(p => (p.id === current.id ? { ...p, tagged: true } : p)))
    setPendingPin(null)
    if (untagged.length <= 1) setStep(3)
  }

  function autoPlaceRest() {
    setProducts(prev => {
      let spot = 0
      return prev.map(p => {
        if (p.tagged) return p
        const [x, y] = AUTO_SPOTS[spot % AUTO_SPOTS.length]
        spot++
        return { ...p, x_pct: x + (Math.random() * 6 - 3), y_pct: y + (Math.random() * 6 - 3), tagged: true }
      })
    })
    setPendingPin(null)
    setStep(3)
  }

  function askDemo(raw: string) {
    const q = raw.trim()
    if (!q) return
    const hit = matchProduct(q, products)
    let reply: string
    if (!hit) {
      reply = "It doesn't look like this store carries that — ask a team member to be sure."
      setActivePin(null)
    } else if (hit.x_pct == null || hit.y_pct == null) {
      reply = `${storeName} carries ${hit.name}, but the exact spot isn't pinned yet — ask a team member.`
      setActivePin(null)
    } else {
      reply = `Found it! ${hit.name} is pinned on the map — follow the pin.`
      setActivePin({ x: hit.x_pct, y: hit.y_pct, label: hit.name })
    }
    setMessages(prev => [...prev, { role: 'user', text: q }, { role: 'assistant', text: reply }])
    setChatQ('')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/demo`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function restart() {
    setStep(0)
    setStoreName(DEFAULT_STORE)
    setProductText(DEFAULT_PRODUCTS)
    setProducts([])
    setPendingPin(null)
    setMessages([])
    setActivePin(null)
    setChatQ('')
  }

  const suggestions = products.filter(p => p.x_pct != null).slice(0, 2)

  const primaryBtn = 'w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40'

  return (
    <div className="min-h-screen bg-background">
      {/* Banner (stays black — white logo) */}
      <div className="flex items-center justify-between bg-black px-4 py-3">
        <Image src="/logo.png" alt="Pinned" width={92} height={29} priority />
        <div className="text-xs text-zinc-400">
          Demo — no account needed ·{' '}
          <Link href="/onboarding" className="text-white underline underline-offset-2">
            Create a real store →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Progress rail */}
        <div className="mb-8 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => { if (i < step) setStep(i) }}
              className="flex flex-1 cursor-default flex-col items-center gap-1"
            >
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-foreground' : 'bg-border'}`} />
              <span className={`text-xs ${i === step ? 'font-semibold text-foreground' : 'text-faint'}`}>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Step 0: Store setup ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 1 · Try it with your own store</p>
              <h1 className="text-2xl font-bold">Set up your store</h1>
              <p className="mt-1 text-sm text-muted">Type your real store name — the whole demo will use it.</p>
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Store name</label>
                <input
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="e.g. Hank's Hardware"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Floor plan</label>
                <div className="relative overflow-hidden rounded-xl border border-border bg-white">
                  <img src={FLOOR_URL} alt="Demo floor plan" className="w-full" />
                  <div className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
                    Sample floor plan
                  </div>
                </div>
                <p className="mt-2 text-xs text-faint">
                  In the real app you upload a photo or sketch of your own layout.
                </p>
              </div>
            </div>
            <button onClick={() => setStep(1)} disabled={!storeName.trim()} className={primaryBtn}>
              Next: Add products →
            </button>
          </div>
        )}

        {/* ── Step 1: Products ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 2 · One paste, one click</p>
              <h1 className="text-2xl font-bold">Add your products</h1>
              <p className="mt-1 text-sm text-muted">
                One per line (commas work too). Edit the list — put in what {storeName.trim() || 'your store'} actually sells.
              </p>
            </div>
            <textarea
              value={productText}
              onChange={e => setProductText(e.target.value)}
              placeholder={'Paste your products, one per line'}
              rows={10}
              className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
            />
            <p className="text-xs text-faint">{parseProducts(productText).length} products detected</p>
            <button onClick={startTagging} disabled={!parseProducts(productText).length} className={primaryBtn}>
              Save & start tagging →
            </button>
          </div>
        )}

        {/* ── Step 2: Speed tagger ── */}
        {step === 2 && current && (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 3 · The 5-minute setup</p>
              <h1 className="text-2xl font-bold">Tag each product</h1>
              <p className="mt-1 text-sm text-muted">Tap the floor plan where each item lives, then confirm.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-sm text-muted">{taggedCount} of {products.length} tagged</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${(taggedCount / products.length) * 100}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-elevated px-4 py-3">
              <p className="mb-0.5 text-xs uppercase tracking-wide text-faint">Where is:</p>
              <p className="text-xl font-bold">{current.name}</p>
            </div>

            <div className="relative select-none overflow-hidden rounded-xl border border-border bg-white">
              <img
                ref={imgRef}
                src={FLOOR_URL}
                alt="Floor plan"
                className="w-full cursor-crosshair"
                onClick={handleFloorClick}
                draggable={false}
              />
              {products.filter(p => p.x_pct != null).map(p => (
                <div
                  key={p.id}
                  className="pointer-events-none absolute"
                  style={{ left: `${p.x_pct}%`, top: `${p.y_pct}%`, transform: 'translate(-50%,-100%)' }}
                >
                  <div className="h-2.5 w-2.5 rounded-full border border-white bg-zinc-400 shadow" />
                </div>
              ))}
              {pendingPin && (
                <div
                  className="pointer-events-none absolute"
                  style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%`, transform: 'translate(-50%,-100%)' }}
                >
                  <div className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-lg" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={skipPin}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted hover:bg-elevated"
              >
                Skip
              </button>
              <button
                onClick={confirmPin}
                disabled={!pendingPin}
                className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
              >
                Confirm pin
              </button>
            </div>

            <button
              onClick={autoPlaceRest}
              className="w-full text-center text-xs text-faint underline underline-offset-2 hover:text-muted"
            >
              Demo shortcut: auto-place the remaining {untagged.length} →
            </button>
          </div>
        )}

        {/* ── Step 3: Done / QR ── */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <div className="mb-2 text-4xl">🎉</div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Step 4 · That&apos;s the whole setup</p>
              <h1 className="text-2xl font-bold">{storeName.trim() || 'Your store'} is live!</h1>
              <p className="mt-2 text-sm text-muted">
                {taggedCount} products pinned. Print this QR, post it by the entrance, and customers can find anything themselves.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <canvas ref={canvasRef} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={copyLink}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-elevated"
              >
                {copied ? '✓ Copied' : 'Copy link'}
              </button>
              <button onClick={() => { setMessages([]); setActivePin(null); setStep(4) }} className={primaryBtn}>
                See what your customers see →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Customer view ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Customer view · What a QR scan opens</p>
              <h1 className="text-2xl font-bold">{storeName.trim() || 'Your store'}</h1>
              <p className="text-sm text-muted">Ask about the products you just tagged — the pin drops where you placed it.</p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border bg-white">
              <img src={FLOOR_URL} alt="Store map" className="w-full" draggable={false} />
              {activePin && (
                <div
                  className="pointer-events-none absolute"
                  style={{ left: `${activePin.x}%`, top: `${activePin.y}%`, transform: 'translate(-50%,-100%)' }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="whitespace-nowrap rounded-full bg-black px-2 py-0.5 text-xs text-white shadow-md">
                      {activePin.label}
                    </span>
                    <div className="h-5 w-5 animate-bounce rounded-full border-2 border-white bg-red-500 shadow-lg" />
                  </div>
                </div>
              )}
            </div>

            {messages.length === 0 && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => askDemo(`Where's the ${p.name.toLowerCase()}?`)}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-foreground hover:text-foreground"
                  >
                    Where&apos;s the {p.name.toLowerCase()}?
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-44 space-y-2 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-foreground text-background' : 'bg-elevated text-foreground'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); askDemo(chatQ) }} className="flex gap-2">
              <input
                value={chatQ}
                onChange={e => setChatQ(e.target.value)}
                placeholder="Where can I find…"
                className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={!chatQ.trim()}
                className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
              >
                Ask
              </button>
            </form>

            <div className="flex items-center justify-between pt-2">
              <button onClick={restart} className="text-xs text-faint underline underline-offset-2 hover:text-muted">
                ↺ Restart demo
              </button>
              <Link href="/onboarding" className="text-sm font-medium underline underline-offset-2">
                Set up your real store →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
