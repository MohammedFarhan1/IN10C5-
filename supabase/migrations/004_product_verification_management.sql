-- ============================================================
-- 004_product_verification_management.sql
-- Product Verification Management module
-- ============================================================

-- Product metadata required by seller-side verification workflows.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS manufacturing_details TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS verification_methods TEXT[] NOT NULL DEFAULT '{}';

-- One row per physical product identity. A product with quantity 10 can have
-- 10 distinct verification identities.
CREATE TABLE IF NOT EXISTS verification_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  serialized_unit_id UUID REFERENCES serialized_units(id) ON DELETE SET NULL,
  tracked_unit_id UUID REFERENCES tracked_units(id) ON DELETE SET NULL,
  verification_id TEXT NOT NULL UNIQUE,
  qr_id TEXT UNIQUE,
  barcode_id TEXT UNIQUE,
  nfc_id TEXT UNIQUE,
  qr_code_url TEXT,
  barcode_value TEXT,
  methods TEXT[] NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'Unverified'
    CHECK (verification_status IN ('Active', 'Unverified', 'Suspicious', 'Blocked')),
  activation_status TEXT NOT NULL DEFAULT 'Inactive',
  verification_date TIMESTAMPTZ,
  last_scan_at TIMESTAMPTZ,
  total_scans INTEGER NOT NULL DEFAULT 0,
  successful_verifications INTEGER NOT NULL DEFAULT 0,
  failed_verifications INTEGER NOT NULL DEFAULT 0,
  duplicate_attempts INTEGER NOT NULL DEFAULT 0,
  high_risk_device_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_identities_product
  ON verification_identities(product_id);
CREATE INDEX IF NOT EXISTS idx_verification_identities_seller
  ON verification_identities(seller_id);
CREATE INDEX IF NOT EXISTS idx_verification_identities_lookup
  ON verification_identities(verification_id, qr_id, barcode_id, nfc_id);
CREATE INDEX IF NOT EXISTS idx_verification_identities_status
  ON verification_identities(verification_status, activation_status);

-- Existing projects may already have verification_logs from the tracked units
-- migration. Add the columns needed by the new verification identity module.
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verification_logs
  ADD COLUMN IF NOT EXISTS unit_code TEXT;

ALTER TABLE verification_logs
  ALTER COLUMN unit_code DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS verification_identity_id UUID REFERENCES verification_identities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS verification_id TEXT,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scan_result TEXT NOT NULL DEFAULT 'failed',
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS platform_type TEXT,
  ADD COLUMN IF NOT EXISTS geolocation TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_reasons TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_verification_logs_identity
  ON verification_logs(verification_identity_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_seller_scanned
  ON verification_logs(seller_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_result
  ON verification_logs(scan_result);

CREATE TABLE IF NOT EXISTS fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_identity_id UUID REFERENCES verification_identities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  evidence JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_seller_status
  ON fraud_logs(seller_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_scans INTEGER NOT NULL DEFAULT 0,
  weekly_scans INTEGER NOT NULL DEFAULT 0,
  monthly_scans INTEGER NOT NULL DEFAULT 0,
  consumer_engagement INTEGER NOT NULL DEFAULT 0,
  region_activity JSONB NOT NULL DEFAULT '{}',
  trust_score INTEGER NOT NULL DEFAULT 100,
  product_popularity INTEGER NOT NULL DEFAULT 0,
  fraud_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, product_id, metric_date)
);

CREATE TABLE IF NOT EXISTS consumer_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  feedback TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumer_activity_product
  ON consumer_activity(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_seller
  ON notifications(seller_id, read_at, created_at DESC);

CREATE OR REPLACE FUNCTION update_verification_identity_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_identities_updated_at ON verification_identities;
CREATE TRIGGER trg_verification_identities_updated_at
  BEFORE UPDATE ON verification_identities
  FOR EACH ROW EXECUTE FUNCTION update_verification_identity_updated_at();

ALTER TABLE verification_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active verification identities" ON verification_identities;
CREATE POLICY "Public can read active verification identities"
  ON verification_identities FOR SELECT
  USING (activation_status = 'Active');

DROP POLICY IF EXISTS "Service role full verification identities" ON verification_identities;
CREATE POLICY "Service role full verification identities"
  ON verification_identities FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full fraud logs" ON fraud_logs;
CREATE POLICY "Service role full fraud logs"
  ON fraud_logs FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full analytics" ON analytics_data;
CREATE POLICY "Service role full analytics"
  ON analytics_data FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full consumer activity" ON consumer_activity;
CREATE POLICY "Service role full consumer activity"
  ON consumer_activity FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full notifications" ON notifications;
CREATE POLICY "Service role full notifications"
  ON notifications FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);
