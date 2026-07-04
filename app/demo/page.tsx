'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// ─── Floor plan SVG (encoded as data URL so <img> and click math both work) ───

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

// ─── Demo data ──────────────────────────────────────────────────────────────

type Product = {
  id: string
  name: string
  x_pct: number | null
  y_pct: number | null
  tagged: boolean
  aisle_label: string | null
}

const SEED_PRODUCTS: Product[] = [
  { id: '1', name: 'Whole Milk',      x_pct: 12, y_pct: 36, tagged: true,  aisle_label: 'Dairy'   },
  { id: '2', name: 'Organic Eggs',    x_pct: 12, y_pct: 50, tagged: true,  aisle_label: 'Dairy'   },
  { id: '3', name: 'Chicken Breast',  x_pct: 33, y_pct: 34, tagged: true,  aisle_label: 'Meat'    },
  { id: '4', name: 'Sourdough Bread', x_pct: 87, y_pct: 36, tagged: true,  aisle_label: 'Bakery'  },
  { id: '5', name: 'Orange Juice',    x_pct: 87, y_pct: 62, tagged: true,  aisle_label: 'Drinks'  },
  { id: '6', name: 'WD-40',          x_pct: 55, y_pct: 46, tagged: true,  aisle_label: 'Aisle 2' },
  { id: '7', name: 'Cheddar Cheese',  x_pct: null, y_pct: null, tagged: false, aisle_label: null },
  { id: '8', name: 'Pasta',           x_pct: null, y_pct: null, tagged: false, aisle_label: null },
  { id: '9', name: 'Batteries',       x_pct: null, y_pct: null, tagged: false, aisle_label: null },
]

const SAMPLE_TEXT = SEED_PRODUCTS.map(p => p.name).join('\n')

// Products that need tagging in the demo
const TO_TAG = SEED_PRODUCTS.filter(p => !p.tagged)

function clientMatch(q: string, products: Product[]): { product: Product | null; message: string } {
  const lower = q.toLowerCase()
  const hit = products.find(p => {
    const n = p.name.toLowerCase()
    return lower.includes(n) || n.split(' ').some(w => w.length > 3 && lower.includes(w))
  })
  if (!hit) return { product: null, message: "Not mapped yet — ask a team member." }
  if (!hit.tagged || hit.x_pct == null)
    return { product: null, message: `We carry ${hit.name} but the exact spot isn't pinned yet — ask a team member.` }
  return { product: hit, message: `${hit.name} is in the ${hit.aisle_label} section — see the pin on the map!` }
}

// ─── Main demo wizard ────────────────────────────────────────────────────────

const STEP_LABELS = ['Store setup', 'Add products', 'Tag items', 'Go live', 'Customer view']

