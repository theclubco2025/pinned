-- Analytics queries log
CREATE TABLE IF NOT EXISTS queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  matched_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS queries_store_id_created_at ON queries(store_id, created_at DESC);

ALTER TABLE stores ADD COLUMN IF NOT EXISTS staff_pin TEXT;

ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read queries"
  ON queries FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

-- Server-side inserts via authenticated API (store must exist)
CREATE POLICY "Insert queries for existing stores"
  ON queries FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE id = store_id)
  );

-- Staff can read unmatched queries when staff_pin is set (via API with service logic)
CREATE POLICY "Public read queries by store for staff API"
  ON queries FOR SELECT
  USING (true);
