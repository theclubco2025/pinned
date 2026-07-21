'use client'

import { useMemo } from 'react'
import FloorPlanSVG from '@/components/floorplan/FloorPlanSVG'
import { getFloorPlan } from '@/lib/floorPlans/templates'
import { computeRoute } from '@/lib/floorPlans/route'
import type { RoutePoint } from '@/lib/floorPlans/types'

interface Pin {
  x_pct: number
  y_pct: number
  label?: string
}

interface Props {
  floorPlanUrl: string
  templateId?: string | null
  pin?: Pin | null
  /** precomputed route; if omitted it's derived from the pin */
  route?: RoutePoint[] | null
  showRoute?: boolean
}

export default function StoreMap({ floorPlanUrl, templateId, pin, route, showRoute = true }: Props) {
  const plan = getFloorPlan(templateId ?? null)

  const derivedRoute: RoutePoint[] | null = useMemo(() => {
    if (route !== undefined && route !== null) return route
    if (!plan || !pin || !showRoute) return null
    return computeRoute(plan, pin.x_pct, pin.y_pct)
  }, [plan, pin, route, showRoute])

  if (plan) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-[#101014] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        <FloorPlanSVG plan={plan} activePin={pin ? { ...pin, active: true } : null} route={derivedRoute} />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface">
      <img src={floorPlanUrl} alt="Store map" className="w-full object-contain" draggable={false} />
      {pin && (
        <div
          className="pointer-events-none absolute pin-glow-svg"
          style={{ left: `${pin.x_pct}%`, top: `${pin.y_pct}%`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="flex flex-col items-center gap-1">
            {pin.label && (
              <span className="whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-xs text-white shadow-md">
                {pin.label}
              </span>
            )}
            <div className="h-5 w-5 animate-bounce rounded-full border-2 border-white bg-red-500 shadow-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
