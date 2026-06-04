-- ============================================================
-- Tindahan POS - Complete Database Schema for Supabase/PostgreSQL
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- ── 1. Users Table ──────────────────────────────────────────
-- Stores the single admin account
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,   -- login identifier
  username       TEXT NOT NULL UNIQUE,   -- store name / display name
  password_hash  TEXT NOT NULL,          -- bcrypt hash, NEVER store plain text
  profile_photo  TEXT,                   -- base64-encoded avatar (optional)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Products Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode        TEXT UNIQUE,          -- EAN-13, UPC-A, Code 128 (nullable)
  name           TEXT NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  cost_price     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  selling_price  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  category       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast barcode lookups during scanning
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ── 3. Sales Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number  TEXT NOT NULL UNIQUE,  -- e.g. TXN-20260604-1234
  total_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- ── 4. Sale Items Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10, 2) NOT NULL,  -- Price at time of sale (snapshot)
  subtotal    NUMERIC(12, 2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- ── 5. Activity Logs Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action       TEXT NOT NULL,       -- e.g. 'Login', 'Product Added', 'Sale Completed'
  description  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- SEED: Create the admin user
-- Password: admin123 (bcrypt hash - 10 rounds)
-- Generate fresh hash: SELECT crypt('admin123', gen_salt('bf', 10))
-- ============================================================
INSERT INTO users (email, username, password_hash)
VALUES (
  'admin@tindahan.pos',
  'admin',
  '$2b$10$Vg0sGUvAnEQFuyLGjWUdQO68FqoL3u.rEG20fXLM5gTnn2pZlILD2'  -- admin123
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SEED: Sample products for testing
-- ============================================================
INSERT INTO products (barcode, name, quantity, cost_price, selling_price, category) VALUES
  ('4800888117460', 'Coca-Cola 1.5L',       24, 55.00,  70.00,  'Beverages'),
  ('4800888117477', 'Sprite 1.5L',           18, 55.00,  70.00,  'Beverages'),
  ('4806501005513', 'Lucky Me Pancit Canton', 30, 8.50,   12.00,  'Noodles'),
  ('4800194311055', 'Chippy Barbecue 110g',   20, 22.00,  30.00,  'Snacks'),
  ('4800888117484', 'Royal Tru-Orange 1.5L',  12, 55.00,  70.00,  'Beverages'),
  ('7610400071564', 'Nescafe 3-in-1 Original', 50, 7.50,  12.00,  'Beverages'),
  ('4800053001309', 'Argentina Corned Beef 150g', 15, 45.00, 60.00, 'Canned Goods'),
  ('4800314220082', 'Marca Piña Vinegar 1L',   10, 30.00,  42.00,  'Condiments'),
  (NULL,            'Pandesal (each)',           100, 2.00,  3.00,  'Bakery'),
  (NULL,            'Plastic Bag (small)',        200, 0.50,  1.00,  'Others')
ON CONFLICT (barcode) DO NOTHING;
