-- ============================================================
-- 001_product_variants.sql
-- Product Variant System - Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to products table
-- ============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seller_sku  TEXT,
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create product_variants table
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    TEXT         UNIQUE,                      -- human-readable e.g. "PROD-001-V1"
  seller_sku    TEXT,                                     -- seller's internal SKU/barcode
  attributes    JSONB        NOT NULL DEFAULT '{}',       -- { "Color": "Red", "Size": "XL" }
  price         NUMERIC(12,2) NOT NULL,
  compare_price NUMERIC(12,2),
  quantity      INT          NOT NULL DEFAULT 0,
  images        TEXT[]       NOT NULL DEFAULT '{}',
  thumbnail     TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_is_active
  ON product_variants(product_id, is_active);

CREATE INDEX IF NOT EXISTS idx_product_variants_attributes
  ON product_variants USING GIN(attributes);

-- 4. Auto-update updated_at on variants
-- ============================================================
CREATE OR REPLACE FUNCTION update_variant_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_variant_updated_at ON product_variants;
CREATE TRIGGER trigger_variant_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_variant_updated_at();

-- 5. Row Level Security (RLS)
-- ============================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public read: only active variants of active products
CREATE POLICY "Public can view active variants"
  ON product_variants FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND p.is_active = TRUE
    )
  );

-- Sellers can manage their own product variants
CREATE POLICY "Sellers can manage own variants"
  ON product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND p.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND p.seller_id = auth.uid()
    )
  );

-- Service role (admin) has full access
CREATE POLICY "Service role can do anything on variants"
  ON product_variants FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
