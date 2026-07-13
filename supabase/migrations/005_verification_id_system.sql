-- ============================================================
-- 005_verification_id_system.sql
-- Trusta Product Authenticity Verification System
--
-- Replaces NFC hardware with manual Verification IDs.
-- Format: TRU-{PRODUCT_CODE}-{VARIANT_CODE}-{UNIT_NUMBER}
-- Example: TRU-IP16-BLK128-000001
--
-- Builds on existing: products, product_variants,
--   tracked_units, verification_logs, ownership_history
--
-- New tables: product_batches, product_units, verified_reviews
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. EXTEND products
-- ────────────────────────────────────────────────────────────
-- product_code  : short human code used in verification IDs (e.g. "IP16")
-- model_number  : manufacturer model reference
-- manufacturer_name, return_policy, warranty, sku, low_stock_alert
--   – 004 already added brand, country_of_origin, manufacturing_details
-- ────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_code       TEXT,
  ADD COLUMN IF NOT EXISTS model_number       TEXT,
  ADD COLUMN IF NOT EXISTS manufacturer_name  TEXT,
  ADD COLUMN IF NOT EXISTS return_policy      TEXT,
  ADD COLUMN IF NOT EXISTS warranty           TEXT,
  ADD COLUMN IF NOT EXISTS sku                TEXT,
  ADD COLUMN IF NOT EXISTS low_stock_alert    INTEGER NOT NULL DEFAULT 10;

