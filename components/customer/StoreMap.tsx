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
  showRoute?: boolean
}

export default function StoreMap({ floorPlanUrl, templateId, pin, showRoute = true }: Props) {
  const plan = getFloorPlan(templateId ?? null)

  const route: RoutePoint[] | null = useMemo(() => {
    if (!plan || !pin || !showRoute) return null
    return computeRoute(plan, pin.x_pct, pin.y_pct)
  }, [plan, pin, showRoute])

  if (plan) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-border bg-surface transition-all duration-300">
        <FloorPlanSVG
          plan={plan}
          activePin={pin ? { ...pin, active: true } : null}
          route={route}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-surface">
      <img
        src={floorPlanUrl}
        alt="Store map"
        className="w-full object-contain"
        draggable={false}
      />
      {pin && (
        <div
          className="absolute pointer-events-none pin-glow-svg"
          style={{
            left: `${pin.x_pct}%`,
            top: `${pin.y_pct}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {pin.label && (
              <span className="rounded-full bg-black/80 px-2 py-0.5 text-xs text-white shadow-md whitespace-nowrap">
                {pin.label}
              </span>
            )}
            <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-lg animate-bounce" />
          </div>
        </div>
      )}
    </div>
  )
}
