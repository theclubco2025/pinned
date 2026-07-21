import type { FloorPlan, RoutePoint } from './types'
import { findNearestZone, planCoordsFromPct } from './templates'

const GRID = 20

function isBlocked(plan: FloorPlan, gx: number, gy: number, cols: number, rows: number): boolean {
  if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return true
  const x = (gx + 0.5) * (plan.viewBox.w / cols)
  const y = (gy + 0.5) * (plan.viewBox.h / rows)
  for (const z of plan.zones) {
    const { x: zx, y: zy, w, h } = z.rect
    if (x >= zx && x <= zx + w && y >= zy && y <= zy + h) return true
  }
  if (plan.checkout) {
    const { x: zx, y: zy, w, h } = plan.checkout
    if (x >= zx && x <= zx + w && y >= zy && y <= zy + h) return true
  }
  return false
}

function toGrid(plan: FloorPlan, x: number, y: number, cols: number, rows: number) {
  return {
    gx: Math.max(0, Math.min(cols - 1, Math.floor((x / plan.viewBox.w) * cols))),
    gy: Math.max(0, Math.min(rows - 1, Math.floor((y / plan.viewBox.h) * rows))),
  }
}

function fromGrid(plan: FloorPlan, gx: number, gy: number, cols: number, rows: number): RoutePoint {
  return {
    x: ((gx + 0.5) / cols) * plan.viewBox.w,
    y: ((gy + 0.5) / rows) * plan.viewBox.h,
  }
}

/** BFS orthogonal path from entrance to target pin (percent coords). */
export function computeRoute(
  plan: FloorPlan,
  targetX_pct: number,
  targetY_pct: number
): RoutePoint[] {
  const cols = GRID
  const rows = GRID
  const start = toGrid(plan, plan.entrance.x, plan.entrance.y, cols, rows)
  const target = planCoordsFromPct(plan, targetX_pct, targetY_pct)
  const end = toGrid(plan, target.x, target.y, cols, rows)

  const key = (gx: number, gy: number) => `${gx},${gy}`
  const queue: { gx: number; gy: number }[] = [start]
  const prev = new Map<string, string | null>()
  prev.set(key(start.gx, start.gy), null)

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]

  while (queue.length) {
    const cur = queue.shift()!
    if (cur.gx === end.gx && cur.gy === end.gy) break
    for (const [dx, dy] of dirs) {
      const nx = cur.gx + dx
      const ny = cur.gy + dy
      const k = key(nx, ny)
      if (prev.has(k)) continue
      if (isBlocked(plan, nx, ny, cols, rows)) continue
      prev.set(k, key(cur.gx, cur.gy))
      queue.push({ gx: nx, gy: ny })
    }
  }

  const endKey = key(end.gx, end.gy)
  if (!prev.has(endKey)) {
    return [
      { x: plan.entrance.x, y: plan.entrance.y },
      target,
    ]
  }

  const path: RoutePoint[] = []
  let cur: string | null = endKey
  while (cur) {
    const [gx, gy] = cur.split(',').map(Number)
    path.unshift(fromGrid(plan, gx, gy, cols, rows))
    cur = prev.get(cur) ?? null
  }
  path.push(target)
  return simplifyPath(path)
}

function simplifyPath(path: RoutePoint[]): RoutePoint[] {
  if (path.length <= 2) return path
  const out: RoutePoint[] = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const a = out[out.length - 1]
    const b = path[i]
    const c = path[i + 1]
    const sameLine =
      (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)
    if (!sameLine) out.push(b)
  }
  out.push(path[path.length - 1])
  return out
}

export function routeHint(plan: FloorPlan, targetX_pct: number, targetY_pct: number): string {
  const zone = findNearestZone(plan, targetX_pct, targetY_pct)
  if (zone) return `Head to ${zone.label} — it's marked on the map.`
  return 'Follow the route on the map to your item.'
}
