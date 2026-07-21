'use client'

import type { FloorPlan, MapPin, RoutePoint } from '@/lib/floorPlans/types'

interface Props {
  plan: FloorPlan
  pins?: MapPin[]
  activePin?: MapPin | null
  route?: RoutePoint[] | null
  className?: string
  thumbnail?: boolean
  onClick?: (x_pct: number, y_pct: number, e: React.MouseEvent) => void
  interactive?: boolean
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
}: Props) {
  const { w, h } = plan.viewBox

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onClick) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100
    onClick(x_pct, y_pct, e)
  }

  const routePath =
    route && route.length >= 2
      ? route.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      : null

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`${className} ${interactive ? 'cursor-crosshair' : ''} ${thumbnail ? '' : 'w-full'}`}
      onClick={handleClick}
      role="img"
      aria-label={`${plan.label} floor plan`}
    >
      <rect width={w} height={h} fill="#141418" rx={6} />
      <rect x={8} y={8} width={w - 16} height={h - 16} fill="none" stroke="#3f3f46" strokeWidth={2} rx={6} />

      {plan.zones.map(z => (
        <g key={z.id}>
          <rect
            x={z.rect.x}
            y={z.rect.y}
            width={z.rect.w}
            height={z.rect.h}
            fill={z.color}
            rx={6}
            opacity={0.85}
          />
          <text
            x={z.rect.x + z.rect.w / 2}
            y={z.rect.y + z.rect.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#e4e4e7"
            fontSize={thumbnail ? 10 : 12}
            fontWeight={600}
            fontFamily="system-ui,sans-serif"
          >
            {z.label}
          </text>
        </g>
      ))}

      {plan.checkout && (
        <g>
          <rect
            x={plan.checkout.x}
            y={plan.checkout.y}
            width={plan.checkout.w}
            height={plan.checkout.h}
            fill="#27272a"
            rx={6}
          />
          <text
            x={plan.checkout.x + plan.checkout.w / 2}
            y={plan.checkout.y + plan.checkout.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fafafa"
            fontSize={thumbnail ? 9 : 13}
            fontWeight={600}
            letterSpacing={2}
            fontFamily="system-ui,sans-serif"
          >
            CHECKOUT
          </text>
        </g>
      )}

      {/* Entrance marker */}
      <g>
        <rect x={plan.entrance.x - 40} y={plan.entrance.y - 18} width={80} height={22} fill="#27272a" rx={3} />
        <text
          x={plan.entrance.x}
          y={plan.entrance.y - 4}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize={thumbnail ? 8 : 11}
          fontFamily="system-ui,sans-serif"
        >
          ENTRANCE
        </text>
      </g>

      {routePath && (
        <path
          d={routePath}
          fill="none"
          stroke="var(--color-accent, #818cf8)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 6"
          className="route-animate"
        />
      )}

      {pins.map((pin, i) => (
        <g
          key={i}
          transform={`translate(${(pin.x_pct / 100) * w}, ${(pin.y_pct / 100) * h})`}
        >
          <circle r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
        </g>
      ))}

      {activePin && (
        <g
          className="pin-glow-svg"
          transform={`translate(${(activePin.x_pct / 100) * w}, ${(activePin.y_pct / 100) * h})`}
        >
          {activePin.label && !thumbnail && (
            <text y={-14} textAnchor="middle" fill="#fafafa" fontSize={11} fontFamily="system-ui,sans-serif">
              {activePin.label}
            </text>
          )}
          <circle r={8} fill="#ef4444" stroke="#fff" strokeWidth={2.5} />
        </g>
      )}

      {/* Entrance "you are here" dot when route shown */}
      {route && route.length > 0 && !thumbnail && (
        <g transform={`translate(${plan.entrance.x}, ${plan.entrance.y})`}>
          <circle r={7} fill="var(--color-accent, #818cf8)" stroke="#fff" strokeWidth={2} />
          <text y={-12} textAnchor="middle" fill="var(--color-accent, #818cf8)" fontSize={10} fontFamily="system-ui,sans-serif">
            You are here
          </text>
        </g>
      )}
    </svg>
  )
}
