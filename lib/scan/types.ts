// Real-world store scan data model.
//
// This mirrors the shape of Apple ARKit RoomPlan output (CapturedRoom) in a
// framework-agnostic way so a future native iOS/Android companion can POST a
// scan and the web app can consume it unchanged. Nothing here depends on
// native code — the web build compiles and runs today; the capability layer
// simply reports "not supported in browser" until a native bridge is present.

export type ScanSource = 'roomplan' | 'arcore' | 'manual' | 'photogrammetry'

export interface Vec2 {
  x: number
  y: number
}

/** A wall as a floor-projected line segment, in meters. */
export interface ScannedWall {
  start: Vec2
  end: Vec2
  height?: number
}

/** A detected fixture/section (shelf run, counter, display), in meters. */
export interface ScannedObject {
  id: string
  /** RoomPlan-style category, mapped to our zone categories on convert */
  category: string
  label?: string
  center: Vec2
  size: { w: number; d: number }
  /** radians, floor-plane rotation */
  rotation?: number
}

export interface ScannedDoor {
  center: Vec2
  width: number
}

export interface RoomScan {
  source: ScanSource
  /** capture units — always meters for RoomPlan */
  unit: 'm'
  /** overall footprint in meters */
  bounds: { width: number; depth: number }
  walls: ScannedWall[]
  objects: ScannedObject[]
  doors: ScannedDoor[]
  capturedAt: string
  /** optional link to a USDZ/asset the native app uploaded */
  assetUrl?: string
}

/** Native bridge contract. A future Capacitor/WKWebView host injects this. */
export interface PinnedNativeScanBridge {
  isAvailable(): boolean
  /** Launch RoomPlan / ARCore capture and resolve with a normalized RoomScan. */
  startScan(): Promise<RoomScan>
}

declare global {
  interface Window {
    PinnedNativeScan?: PinnedNativeScanBridge
  }
}
