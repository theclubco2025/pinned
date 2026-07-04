'use client'

interface Pin {
  x_pct: number
  y_pct: number
  label?: string
}

interface Props {
  floorPlanUrl: string
  pin?: Pin | null
}

export default function StoreMap({ floorPlanUrl, pin }: Props) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
      <img
        src={floorPlanUrl}
        alt="Store map"
        className="w-full object-contain"
        draggable={false}
      />
      {pin && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${pin.x_pct}%`,
            top: `${pin.y_pct}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {pin.label && (
              <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white shadow-md whitespace-nowrap">
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
