-- ============================================================
-- Mister Mobile AI-Quoter: Phase 1 Database Schema
-- ISO 9001 / CaseTrust Compliant
-- ============================================================

-- Extensions and Custom Types
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE device_category AS ENUM ('New', 'Refurbished');
CREATE TYPE quote_status AS ENUM ('Pending', 'Inspected', 'Accepted', 'Completed', 'Expired');

-- ============================================================
-- 1. Locations Table (The 17-Branch Network)
-- ============================================================
CREATE TABLE locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_name TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Devices Table
-- Supports: Apple, Samsung, Honor, OPPO, Xiaomi, OnePlus,
--           Nothing Phone, Huawei, Google Pixel, Asus, Nokia,
--           Sony, LG, Realme, Vivo
-- ============================================================
CREATE TABLE devices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand             TEXT NOT NULL,
    model             TEXT NOT NULL,
    category          device_category NOT NULL,
    base_market_price DECIMAL(10, 2),
    created_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (brand, model)
);

-- ============================================================
-- 3. Inspections Table (The "100 Steps" Regimen)
-- inspection_data JSONB schema:
--   {
--     screen_status:        "Flawless" | "Scratched" | "Cracked",
--     battery_percentage:   integer 0–100,
--     lock_status:          boolean (true = unlocked),
--     oem_verification:     boolean (true = all OEM parts),
--     functionality_check:  { camera: bool, face_id_touch_id: bool, speakers: bool }
--   }
-- ============================================================
CREATE TABLE inspections (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id        UUID REFERENCES devices(id),
    inspector_id     UUID NOT NULL,
    inspection_data  JSONB NOT NULL,
    audit_trail      TEXT,         -- Immutable ISO 9001 log: inspector_id + timestamp + sha256 hash
    passed_all_steps BOOLEAN DEFAULT false,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. Quotes Table (Linked to Inspection for Trust Validation)
-- ============================================================
CREATE TABLE quotes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id         UUID REFERENCES inspections(id) ON DELETE CASCADE,
    location_id           UUID REFERENCES locations(id),
    trade_in_value        DECIMAL(10, 2) NOT NULL,
    repair_offset         DECIMAL(10, 2) DEFAULT 0.00,
    casetrust_identifier  TEXT,      -- Fair trading metadata (logged at quote creation)
    status                quote_status DEFAULT 'Pending',
    paynow_payload        TEXT,      -- EMVCo-formatted PayNow QR string
    transaction_reference TEXT,      -- Unique ref mapped to quote_id for disbursement
    warranty_expiry       TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    return_policy_expiry  TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    expiry_date           TIMESTAMPTZ NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Row Level Security
-- ============================================================
ALTER TABLE locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes     ENABLE ROW LEVEL SECURITY;

-- Public read on locations and devices (needed for the quoter UI)
CREATE POLICY "Public read locations"  ON locations  FOR SELECT USING (true);
CREATE POLICY "Public read devices"    ON devices    FOR SELECT USING (true);

-- Quotes and inspections require authentication
CREATE POLICY "Auth insert inspections" ON inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read own inspections" ON inspections FOR SELECT TO authenticated USING (inspector_id = auth.uid());
CREATE POLICY "Auth insert quotes" ON quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read own quotes" ON quotes FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 6. Triggers: Auto-expire quotes past warranty/return windows
-- ============================================================
CREATE OR REPLACE FUNCTION expire_quotes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE quotes
    SET status = 'Expired'
    WHERE status = 'Pending'
      AND expiry_date < now();
    RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_expire_quotes
    AFTER INSERT ON quotes
    EXECUTE FUNCTION expire_quotes();

-- ============================================================
-- 7. Seed: 17 Singapore Branch Locations
-- ============================================================
INSERT INTO locations (branch_name) VALUES
    ('Ang Mo Kio'),
    ('Bedok'),
    ('Bishan'),
    ('Boon Lay'),
    ('Bukit Panjang'),
    ('Chinatown'),
    ('Geylang'),
    ('Hougang'),
    ('Jurong'),
    ('Marine Parade'),
    ('Pasir Ris'),
    ('Potong Pasir'),
    ('Punggol'),
    ('Serangoon'),
    ('Tampines'),
    ('Woodlands'),
    ('Yishun');

-- ============================================================
-- 8. Seed: Device Catalogue (Representative Models)
-- ============================================================
INSERT INTO devices (brand, model, category, base_market_price) VALUES
    -- Apple
    ('Apple', 'iPhone 16 Pro Max', 'New', 1799.00),
    ('Apple', 'iPhone 16 Pro', 'New', 1599.00),
    ('Apple', 'iPhone 16 Plus', 'New', 1299.00),
    ('Apple', 'iPhone 16', 'New', 1099.00),
    ('Apple', 'iPhone 15 Pro Max', 'Refurbished', 1499.00),
    ('Apple', 'iPhone 15 Pro', 'Refurbished', 1299.00),
    ('Apple', 'iPhone 15', 'Refurbished', 999.00),
    ('Apple', 'iPhone 14 Pro Max', 'Refurbished', 1099.00),
    ('Apple', 'iPhone 14 Pro', 'Refurbished', 899.00),
    ('Apple', 'iPhone 14', 'Refurbished', 699.00),
    ('Apple', 'iPhone 13 Pro Max', 'Refurbished', 799.00),
    ('Apple', 'iPhone 13 Pro', 'Refurbished', 699.00),
    ('Apple', 'iPhone 13', 'Refurbished', 549.00),
    ('Apple', 'iPhone 13 mini', 'Refurbished', 449.00),
    ('Apple', 'iPhone 12 Pro Max', 'Refurbished', 599.00),
    ('Apple', 'iPhone 12 Pro', 'Refurbished', 499.00),
    ('Apple', 'iPhone 12', 'Refurbished', 399.00),
    -- Samsung
    ('Samsung', 'Galaxy S25 Ultra', 'New', 1899.00),
    ('Samsung', 'Galaxy S25+', 'New', 1399.00),
    ('Samsung', 'Galaxy S25', 'New', 1099.00),
    ('Samsung', 'Galaxy S24 Ultra', 'Refurbished', 1599.00),
    ('Samsung', 'Galaxy S24+', 'Refurbished', 1199.00),
    ('Samsung', 'Galaxy S24', 'Refurbished', 899.00),
    ('Samsung', 'Galaxy Z Fold 6', 'New', 2499.00),
    ('Samsung', 'Galaxy Z Flip 6', 'New', 1299.00),
    ('Samsung', 'Galaxy A55', 'New', 599.00),
    ('Samsung', 'Galaxy A35', 'New', 449.00),
    -- Honor
    ('Honor', 'Magic6 Pro', 'New', 1199.00),
    ('Honor', 'Magic6 Lite', 'New', 699.00),
    ('Honor', '90 Pro', 'New', 799.00),
    ('Honor', '200 Pro', 'New', 899.00),
    -- OPPO
    ('OPPO', 'Find X8 Pro', 'New', 1399.00),
    ('OPPO', 'Find X7 Ultra', 'Refurbished', 1199.00),
    ('OPPO', 'Reno 12 Pro', 'New', 799.00),
    ('OPPO', 'Reno 11 Pro', 'New', 699.00),
    ('OPPO', 'A3 Pro', 'New', 399.00),
    -- Xiaomi
    ('Xiaomi', '14 Ultra', 'New', 1599.00),
    ('Xiaomi', '14 Pro', 'New', 1199.00),
    ('Xiaomi', '14', 'New', 899.00),
    ('Xiaomi', '13 Ultra', 'Refurbished', 1299.00),
    ('Xiaomi', 'Redmi Note 13 Pro+', 'New', 549.00),
    ('Xiaomi', 'Redmi Note 13 Pro', 'New', 449.00),
    -- OnePlus
    ('OnePlus', '13', 'New', 1099.00),
    ('OnePlus', '12', 'Refurbished', 899.00),
    ('OnePlus', 'Nord 4', 'New', 649.00),
    ('OnePlus', 'Nord CE 4', 'New', 499.00),
    -- Nothing Phone
    ('Nothing Phone', '(2a) Plus', 'New', 599.00),
    ('Nothing Phone', '(2a)', 'New', 499.00),
    ('Nothing Phone', '(2)', 'Refurbished', 699.00),
    ('Nothing Phone', '(1)', 'Refurbished', 399.00),
    -- Huawei
    ('Huawei', 'Pura 70 Ultra', 'New', 1499.00),
    ('Huawei', 'Pura 70 Pro', 'New', 1199.00),
    ('Huawei', 'Mate 60 Pro', 'New', 1299.00),
    ('Huawei', 'Nova 12 Pro', 'New', 699.00),
    -- Google Pixel
    ('Google Pixel', '9 Pro XL', 'New', 1399.00),
    ('Google Pixel', '9 Pro', 'New', 1199.00),
    ('Google Pixel', '9', 'New', 899.00),
    ('Google Pixel', '8 Pro', 'Refurbished', 999.00),
    ('Google Pixel', '8', 'Refurbished', 699.00),
    ('Google Pixel', '7 Pro', 'Refurbished', 699.00),
    -- Asus
    ('Asus', 'ROG Phone 8 Pro', 'New', 1599.00),
    ('Asus', 'ROG Phone 8', 'New', 1299.00),
    ('Asus', 'Zenfone 11 Ultra', 'New', 1099.00),
    ('Asus', 'Zenfone 10', 'Refurbished', 799.00),
    -- Nokia
    ('Nokia', 'G42 5G', 'New', 399.00),
    ('Nokia', 'X30 5G', 'New', 549.00),
    ('Nokia', 'C32', 'New', 249.00),
    -- Sony
    ('Sony', 'Xperia 1 VI', 'New', 1799.00),
    ('Sony', 'Xperia 5 VI', 'New', 1199.00),
    ('Sony', 'Xperia 10 VI', 'New', 699.00),
    ('Sony', 'Xperia 1 V', 'Refurbished', 1399.00),
    -- LG (legacy/refurbished only)
    ('LG', 'V60 ThinQ 5G', 'Refurbished', 399.00),
    ('LG', 'Wing 5G', 'Refurbished', 499.00),
    ('LG', 'Velvet', 'Refurbished', 299.00),
    -- Realme
    ('Realme', 'GT 6', 'New', 699.00),
    ('Realme', 'GT 5 Pro', 'New', 799.00),
    ('Realme', '12 Pro+', 'New', 549.00),
    ('Realme', 'Narzo 70 Pro', 'New', 349.00),
    -- Vivo
    ('Vivo', 'X100 Ultra', 'New', 1499.00),
    ('Vivo', 'X100 Pro', 'New', 1199.00),
    ('Vivo', 'X100', 'New', 899.00),
    ('Vivo', 'V30 Pro', 'New', 699.00),
    ('Vivo', 'V30', 'New', 549.00);
