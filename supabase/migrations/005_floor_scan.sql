-- Real-world store scans (LiDAR / AR) — future native pipeline.
-- Safe to run now; the web app works with or without these columns.
-- floor_scan  = raw normalized RoomScan JSON uploaded by the native app
-- floor_plan  = derived structured FloorPlan JSON the customer view can render
ALTER TABLE stores ADD COLUMN IF NOT EXISTS floor_scan JSONB;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS floor_plan JSONB;
