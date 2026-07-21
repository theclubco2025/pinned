ALTER TABLE stores ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage push subscriptions"
  ON push_subscriptions FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  );
