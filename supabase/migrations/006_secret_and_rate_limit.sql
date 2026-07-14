-- ============================================================
-- 006_secret_and_rate_limit.sql
-- Trusta Verification ID: secret suffix + rate limiting
-- Builds on 005_verification_id_system.sql
-- ============================================================

-- 1. Add secret_suffix to each physical unit
ALTER TABLE product_units
  ADD COLUMN IF NOT EXISTS secret_suffix TEXT NOT NULL DEFAULT '';

-- 2. Replace global unique constraint on product_code with per-seller unique
--    (product_code need only be unique within a seller's catalog)
DROP INDEX IF EXISTS idx_products_product_code;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_seller_product_code
  ON products(seller_id, product_code)
  WHERE product_code IS NOT NULL;

-- 3. Ensure variant_code is unique within a product (not globally)
CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_product_variant_code
  ON product_variants(product_id, variant_code)
  WHERE variant_code IS NOT NULL;

-- 4. Rate limiting table – one row per attempt, pruned by a cron/background job
CREATE TABLE IF NOT EXISTS verification_attempts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address    TEXT        NOT NULL,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vattempts_ip_time
  ON verification_attempts(ip_address, attempted_at DESC);

-- 5. Enable RLS on verification_attempts (service role writes; no user reads needed)
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full attempts" ON verification_attempts;
CREATE POLICY "Service role full attempts" ON verification_attempts
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);
