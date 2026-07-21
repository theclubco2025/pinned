'use client'

import { useId } from 'react'
import type { FloorPlan, MapPin, RoutePoint, Zone } from '@/lib/floorPlans/types'
import { zoneStyle } from '@/lib/floorPlans/style'

interface Props {
  plan: FloorPlan
  pins?: MapPin[]
  activePin?: MapPin | null
  route?: RoutePoint[] | null
  className?: string
  thumbnail?: boolean
  onClick?: (x_pct: number, y_pct: number, e: React.MouseEvent) => void
  interactive?: boolean
  /** animate a walking dot along the route (auto-on when a route is shown) */
  animateWalker?: boolean
}

function routeToPath(route: RoutePoint[]): string {
  return route.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

function ZoneFixture({
  zone,
  uid,
  thumbnail,
}: {
  zone: Zone
  uid: string
  thumbnail: boolean
}) {
  const s = zoneStyle(zone.category)
  const { x, y, w, h } = zone.rect
  const gradId = `${uid}-g-${zone.id}`
  const cx = x + w / 2
  const cy = y + h / 2
  const vertical = h >= w
  const iconSize = Math.min(w, h) * (thumbnail ? 0.42 : 0.34)

  // shelving detail lines for walkable aisles
  const shelves: React.ReactNode[] = []
  if (s.aisle && !thumbnail) {
    if (vertical) {
      const gap = 26
      for (let ly = y + gap; ly < y + h - 8; ly += gap) {
        shelves.push(
          <line key={ly} x1={x + 8} y1={ly} x2={x + w - 8} y2={ly} stroke={s.stroke} strokeOpacity={0.18} strokeWidth={1} />
        )
      }
    } else {
      const gap = 26
      for (let lx = x + gap; lx < x + w - 8; lx += gap) {
        shelves.push(
          <line key={lx} x1={lx} y1={y + 8} x2={lx} y2={y + h - 8} stroke={s.stroke} strokeOpacity={0.18} strokeWidth={1} />
        )
      }
    }
  }

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.from} />
          <stop offset="100%" stopColor={s.to} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={`url(#${gradId})`} />
      {/* top highlight for depth */}
      <rect x={x} y={y} width={w} height={Math.min(10, h / 3)} rx={8} fill="#ffffff" opacity={0.06} />
      {/* category edge */}
      <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke={s.stroke} strokeOpacity={0.5} strokeWidth={1.5} />

      {shelves}

      {/* watermark icon */}
      <g
        transform={`translate(${cx - iconSize / 2}, ${cy - iconSize / 2 - (thumbnail ? 0 : 8)}) scale(${iconSize / 24})`}
        opacity={thumbnail ? 0.5 : 0.32}
      >
        <path d={s.icon} fill="none" stroke={s.stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <text
        x={cx}
        y={thumbnail ? cy + iconSize / 2 + 2 : y + h - 10}
        textAnchor="middle"
        dominantBaseline={thumbnail ? 'middle' : 'auto'}
        fill="#f4f4f5"
        fontSize={thumbnail ? 9 : 11}
        fontWeight={600}
        letterSpacing={0.3}
        fontFamily="system-ui,sans-serif"
      >
        {zone.label}
      </text>
    </g>
  )
}

