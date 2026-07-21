'use client'

import type { RoomScan } from './types'

export type ScanPlatform = 'native' | 'ios-web' | 'android-web' | 'desktop-web'

export interface ScanCapability {
  /** true only when a native scanning bridge is actually present */
  supported: boolean
  platform: ScanPlatform
  /** human-readable explanation for the UI */
  reason: string
}

/**
 * Reports whether real LiDAR/AR store scanning is available in the current
 * runtime. Today this is only true inside the (future) Pinned native app,
 * which injects `window.PinnedNativeScan`. In every browser it returns a clear,
 * user-facing reason instead of failing — the roadmap is visible, the code is
 * ready, and nothing breaks on the web.
 */
export function getScanCapability(): ScanCapability {
  if (typeof window === 'undefined') {
    return { supported: false, platform: 'desktop-web', reason: 'Scanning runs on the device.' }
  }

  if (window.PinnedNativeScan?.isAvailable()) {
    return { supported: true, platform: 'native', reason: 'LiDAR scanning ready on this device.' }
  }

  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)

  if (isIOS) {
    return {
      supported: false,
      platform: 'ios-web',
      reason: 'LiDAR room scanning is coming to the Pinned iOS app — your scan will import here automatically.',
    }
  }
  if (isAndroid) {
    return {
      supported: false,
      platform: 'android-web',
      reason: 'AR store scanning is coming to the Pinned mobile app.',
    }
  }
  return {
    supported: false,
    platform: 'desktop-web',
    reason: 'Scan your store on a LiDAR-equipped iPhone/iPad with the Pinned app — the map imports here instantly.',
  }
}

/** Trigger a native scan if available; otherwise reject with a clear message. */
export async function requestStoreScan(): Promise<RoomScan> {
  if (typeof window !== 'undefined' && window.PinnedNativeScan?.isAvailable()) {
    return window.PinnedNativeScan.startScan()
  }
  throw new Error('Native scanning is not available in the browser. Use the Pinned mobile app.')
}
