import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { roomScanToFloorPlan } from '@/lib/scan/convert'
import type { RoomScan } from '@/lib/scan/types'
import type { StarterPackId } from '@/lib/starterPacks'

/**
 * Accepts a real-world room scan (from the future Pinned native app) and
 * converts it into the app's structured FloorPlan, persisting both the raw
 * scan and the derived plan. Web clients never call this today; it exists so
 * the native LiDAR pipeline is ready to plug in with zero web changes.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { storeId, scan, storeType, label } = body as {
    storeId: string
    scan: RoomScan
    storeType?: StarterPackId
    label?: string
  }

  if (!storeId || !scan?.bounds || !Array.isArray(scan.objects)) {
    return NextResponse.json({ error: 'Missing or invalid scan payload' }, { status: 400 })
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id, store_type, name')
    .eq('id', storeId)
    .eq('owner_email', user.email!)
    .single()

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const floorPlan = roomScanToFloorPlan(scan, {
    id: `scan-${storeId}`,
    label: label || store.name || 'Scanned store',
    storeType: (storeType ?? (store.store_type as StarterPackId) ?? 'grocery'),
  })

  // Persist raw scan + derived plan. Columns are added in migration 005;
  // if they aren't present yet we still return the converted plan so the
  // native app / preview works before the backend is fully wired.
  let persisted = false
  try {
    const { error } = await supabase
      .from('stores')
      .update({ floor_scan: scan, floor_plan: floorPlan })
      .eq('id', storeId)
    persisted = !error
  } catch {
    persisted = false
  }

  return NextResponse.json({ floorPlan, persisted })
}
