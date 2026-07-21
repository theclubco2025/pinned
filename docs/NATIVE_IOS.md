# Pinned iOS App (Capacitor + RoomPlan)

The Pinned iOS app is a **Capacitor shell** that loads the production web app and adds **native LiDAR store scanning** via Apple RoomPlan. Customer-facing features (QR, chat, maps, feedback buttons) stay on the web — only owners need the App Store build to scan.

## Architecture

```text
Pinned iOS app (Capacitor)
  └── WKWebView → https://pinned-eight-flax.vercel.app
  └── PinnedScan plugin → RoomPlan → RoomScan JSON
        └── window.PinnedNativeScan (web bridge)
              └── ScanStorePanel → POST /api/stores/floor-scan
```

## Requirements

- macOS with Xcode 15+
- Apple Developer Program membership
- Physical **LiDAR** iPhone or iPad (iPhone 12 Pro+, iPad Pro 2020+)
- CocoaPods (`sudo gem install cocoapods`)

## Local build

```bash
# From repo root (Windows is fine for npm; Xcode steps need a Mac)
npm install
npm run cap:sync

# On Mac
cd ios/App
pod install
open App.xcworkspace
```

In Xcode:

1. Select your Team under **Signing & Capabilities**
2. Set bundle ID if needed (`app.pinned.ios`)
3. Connect a LiDAR device (simulator cannot scan)
4. Run **Product → Run**

### Point at a preview deploy (optional)

```bash
CAPACITOR_SERVER_URL=https://your-preview.vercel.app npm run cap:sync
```

Default server URL is in [capacitor.config.ts](../capacitor.config.ts).

## RoomPlan → RoomScan field mapping

Native capture produces JSON matching [lib/scan/types.ts](../lib/scan/types.ts):

| RoomScan field | Source (CapturedRoom) |
|---|---|
| `source` | `"roomplan"` |
| `unit` | `"m"` |
| `bounds.width/depth` | Normalized footprint from wall/object bounds |
| `walls[]` | `CapturedRoom.walls` — floor-projected line segments |
| `objects[]` | `CapturedRoom.objects` — category, center, size |
| `doors[]` | `CapturedRoom.doors` — entrance anchor for routing |
| `capturedAt` | ISO8601 timestamp |

Conversion lives in [ios/App/App/RoomScanConverter.swift](../ios/App/App/RoomScanConverter.swift). The web server runs the same shape through [lib/scan/convert.ts](../lib/scan/convert.ts) to produce a `FloorPlan`.

## Web bridge

[lib/native/installScanBridge.ts](../lib/native/installScanBridge.ts) registers `window.PinnedNativeScan` when the Capacitor plugin is available. [lib/scan/capability.ts](../lib/scan/capability.ts) detects it; [ScanStorePanel.tsx](../components/onboarding/ScanStorePanel.tsx) shows **Start LiDAR scan**.

## App Store submission checklist

1. **App name:** Pinned
2. **Category:** Business or Productivity
3. **Privacy:** Camera/LiDAR used for store layout scanning only
4. **Review notes:** Explain the app wraps the Pinned web dashboard but adds RoomPlan scanning — without native scan it would be a thin wrapper (Guideline 4.2). Include a test account if login is required.
5. **Screenshots:** Onboarding → Scan tab → scan UI → resulting map
6. **LiDAR requirement:** App requires ARKit; only runs meaningfully on LiDAR hardware

### Review timeline

Apple review typically takes **1–3 business days** after submission. Plan for that — “live tonight” usually means **submitted** tonight, not approved.

## Database migrations (required for scan persistence)

Run in Supabase SQL editor before testing end-to-end scan upload:

- [005_floor_scan.sql](../supabase/migrations/005_floor_scan.sql) — `floor_scan`, `floor_plan` on stores
- [006_customer_reports.sql](../supabase/migrations/006_customer_reports.sql) — customer feedback reports

## Troubleshooting

| Issue | Fix |
|---|---|
| Scan button says “coming to iOS app” in browser | Expected — use the native app |
| `RoomCaptureSession.isSupported` false | Device has no LiDAR |
| Upload returns `persisted: false` | Run migration 005 |
| Pod install fails | `cd ios/App && pod repo update && pod install` |
| Plugin not found in JS | Run `npm run cap:sync` after Swift changes |