export default function DemoPage() {
  const [step, setStep] = useState(0)

  // Speed-tagger state
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS)
  const [tagIdx, setTagIdx] = useState(0)
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Customer-view state
  const [chatQ, setChatQ] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [activePin, setActivePin] = useState<{ x_pct: number; y_pct: number; label: string } | null>(null)

  // QR canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/demo` : 'https://pinned.app/demo'
      import('qrcode').then(QR => QR.toCanvas(canvasRef.current!, url, { width: 200, margin: 2 }))
    }
  }, [step])

  const currentProduct = TO_TAG[tagIdx]
  const tagged = TO_TAG.length - (TO_TAG.length - tagIdx)

  function handleFloorClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = imgRef.current!.getBoundingClientRect()
    setPendingPin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  function confirmPin() {
    if (!pendingPin || !currentProduct) return
    setProducts(prev =>
      prev.map(p =>
        p.id === currentProduct.id
          ? { ...p, x_pct: pendingPin.x, y_pct: pendingPin.y, tagged: true, aisle_label: 'Tagged' }
          : p
      )
    )
    setPendingPin(null)
    if (tagIdx + 1 >= TO_TAG.length) { setStep(3); return }
    setTagIdx(i => i + 1)
  }

  function skipPin() {
    setPendingPin(null)
    if (tagIdx + 1 >= TO_TAG.length) { setStep(3); return }
    setTagIdx(i => i + 1)
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatQ.trim()) return
    const q = chatQ.trim()
    const { product, message } = clientMatch(q, products)
    setMessages(prev => [...prev, { role: 'user', text: q }, { role: 'assistant', text: message }])
    setActivePin(product && product.x_pct != null && product.y_pct != null
      ? { x_pct: product.x_pct, y_pct: product.y_pct, label: product.aisle_label ?? '' }
      : null)
    setChatQ('')
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Demo banner */}
      <div className="bg-black px-4 py-2 text-center text-xs font-medium text-white">
        DEMO MODE — no account needed &nbsp;·&nbsp;
        <Link href="/onboarding" className="underline underline-offset-2">Create a real store →</Link>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-black' : 'bg-zinc-200'}`} />
              <span className={`text-xs ${i === step ? 'font-semibold text-black' : 'text-zinc-400'}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 0: Store setup ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Step 2 of 5</p>
              <h1 className="text-2xl font-bold">Set up your store</h1>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-zinc-700">Store name</label>
                <input
                  readOnly
                  defaultValue="Sullivan's Grocery"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm bg-zinc-50"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700">Floor plan</label>
                <div className="relative rounded-xl overflow-hidden border border-zinc-200">
                  <img src={FLOOR_URL} alt="Demo floor plan" className="w-full" />
                  <div className="absolute top-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
                    ✓ Uploaded
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Next: Add products →
            </button>
          </div>
        )}

        {/* ── Step 1: Products ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Step 3 of 5</p>
              <h1 className="text-2xl font-bold">Add your products</h1>
              <p className="mt-1 text-sm text-zinc-500">One per line. Copy-paste from a spreadsheet or just type them in.</p>
            </div>
            <textarea
              readOnly
              defaultValue={SAMPLE_TEXT}
              rows={10}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm resize-none"
            />
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save & start tagging →
            </button>
          </div>
        )}

        {/* ── Step 2: Speed tagger ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Step 4 of 5</p>
              <h1 className="text-2xl font-bold">Tag each product</h1>
              <p className="mt-1 text-sm text-zinc-500">Tap where each item lives on the floor plan.</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">{tagged} of {TO_TAG.length} tagged</span>
              <div className="h-1.5 flex-1 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all"
                  style={{ width: `${(tagged / TO_TAG.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current product */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400 mb-0.5">Where is:</p>
              <p className="text-xl font-bold">{currentProduct?.name}</p>
            </div>

            {/* Floor plan */}
            <div className="relative select-none rounded-xl overflow-hidden border border-zinc-200">
              <img
                ref={imgRef}
                src={FLOOR_URL}
                alt="Floor plan"
                className="w-full cursor-crosshair"
                onClick={handleFloorClick}
                draggable={false}
              />
              {pendingPin && (
                <div
                  className="absolute pointer-events-none"
                  style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%`, transform: 'translate(-50%,-100%)' }}
                >
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={skipPin}
                className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Skip
              </button>
              <button
                onClick={confirmPin}
                disabled={!pendingPin}
                className="flex-1 rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                Confirm pin
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done / QR ── */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <div className="mb-2 text-4xl">🎉</div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Step 5 of 5</p>
              <h1 className="text-2xl font-bold">You're live!</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Print this QR and post it in <strong>Sullivan's Grocery</strong>. Customers scan to ask where anything is.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <canvas ref={canvasRef} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={copyLink}
                className="w-full rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Copy link
              </button>
              <button
                onClick={() => { setMessages([]); setActivePin(null); setStep(4) }}
                className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                See what customers see →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Customer view ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Customer view</p>
              <h1 className="text-2xl font-bold">Sullivan's Grocery</h1>
              <p className="text-sm text-zinc-500">This is what someone sees after scanning the QR code.</p>
            </div>

            {/* Floor plan with pin */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
              <img src={FLOOR_URL} alt="Store map" className="w-full" draggable={false} />
              {activePin && (
                <div
                  className="absolute pointer-events-none"
                  style={{ left: `${activePin.x_pct}%`, top: `${activePin.y_pct}%`, transform: 'translate(-50%,-100%)' }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {activePin.label && (
                      <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white shadow-md whitespace-nowrap">
                        {activePin.label}
                      </span>
                    )}
                    <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-lg animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat history */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.length === 0 && (
                <div className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500">
                  Try asking: <em>"Where's the WD-40?"</em> or <em>"Where can I find milk?"</em>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatQ}
                onChange={e => setChatQ(e.target.value)}
                placeholder="Where can I find…"
                className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={!chatQ.trim()}
                className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                Ask
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link href="/onboarding" className="text-sm font-medium underline underline-offset-2">
                Set up your own store →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
