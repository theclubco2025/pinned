-- Store type for tailored onboarding + optional product category for auto-placement
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
