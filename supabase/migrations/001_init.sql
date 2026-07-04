-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  floor_plan_url TEXT,
  qr_slug TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  aisle_label TEXT,
  x_pct NUMERIC,
  y_pct NUMERIC,
  tagged BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Stores: anyone can read, authenticated owner can write
CREATE POLICY "Public read stores"
  ON stores FOR SELECT USING (true);

CREATE POLICY "Owner insert store"
  ON stores FOR INSERT
  WITH CHECK (owner_email = auth.jwt() ->> 'email');

CREATE POLICY "Owner update store"
  ON stores FOR UPDATE
  USING (owner_email = auth.jwt() ->> 'email');

-- Products: anyone can read, store owner can write
CREATE POLICY "Public read products"
  ON products FOR SELECT USING (true);

CREATE POLICY "Owner insert products"
  ON products FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Owner update products"
  ON products FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

-- Storage bucket: create manually in Supabase dashboard
-- Bucket name: pinned-assets
-- Set to PUBLIC so floor plan images are accessible via public URL
-- Add Storage policy: authenticated users can upload to floor-plans/{storeId}.*
