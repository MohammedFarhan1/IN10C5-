-- ── Core Entity: tracked_units ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracked_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  unique_unit_code TEXT UNIQUE NOT NULL,
  serial_number TEXT NOT NULL,
  qr_code_url TEXT,
  verification_status TEXT DEFAULT 'VERIFIED', -- 'VERIFIED', 'SUSPICIOUS', 'COUNTERFEIT', 'INVALID', 'REVOKED'
  ownership_status TEXT DEFAULT 'UNCLAIMED', -- 'UNCLAIMED', 'REGISTERED', 'DISPUTED', 'RESET'
  current_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  manufacture_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  warranty_expiry TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0,
  last_scan_location TEXT,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  fraud_flag BOOLEAN DEFAULT FALSE,
  counterfeit_reports_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_product_serial UNIQUE(product_id, serial_number)
);

-- Ensure variant_id column exists if table was previously initialized
ALTER TABLE tracked_units ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Indexes for tracked_units
CREATE INDEX IF NOT EXISTS idx_tracked_units_variant ON tracked_units(variant_id);
CREATE INDEX IF NOT EXISTS idx_tracked_units_code ON tracked_units(unique_unit_code);
CREATE INDEX IF NOT EXISTS idx_tracked_units_serial ON tracked_units(serial_number);
CREATE INDEX IF NOT EXISTS idx_tracked_units_fraud ON tracked_units(fraud_flag);
CREATE INDEX IF NOT EXISTS idx_tracked_units_owner ON tracked_units(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_tracked_units_last_scan ON tracked_units(last_scan_at);

-- ── Verification Logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code TEXT NOT NULL REFERENCES tracked_units(unique_unit_code) ON DELETE CASCADE,
  ip_address TEXT,
  device_fingerprint TEXT,
  geolocation TEXT,
  country TEXT,
  status TEXT DEFAULT 'VERIFIED',
  risk_score INTEGER DEFAULT 0,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_code ON verification_logs(unit_code);
CREATE INDEX IF NOT EXISTS idx_verification_logs_scanned_at ON verification_logs(scanned_at);

-- ── Ownership History ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code TEXT NOT NULL REFERENCES tracked_units(unique_unit_code) ON DELETE CASCADE,
  previous_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  new_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ownership_history_code ON ownership_history(unit_code);
CREATE INDEX IF NOT EXISTS idx_ownership_history_owner ON ownership_history(new_owner_id);

-- ── Fraud Reports ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_type TEXT NOT NULL, -- 'product' | 'seller' | 'review' | 'unit'
  reported_id TEXT NOT NULL, -- UUID or unit_code
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- 'open' | 'investigating' | 'resolved' | 'dismissed'
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_type_id ON fraud_reports(reported_type, reported_id);

-- ── Seller Trust Scores ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_trust_scores (
  seller_id UUID PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  trust_score INTEGER DEFAULT 100,
  successful_verifications INTEGER DEFAULT 0,
  counterfeit_reports INTEGER DEFAULT 0,
  verified_sales_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Verification Sessions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_token ON verification_sessions(session_token);

-- ── Auto-Update Triggers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_tracked_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tracked_units_updated_at ON tracked_units;
CREATE TRIGGER trg_tracked_units_updated_at
BEFORE UPDATE ON tracked_units
FOR EACH ROW
EXECUTE FUNCTION update_tracked_units_updated_at();
