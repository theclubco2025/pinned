'use client'

import { registerPlugin } from '@capacitor/core'
import type { RoomScan } from '@/lib/scan/types'

interface PinnedScanPlugin {
  isAvailable(): Promise<{ available: boolean }>
  startScan(): Promise<RoomScan>
}

const PinnedScan = registerPlugin<PinnedScanPlugin>('PinnedScan')

let bridgeInstalled = false
let cachedAvailable = false

/**
 * Installs window.PinnedNativeScan when running inside the Capacitor iOS shell.
 * Safe to call on every page load — no-ops in the browser.
 */
export async function installNativeScanBridge(): Promise<void> {
  if (typeof window === 'undefined' || bridgeInstalled) return

  try {
    const { available } = await PinnedScan.isAvailable()
    cachedAvailable = available
    if (!available) return

    window.PinnedNativeScan = {
      isAvailable: () => cachedAvailable,
      startScan: async () => {
        const scan = await PinnedScan.startScan()
        return scan
      },
    }
    bridgeInstalled = true
  } catch {
    // Not in native shell or plugin not registered
  }
}

export function resetScanBridgeCacheForTests() {
  bridgeInstalled = false
  cachedAvailable = false
}
