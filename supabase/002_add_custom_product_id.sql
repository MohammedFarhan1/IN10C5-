-- ============================================================
-- 002_add_custom_product_id.sql
-- Add custom product_id column to products table
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_id TEXT UNIQUE;