-- product_code must be unique when set (allows NULL for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_code
  ON products(product_code)
  WHERE product_code IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- 2. EXTEND product_variants
-- ────────────────────────────────────────────────────────────
-- variant_code   : short code used in verification IDs (e.g. "BLK128")
-- color/storage/ram/size/material : explicit columns beside JSONB attributes
-- unit_counter   : monotonically increasing counter for this variant;
--                  used to assign unique sequential unit numbers atomically
-- ────────────────────────────────────────────────────────────

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS variant_code   TEXT,
  ADD COLUMN IF NOT EXISTS color          TEXT,
  ADD COLUMN IF NOT EXISTS storage        TEXT,
  ADD COLUMN IF NOT EXISTS ram            TEXT,
  ADD COLUMN IF NOT EXISTS size           TEXT,
  ADD COLUMN IF NOT EXISTS material       TEXT,
  ADD COLUMN IF NOT EXISTS unit_counter   INTEGER NOT NULL DEFAULT 0;


-- ────────────────────────────────────────────────────────────
-- 3. product_batches
-- ────────────────────────────────────────────────────────────
-- One batch per production run.
-- Seller creates a batch, specifies quantity, then triggers
-- unit generation – each unit gets its own verification ID.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_batches (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID          NOT NULL REFERENCES products(id)          ON DELETE CASCADE,
  variant_id          UUID          REFERENCES product_variants(id)           ON DELETE CASCADE,
  batch_number        TEXT          NOT NULL,
  manufacturing_date  DATE,
  expiry_date         DATE,
  quantity            INTEGER       NOT NULL CHECK (quantity > 0),
  units_generated     INTEGER       NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product  ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_variant  ON product_batches(variant_id);


-- ────────────────────────────────────────────────────────────
-- 4. product_units
-- ────────────────────────────────────────────────────────────
-- One row = one physical unit in the world.
-- verification_id is the customer-facing string they type in.
--
-- Status flow:
--   generated → published → available → sold → owned → transferred → deactivated
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_units (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID          NOT NULL REFERENCES products(id)          ON DELETE CASCADE,
  variant_id          UUID          REFERENCES product_variants(id)           ON DELETE CASCADE,
  batch_id            UUID          REFERENCES product_batches(id)            ON DELETE SET NULL,

  -- The customer-visible code: TRU-IP16-BLK128-000001
  verification_id     TEXT          NOT NULL UNIQUE,

  -- Monotonic per variant (or per product when no variant) – used to build the ID
  unit_number         INTEGER       NOT NULL,

  -- Optional seller-assigned serial
  serial_number       TEXT,

  status              TEXT          NOT NULL DEFAULT 'generated'
    CHECK (status IN (
      'generated', 'published', 'available',
      'sold', 'owned', 'transferred', 'deactivated'
    )),

  owner_id            UUID          REFERENCES profiles(id)                   ON DELETE SET NULL,
  verification_count  INTEGER       NOT NULL DEFAULT 0,
  last_verified_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- No two units in the same batch of the same variant share a sequence number
  UNIQUE (product_id, variant_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_product_units_product    ON product_units(product_id);
CREATE INDEX IF NOT EXISTS idx_product_units_variant    ON product_units(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_units_batch      ON product_units(batch_id);
CREATE INDEX IF NOT EXISTS idx_product_units_vid        ON product_units(verification_id);
CREATE INDEX IF NOT EXISTS idx_product_units_owner      ON product_units(owner_id);
CREATE INDEX IF NOT EXISTS idx_product_units_status     ON product_units(status);


-- ────────────────────────────────────────────────────────────
-- 5. EXTEND verification_logs
-- ────────────────────────────────────────────────────────────
-- Already created in 003/004. Add product_unit linkage + user.
-- ────────────────────────────────────────────────────────────

ALTER TABLE verification_logs
  ADD COLUMN IF NOT EXISTS product_unit_id  UUID        REFERENCES product_units(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id          UUID        REFERENCES profiles(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location         TEXT,
  ADD COLUMN IF NOT EXISTS verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vlog_product_unit  ON verification_logs(product_unit_id);
CREATE INDEX IF NOT EXISTS idx_vlog_user          ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vlog_verified_at   ON verification_logs(verified_at DESC);


-- ────────────────────────────────────────────────────────────
-- 6. EXTEND ownership_history
-- ────────────────────────────────────────────────────────────
-- Already created in 003. Add product_unit linkage, ownership_type, status.
-- ────────────────────────────────────────────────────────────

ALTER TABLE ownership_history
  ADD COLUMN IF NOT EXISTS product_unit_id  UUID        REFERENCES product_units(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS ownership_type   TEXT        NOT NULL DEFAULT 'first_owner'
    CHECK (ownership_type IN ('first_owner', 'second_owner', 'transferred')),
  ADD COLUMN IF NOT EXISTS purchased_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transferred_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status           TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'transferred', 'revoked'));

CREATE INDEX IF NOT EXISTS idx_ownership_unit ON ownership_history(product_unit_id);


-- ────────────────────────────────────────────────────────────
-- 7. verified_reviews
-- ────────────────────────────────────────────────────────────
-- Only users who own a unit (product_units.owner_id = auth.uid())
-- may submit a review. One review per owned unit.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verified_reviews (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_unit_id UUID        NOT NULL REFERENCES product_units(id)    ON DELETE CASCADE,
  product_id      UUID        NOT NULL REFERENCES products(id)          ON DELETE CASCADE,
  reviewer_id     UUID        NOT NULL REFERENCES profiles(id)          ON DELETE CASCADE,
  rating          SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  body            TEXT,
  is_verified     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One verified review per owned unit
  UNIQUE (product_unit_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_verified_reviews_product
  ON verified_reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verified_reviews_unit
  ON verified_reviews(product_unit_id);
CREATE INDEX IF NOT EXISTS idx_verified_reviews_reviewer
  ON verified_reviews(reviewer_id);


-- ────────────────────────────────────────────────────────────
-- 8. FUNCTION: generate_verification_id
-- ────────────────────────────────────────────────────────────
-- Pure function – no side effects.
-- generate_verification_id('IP16', 'BLK128', 1) → 'TRU-IP16-BLK128-000001'
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_verification_id(
  p_product_code  TEXT,
  p_variant_code  TEXT,
  p_unit_number   INTEGER
)
RETURNS TEXT
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT
    'TRU-'
    || UPPER(TRIM(p_product_code))
    || '-'
    || UPPER(TRIM(p_variant_code))
    || '-'
    || LPAD(p_unit_number::TEXT, 6, '0');
$$;


-- ────────────────────────────────────────────────────────────
-- 9. FUNCTION: generate_batch_units(batch_id)
-- ────────────────────────────────────────────────────────────
-- Called by the seller dashboard after creating a batch.
-- Inserts product_units rows and returns the count generated.
--
-- Uses an atomic UPDATE … RETURNING on product_variants.unit_counter
-- so concurrent calls never produce duplicate unit numbers.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_batch_units(p_batch_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch         product_batches%ROWTYPE;
  v_product       products%ROWTYPE;
  v_variant       product_variants%ROWTYPE;
  v_start_seq     INTEGER;
  v_i             INTEGER;
  v_vid           TEXT;
  v_variant_code  TEXT;
BEGIN
  -- ── Load batch ──────────────────────────────────────────
  SELECT * INTO v_batch FROM product_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch % not found', p_batch_id;
  END IF;

  IF v_batch.units_generated > 0 THEN
    RAISE EXCEPTION 'Units already generated for batch %', p_batch_id;
  END IF;

  -- ── Load product ────────────────────────────────────────
  SELECT * INTO v_product FROM products WHERE id = v_batch.product_id;
  IF v_product.product_code IS NULL OR TRIM(v_product.product_code) = '' THEN
    RAISE EXCEPTION 'products.product_code must be set before generating units (product id: %)', v_batch.product_id;
  END IF;

  -- ── Load variant (optional) ─────────────────────────────
  IF v_batch.variant_id IS NOT NULL THEN
    SELECT * INTO v_variant FROM product_variants WHERE id = v_batch.variant_id;
    IF v_variant.variant_code IS NULL OR TRIM(v_variant.variant_code) = '' THEN
      RAISE EXCEPTION 'product_variants.variant_code must be set before generating units (variant id: %)', v_batch.variant_id;
    END IF;
    v_variant_code := v_variant.variant_code;

    -- Atomically claim unit_number range for this variant
    UPDATE product_variants
       SET unit_counter = unit_counter + v_batch.quantity
     WHERE id = v_batch.variant_id
    RETURNING unit_counter - v_batch.quantity INTO v_start_seq;
  ELSE
    -- No variant: use max existing unit_number for this product
    SELECT COALESCE(MAX(unit_number), 0)
      INTO v_start_seq
      FROM product_units
     WHERE product_id = v_batch.product_id
       AND variant_id IS NULL;
    v_variant_code := 'GEN';
  END IF;

  -- ── Insert units ────────────────────────────────────────
  FOR v_i IN 1 .. v_batch.quantity LOOP
    v_vid := generate_verification_id(
      v_product.product_code,
      v_variant_code,
      v_start_seq + v_i
    );

    INSERT INTO product_units (
      product_id,
      variant_id,
      batch_id,
      verification_id,
      unit_number,
      status
    ) VALUES (
      v_batch.product_id,
      v_batch.variant_id,
      p_batch_id,
      v_vid,
      v_start_seq + v_i,
      'generated'
    );
  END LOOP;

  -- ── Mark batch done ─────────────────────────────────────
  UPDATE product_batches
     SET units_generated = v_batch.quantity
   WHERE id = p_batch_id;

  RETURN v_batch.quantity;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 10. TRIGGER: increment verification_count after each log
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_increment_verification_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.product_unit_id IS NOT NULL THEN
    UPDATE product_units
       SET verification_count = verification_count + 1,
           last_verified_at   = NOW(),
           updated_at         = NOW()
     WHERE id = NEW.product_unit_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_verification_count ON verification_logs;
CREATE TRIGGER trg_increment_verification_count
  AFTER INSERT ON verification_logs
  FOR EACH ROW
  EXECUTE FUNCTION fn_increment_verification_count();


-- ────────────────────────────────────────────────────────────
-- 11. TRIGGER: updated_at on product_units and verified_reviews
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_units_updated_at ON product_units;
CREATE TRIGGER trg_product_units_updated_at
  BEFORE UPDATE ON product_units
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_verified_reviews_updated_at ON verified_reviews;
CREATE TRIGGER trg_verified_reviews_updated_at
  BEFORE UPDATE ON verified_reviews
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 12. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE product_batches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_units    ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_reviews ENABLE ROW LEVEL SECURITY;

-- ── product_batches ──────────────────────────────────────────

DROP POLICY IF EXISTS "Sellers manage own batches"  ON product_batches;
DROP POLICY IF EXISTS "Service role full batches"   ON product_batches;

-- Sellers can only access batches for their own products
CREATE POLICY "Sellers manage own batches" ON product_batches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
       WHERE p.id = product_batches.product_id
         AND p.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
       WHERE p.id = product_batches.product_id
         AND p.seller_id = auth.uid()
    )
  );

CREATE POLICY "Service role full batches" ON product_batches
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ── product_units ────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can look up units"    ON product_units;
DROP POLICY IF EXISTS "Sellers manage own units"    ON product_units;
DROP POLICY IF EXISTS "Owners can update own unit"  ON product_units;
DROP POLICY IF EXISTS "Service role full units"     ON product_units;

-- Anyone can look up a unit by verification_id (needed for the verify page)
-- but generated/deactivated units are hidden
CREATE POLICY "Public can look up units" ON product_units
  FOR SELECT
  USING (status NOT IN ('generated', 'deactivated'));

-- Sellers can manage units for their own products
CREATE POLICY "Sellers manage own units" ON product_units
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
       WHERE p.id = product_units.product_id
         AND p.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
       WHERE p.id = product_units.product_id
         AND p.seller_id = auth.uid()
    )
  );

CREATE POLICY "Service role full units" ON product_units
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ── verified_reviews ─────────────────────────────────────────

DROP POLICY IF EXISTS "Public read verified reviews"  ON verified_reviews;
DROP POLICY IF EXISTS "Owners can write reviews"      ON verified_reviews;
DROP POLICY IF EXISTS "Reviewers can update own"      ON verified_reviews;
DROP POLICY IF EXISTS "Service role full reviews"     ON verified_reviews;

CREATE POLICY "Public read verified reviews" ON verified_reviews
  FOR SELECT USING (TRUE);

-- Only the current owner of a unit may insert a review for it
CREATE POLICY "Owners can write reviews" ON verified_reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM product_units pu
       WHERE pu.id = product_unit_id
         AND pu.owner_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can update own" ON verified_reviews
  FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Service role full reviews" ON verified_reviews
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);


-- ────────────────────────────────────────────────────────────
-- 13. HELPFUL VIEWS
-- ────────────────────────────────────────────────────────────

-- Public verification lookup view
-- Used by /verify/[unit_code] page
CREATE OR REPLACE VIEW v_unit_verification AS
SELECT
  pu.id                                         AS unit_id,
  pu.verification_id,
  pu.unit_number,
  pu.serial_number,
  pu.status,
  pu.verification_count,
  pu.last_verified_at,
  pu.created_at                                 AS unit_created_at,

  -- Product
  p.id                                          AS product_id,
  p.name                                        AS product_name,
  p.brand,
  p.model_number,
  p.country_of_origin,
  p.warranty,
  p.images,                                     -- assuming products.images TEXT[]

  -- Variant
  pv.id                                         AS variant_id,
  pv.variant_code,
  pv.color,
  pv.storage,
  pv.ram,
  pv.size,
  pv.attributes                                 AS variant_attributes,
  pv.thumbnail                                  AS variant_image,

  -- Batch
  pb.id                                         AS batch_id,
  pb.batch_number,
  pb.manufacturing_date,
  pb.expiry_date,

  -- Seller
  s.id                                          AS seller_id,
  s.business_name                               AS seller_name,
  s.city                                        AS seller_city,

  -- Owner (only non-sensitive info)
  prof.name                                     AS owner_name,
  pu.owner_id

FROM product_units          pu
JOIN products               p    ON p.id  = pu.product_id
LEFT JOIN product_variants  pv   ON pv.id = pu.variant_id
LEFT JOIN product_batches   pb   ON pb.id = pu.batch_id
LEFT JOIN sellers           s    ON s.id  = p.seller_id
LEFT JOIN profiles          prof ON prof.id = pu.owner_id
WHERE pu.status NOT IN ('generated', 'deactivated');

COMMENT ON VIEW v_unit_verification IS
  'Flattened view for the public /verify page. Excludes units not yet published or deactivated.';


-- ────────────────────────────────────────────────────────────
-- END OF MIGRATION
-- ────────────────────────────────────────────────────────────