export default function FloorPlanSVG({
  plan,
  pins = [],
  activePin,
  route,
  className = '',
  thumbnail = false,
  onClick,
  interactive = false,
  animateWalker,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const { w, h } = plan.viewBox

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    onClick(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100,
      e
    )
  }

  const hasRoute = !!route && route.length >= 2
  const routeD = hasRoute ? routeToPath(route!) : null
  const showWalker = hasRoute && !thumbnail && (animateWalker ?? true)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`${className} ${interactive ? 'cursor-crosshair' : ''} ${thumbnail ? '' : 'w-full'}`}
      onClick={handleClick}
      role="img"
      aria-label={`${plan.label} floor plan`}
    >
      <defs>
        <pattern id={`${uid}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#ffffff" strokeOpacity={0.035} strokeWidth={1} />
        </pattern>
        <radialGradient id={`${uid}-floor`} cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#1a1a1f" />
          <stop offset="100%" stopColor="#101014" />
        </radialGradient>
        <radialGradient id={`${uid}-vignette`} cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#000000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.35} />
        </radialGradient>
        <filter id={`${uid}-pin`} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
        </filter>
        <linearGradient id={`${uid}-pinfill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>

      {/* floor */}
      <rect width={w} height={h} rx={12} fill={`url(#${uid}-floor)`} />
      <rect width={w} height={h} rx={12} fill={`url(#${uid}-grid)`} />

      {/* perimeter wall */}
      <rect x={5} y={5} width={w - 10} height={h - 10} rx={10} fill="none" stroke="#52525b" strokeWidth={3} />

      {plan.zones.map(z => (
        <ZoneFixture key={z.id} zone={z} uid={uid} thumbnail={thumbnail} />
      ))}

      {/* checkout counter */}
      {plan.checkout && (
        <g>
          <rect
            x={plan.checkout.x}
            y={plan.checkout.y}
            width={plan.checkout.w}
            height={plan.checkout.h}
            rx={6}
            fill="#0c0c0f"
            stroke="#3f3f46"
            strokeWidth={1.5}
          />
          {!thumbnail &&
            Array.from({ length: Math.max(2, Math.floor(plan.checkout.w / 90)) }).map((_, i, arr) => {
              const seg = plan.checkout!.w / arr.length
              return (
                <rect
                  key={i}
                  x={plan.checkout!.x + seg * i + seg / 2 - 12}
                  y={plan.checkout!.y + plan.checkout!.h / 2 - 5}
                  width={24}
                  height={10}
                  rx={2}
                  fill="#22c55e"
                  opacity={0.55}
                />
              )
            })}
          <text
            x={plan.checkout.x + plan.checkout.w / 2}
            y={plan.checkout.y + plan.checkout.h / 2 + (thumbnail ? 3 : 4)}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize={thumbnail ? 8 : 10}
            fontWeight={700}
            letterSpacing={2}
            fontFamily="system-ui,sans-serif"
          >
            CHECKOUT
          </text>
        </g>
      )}

      {/* entrance: door gap + swing arc + label */}
      <g>
        <rect x={plan.entrance.x - 34} y={h - 12} width={68} height={7} rx={3} fill="#101014" />
        {!thumbnail && (
          <path
            d={`M ${plan.entrance.x - 30} ${h - 8} A 30 30 0 0 1 ${plan.entrance.x} ${h - 38}`}
            fill="none"
            stroke="#22c55e"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        )}
        <text
          x={plan.entrance.x}
          y={h - (thumbnail ? 15 : 16)}
          textAnchor="middle"
          fill="#71717a"
          fontSize={thumbnail ? 7 : 9}
          fontWeight={600}
          letterSpacing={1.5}
          fontFamily="system-ui,sans-serif"
        >
          ENTRANCE
        </text>
      </g>

      {/* wayfinding route */}
      {routeD && (
        <>
          <path d={routeD} fill="none" stroke="var(--color-accent, #818cf8)" strokeOpacity={0.22} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={routeD}
            fill="none"
            stroke="var(--color-accent, #818cf8)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="9 7"
            className="route-animate"
          />
          {showWalker && (
            <g>
              <circle r={7} fill="var(--color-accent, #818cf8)" opacity={0.25}>
                <animateMotion dur="4s" repeatCount="indefinite" path={routeD} />
              </circle>
              <circle r={4} fill="#ffffff">
                <animateMotion dur="4s" repeatCount="indefinite" path={routeD} />
              </circle>
            </g>
          )}
        </>
      )}

      {/* "You are here" origin */}
      {hasRoute && !thumbnail && (
        <g transform={`translate(${plan.entrance.x}, ${plan.entrance.y})`}>
          <circle r={9} fill="var(--color-accent, #818cf8)" opacity={0.25}>
            <animate attributeName="r" values="7;13;7" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="var(--color-accent, #818cf8)" stroke="#fff" strokeWidth={2} />
        </g>
      )}

      {/* passive pins */}
      {pins.map((pin, i) => (
        <circle
          key={i}
          cx={(pin.x_pct / 100) * w}
          cy={(pin.y_pct / 100) * h}
          r={5}
          fill="#fb7185"
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}

      {/* destination pin (outer group positions, inner group animates the drop) */}
      {activePin && (
        <g transform={`translate(${(activePin.x_pct / 100) * w}, ${(activePin.y_pct / 100) * h})`}>
          <g className="pin-drop">
            {activePin.label && !thumbnail && (
              <g transform="translate(0,-44)">
                <rect
                  x={-Math.max(24, activePin.label.length * 3.4)}
                  y={-11}
                  width={Math.max(48, activePin.label.length * 6.8)}
                  height={18}
                  rx={9}
                  fill="#0c0c0f"
                  stroke="#3f3f46"
                  strokeWidth={1}
                />
                <text y={2} textAnchor="middle" fill="#fafafa" fontSize={10} fontWeight={600} fontFamily="system-ui,sans-serif">
                  {activePin.label}
                </text>
              </g>
            )}
            <g className="pin-glow-svg" filter={`url(#${uid}-pin)`}>
              <path
                d="M0 0 C -7 -11 -13 -15 -13 -23 A 13 13 0 1 1 13 -23 C 13 -15 7 -11 0 0 Z"
                fill={`url(#${uid}-pinfill)`}
                stroke="#fff"
                strokeWidth={1.5}
              />
              <circle cy={-23} r={5} fill="#fff" />
            </g>
          </g>
        </g>
      )}
    </svg>
  )
}
