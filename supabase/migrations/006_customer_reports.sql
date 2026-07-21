-- Customer feedback reports (missing item, out of stock, other)
CREATE TABLE IF NOT EXISTS customer_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('missing', 'out_of_stock', 'other')),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_reports_store_status_created
  ON customer_reports(store_id, status, created_at DESC);

ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;

ALTER TABLE customer_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read customer_reports"
  ON customer_reports FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Owner update customer_reports"
  ON customer_reports FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Insert customer_reports for existing stores"
  ON customer_reports FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE id = store_id)
  );

CREATE POLICY "Public read customer_reports by store for staff API"
  ON customer_reports FOR SELECT
  USING (true);
