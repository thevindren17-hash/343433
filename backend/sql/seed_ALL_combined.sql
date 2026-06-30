-- ============================================================
-- Mister Mobile — Combined Seed Data (Phase 2 RAG)
-- Run AFTER schema_free.sql
-- Provides mock data for devices, repair services, service tiers, and quotes
-- All tables live in the "rag" schema to avoid conflicts with Phase 1 (public schema)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS rag;
SET search_path TO rag;

-- ------------------------------------------------------------
-- service_tiers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_tiers (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT,
    multiplier  NUMERIC(3,2) DEFAULT 1.00
);

INSERT INTO service_tiers (name, description, multiplier) VALUES
    ('standard', 'Repair completed within 2 hours. Drop off and collect.', 1.00),
    ('express',  'Repair completed in 30 minutes while you wait.',         1.25),
    ('premium',  'Same-day priority with 6-month extended warranty.',      1.50)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------
-- repair_services
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repair_services (
    id             SERIAL PRIMARY KEY,
    service_key    TEXT UNIQUE NOT NULL,
    name           TEXT NOT NULL,
    description    TEXT,
    avg_duration_mins INT
);

INSERT INTO repair_services (service_key, name, description, avg_duration_mins) VALUES
    ('screen_replacement',  'Screen Replacement',   'Full display assembly replacement including digitiser',            45),
    ('battery_replacement', 'Battery Replacement',  'OEM-grade battery replacement with health certification',         30),
    ('charging_port',       'Charging Port Repair', 'USB-C or Lightning port cleaning or full port replacement',       40),
    ('camera_front',        'Front Camera Repair',  'Front-facing camera and Face ID sensor module replacement',       50),
    ('camera_rear',         'Rear Camera Repair',   'Rear camera module or lens replacement',                          55),
    ('back_glass',          'Back Glass Repair',    'Rear glass panel replacement using laser separation',             60),
    ('water_damage',        'Water Damage Service', 'Full strip-down, ultrasonic clean, corrosion treatment',          90),
    ('speaker_mic',         'Speaker / Mic Repair', 'Earpiece, loudspeaker, or microphone replacement',               35),
    ('button_repair',       'Button Repair',        'Power, volume, or home button repair or replacement',             30),
    ('data_recovery',       'Data Recovery',        'Emergency data extraction from non-booting or damaged devices',  120)
ON CONFLICT (service_key) DO NOTHING;

-- ------------------------------------------------------------
-- devices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id             SERIAL PRIMARY KEY,
    brand          TEXT NOT NULL,
    model          TEXT NOT NULL,
    release_year   INT,
    display_type   TEXT,
    display_inches NUMERIC(3,1),
    connector      TEXT,
    UNIQUE (brand, model)
);

INSERT INTO devices (brand, model, release_year, display_type, display_inches, connector) VALUES
    -- Apple iPhone 15 series
    ('Apple', 'iPhone 15 Pro Max', 2023, 'OLED',  6.7, 'USB-C'),
    ('Apple', 'iPhone 15 Pro',     2023, 'OLED',  6.1, 'USB-C'),
    ('Apple', 'iPhone 15 Plus',    2023, 'OLED',  6.7, 'USB-C'),
    ('Apple', 'iPhone 15',         2023, 'OLED',  6.1, 'USB-C'),
    -- Apple iPhone 14 series
    ('Apple', 'iPhone 14 Pro Max', 2022, 'OLED',  6.7, 'Lightning'),
    ('Apple', 'iPhone 14 Pro',     2022, 'OLED',  6.1, 'Lightning'),
    ('Apple', 'iPhone 14 Plus',    2022, 'OLED',  6.7, 'Lightning'),
    ('Apple', 'iPhone 14',         2022, 'OLED',  6.1, 'Lightning'),
    -- Apple iPhone 13 series
    ('Apple', 'iPhone 13 Pro Max', 2021, 'OLED',  6.7, 'Lightning'),
    ('Apple', 'iPhone 13 Pro',     2021, 'OLED',  6.1, 'Lightning'),
    ('Apple', 'iPhone 13',         2021, 'OLED',  6.1, 'Lightning'),
    ('Apple', 'iPhone 13 mini',    2021, 'OLED',  5.4, 'Lightning'),
    -- Apple iPhone 12 series
    ('Apple', 'iPhone 12 Pro Max', 2020, 'OLED',  6.7, 'Lightning'),
    ('Apple', 'iPhone 12 Pro',     2020, 'OLED',  6.1, 'Lightning'),
    ('Apple', 'iPhone 12',         2020, 'OLED',  6.1, 'Lightning'),
    ('Apple', 'iPhone 12 mini',    2020, 'OLED',  5.4, 'Lightning'),
    -- Apple iPhone 11 series
    ('Apple', 'iPhone 11 Pro Max', 2019, 'OLED',  6.5, 'Lightning'),
    ('Apple', 'iPhone 11 Pro',     2019, 'OLED',  5.8, 'Lightning'),
    ('Apple', 'iPhone 11',         2019, 'LCD',   6.1, 'Lightning'),
    -- Apple older
    ('Apple', 'iPhone XS Max',     2018, 'OLED',  6.5, 'Lightning'),
    ('Apple', 'iPhone XS',         2018, 'OLED',  5.8, 'Lightning'),
    ('Apple', 'iPhone X',          2017, 'OLED',  5.8, 'Lightning'),
    ('Apple', 'iPhone 8 Plus',     2017, 'LCD',   5.5, 'Lightning'),
    ('Apple', 'iPhone 8',          2017, 'LCD',   4.7, 'Lightning'),
    ('Apple', 'iPhone SE (3rd)',   2022, 'LCD',   4.7, 'Lightning'),
    -- Samsung Galaxy S series
    ('Samsung', 'Galaxy S24 Ultra', 2024, 'AMOLED', 6.8, 'USB-C'),
    ('Samsung', 'Galaxy S24+',      2024, 'AMOLED', 6.7, 'USB-C'),
    ('Samsung', 'Galaxy S24',       2024, 'AMOLED', 6.2, 'USB-C'),
    ('Samsung', 'Galaxy S23 Ultra', 2023, 'AMOLED', 6.8, 'USB-C'),
    ('Samsung', 'Galaxy S23+',      2023, 'AMOLED', 6.6, 'USB-C'),
    ('Samsung', 'Galaxy S23',       2023, 'AMOLED', 6.1, 'USB-C'),
    ('Samsung', 'Galaxy S22 Ultra', 2022, 'AMOLED', 6.8, 'USB-C'),
    ('Samsung', 'Galaxy S22',       2022, 'AMOLED', 6.1, 'USB-C'),
    -- Samsung Galaxy A series
    ('Samsung', 'Galaxy A54',       2023, 'AMOLED', 6.4, 'USB-C'),
    ('Samsung', 'Galaxy A34',       2023, 'AMOLED', 6.6, 'USB-C'),
    ('Samsung', 'Galaxy A14',       2023, 'LCD',    6.6, 'USB-C'),
    -- Google Pixel
    ('Google', 'Pixel 8 Pro',       2023, 'OLED',  6.7, 'USB-C'),
    ('Google', 'Pixel 8',           2023, 'OLED',  6.2, 'USB-C'),
    ('Google', 'Pixel 7 Pro',       2022, 'OLED',  6.7, 'USB-C'),
    ('Google', 'Pixel 7',           2022, 'OLED',  6.3, 'USB-C'),
    ('Google', 'Pixel 6a',          2022, 'OLED',  6.1, 'USB-C'),
    -- Other
    ('OnePlus', 'OnePlus 12',       2024, 'AMOLED', 6.8, 'USB-C'),
    ('Sony',    'Xperia 1 V',       2023, 'OLED',   6.5, 'USB-C')
ON CONFLICT (brand, model) DO NOTHING;

-- ------------------------------------------------------------
-- quotes  (base standard-tier prices in GBP)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
    id              SERIAL PRIMARY KEY,
    brand           TEXT NOT NULL,
    model           TEXT NOT NULL,
    service_key     TEXT NOT NULL REFERENCES repair_services(service_key),
    base_price_gbp  NUMERIC(7,2) NOT NULL,
    notes           TEXT,
    UNIQUE (brand, model, service_key)
);

INSERT INTO quotes (brand, model, service_key, base_price_gbp, notes) VALUES
    -- Screen replacements — Apple
    ('Apple', 'iPhone 15 Pro Max', 'screen_replacement', 269.00, 'OLED ProMotion 120Hz; express £329'),
    ('Apple', 'iPhone 15 Pro',     'screen_replacement', 249.00, 'OLED ProMotion 120Hz; express £299'),
    ('Apple', 'iPhone 15 Plus',    'screen_replacement', 219.00, 'OLED; express £269'),
    ('Apple', 'iPhone 15',         'screen_replacement', 199.00, 'OLED; express £249'),
    ('Apple', 'iPhone 14 Pro Max', 'screen_replacement', 249.00, 'OLED ProMotion; express £299'),
    ('Apple', 'iPhone 14 Pro',     'screen_replacement', 229.00, 'OLED ProMotion; express £279'),
    ('Apple', 'iPhone 14 Plus',    'screen_replacement', 199.00, 'OLED; express £249'),
    ('Apple', 'iPhone 14',         'screen_replacement', 179.00, 'OLED; express £219'),
    ('Apple', 'iPhone 13 Pro Max', 'screen_replacement', 229.00, 'OLED ProMotion; express £279'),
    ('Apple', 'iPhone 13 Pro',     'screen_replacement', 209.00, 'OLED ProMotion; express £259'),
    ('Apple', 'iPhone 13',         'screen_replacement', 169.00, 'OLED; express £209'),
    ('Apple', 'iPhone 13 mini',    'screen_replacement', 149.00, 'OLED; express £189'),
    ('Apple', 'iPhone 12 Pro Max', 'screen_replacement', 209.00, 'OLED; express £249'),
    ('Apple', 'iPhone 12 Pro',     'screen_replacement', 189.00, 'OLED; express £229'),
    ('Apple', 'iPhone 12',         'screen_replacement', 149.00, 'OLED; express £189'),
    ('Apple', 'iPhone 12 mini',    'screen_replacement', 129.00, 'OLED; express £169'),
    ('Apple', 'iPhone 11 Pro Max', 'screen_replacement', 189.00, 'OLED; express £229'),
    ('Apple', 'iPhone 11 Pro',     'screen_replacement', 169.00, 'OLED; express £209'),
    ('Apple', 'iPhone 11',         'screen_replacement', 129.00, 'LCD; express £169'),
    ('Apple', 'iPhone XS Max',     'screen_replacement', 169.00, 'OLED; express £209'),
    ('Apple', 'iPhone XS',         'screen_replacement', 149.00, 'OLED; express £189'),
    ('Apple', 'iPhone X',          'screen_replacement', 149.00, 'OLED; express £189'),
    ('Apple', 'iPhone 8 Plus',     'screen_replacement', 109.00, 'LCD; express £139'),
    ('Apple', 'iPhone 8',          'screen_replacement',  89.00, 'LCD; express £119'),
    ('Apple', 'iPhone SE (3rd)',    'screen_replacement',  79.00, 'LCD; express £99'),
    -- Screen replacements — Samsung
    ('Samsung', 'Galaxy S24 Ultra', 'screen_replacement', 299.00, 'AMOLED 120Hz; express £369'),
    ('Samsung', 'Galaxy S24+',      'screen_replacement', 249.00, 'AMOLED; express £309'),
    ('Samsung', 'Galaxy S24',       'screen_replacement', 219.00, 'AMOLED; express £269'),
    ('Samsung', 'Galaxy S23 Ultra', 'screen_replacement', 279.00, 'AMOLED 120Hz; express £339'),
    ('Samsung', 'Galaxy S23+',      'screen_replacement', 239.00, 'AMOLED; express £289'),
    ('Samsung', 'Galaxy S23',       'screen_replacement', 199.00, 'AMOLED; express £249'),
    ('Samsung', 'Galaxy S22 Ultra', 'screen_replacement', 259.00, 'AMOLED; express £319'),
    ('Samsung', 'Galaxy S22',       'screen_replacement', 179.00, 'AMOLED; express £219'),
    ('Samsung', 'Galaxy A54',       'screen_replacement', 149.00, 'AMOLED; express £189'),
    ('Samsung', 'Galaxy A34',       'screen_replacement', 129.00, 'AMOLED; express £159'),
    ('Samsung', 'Galaxy A14',       'screen_replacement',  89.00, 'LCD; express £109'),
    -- Screen replacements — Google Pixel
    ('Google', 'Pixel 8 Pro',       'screen_replacement', 229.00, 'OLED; express £279'),
    ('Google', 'Pixel 8',           'screen_replacement', 199.00, 'OLED; express £249'),
    ('Google', 'Pixel 7 Pro',       'screen_replacement', 209.00, 'OLED; express £259'),
    ('Google', 'Pixel 7',           'screen_replacement', 179.00, 'OLED; express £219'),
    ('Google', 'Pixel 6a',          'screen_replacement', 149.00, 'OLED; express £189'),
    -- Screen replacements — Other
    ('OnePlus', 'OnePlus 12',       'screen_replacement', 199.00, 'AMOLED; express £249'),
    ('Sony',    'Xperia 1 V',       'screen_replacement', 219.00, 'OLED; express £269'),
    -- Battery replacements
    ('Apple', 'iPhone 15 Pro Max', 'battery_replacement',  89.00, 'OEM; express £109'),
    ('Apple', 'iPhone 15 Pro',     'battery_replacement',  79.00, 'OEM; express £99'),
    ('Apple', 'iPhone 15',         'battery_replacement',  79.00, 'OEM; express £99'),
    ('Apple', 'iPhone 14 Pro Max', 'battery_replacement',  79.00, 'OEM; express £99'),
    ('Apple', 'iPhone 14',         'battery_replacement',  69.00, 'OEM; express £89'),
    ('Apple', 'iPhone 13 Pro Max', 'battery_replacement',  79.00, 'OEM; express £99'),
    ('Apple', 'iPhone 13',         'battery_replacement',  69.00, 'OEM; express £89'),
    ('Apple', 'iPhone 12 Pro Max', 'battery_replacement',  69.00, 'OEM; express £89'),
    ('Apple', 'iPhone 12',         'battery_replacement',  59.00, 'OEM; express £79'),
    ('Apple', 'iPhone 11',         'battery_replacement',  59.00, 'OEM; express £79'),
    ('Apple', 'iPhone XS Max',     'battery_replacement',  59.00, 'OEM; express £79'),
    ('Apple', 'iPhone X',          'battery_replacement',  59.00, 'OEM; express £79'),
    ('Apple', 'iPhone 8',          'battery_replacement',  49.00, 'OEM; express £69'),
    ('Samsung', 'Galaxy S24 Ultra','battery_replacement',  89.00, 'OEM; express £109'),
    ('Samsung', 'Galaxy S23',      'battery_replacement',  69.00, 'OEM; express £89'),
    ('Samsung', 'Galaxy S22',      'battery_replacement',  69.00, 'OEM; express £89'),
    ('Samsung', 'Galaxy A54',      'battery_replacement',  59.00, 'OEM; express £79'),
    ('Google',  'Pixel 8 Pro',     'battery_replacement',  79.00, 'OEM; express £99'),
    ('Google',  'Pixel 7',         'battery_replacement',  69.00, 'OEM; express £89'),
    -- Charging port
    ('Apple',   'iPhone 15 Pro Max','charging_port',        69.00, 'USB-C; express £89'),
    ('Apple',   'iPhone 14 Pro Max','charging_port',        69.00, 'Lightning; express £89'),
    ('Apple',   'iPhone 13',        'charging_port',        59.00, 'Lightning; express £79'),
    ('Samsung', 'Galaxy S24 Ultra', 'charging_port',        69.00, 'USB-C; express £89'),
    ('Samsung', 'Galaxy A54',       'charging_port',        59.00, 'USB-C; express £79'),
    ('Google',  'Pixel 8',          'charging_port',        69.00, 'USB-C; express £89'),
    -- Camera
    ('Apple',   'iPhone 15 Pro Max','camera_rear',         119.00, 'Triple camera system; express £149'),
    ('Apple',   'iPhone 14 Pro Max','camera_rear',         119.00, 'Triple camera; express £149'),
    ('Apple',   'iPhone 13 Pro',    'camera_rear',          99.00, 'Triple camera; express £129'),
    ('Samsung', 'Galaxy S24 Ultra', 'camera_rear',         129.00, 'Quad camera; express £159'),
    ('Samsung', 'Galaxy S23',       'camera_rear',          89.00, 'Triple camera; express £119'),
    -- Back glass
    ('Apple',   'iPhone 15 Pro Max','back_glass',          129.00, 'Titanium frame; express £159'),
    ('Apple',   'iPhone 14 Pro Max','back_glass',          109.00, 'Express £139'),
    ('Apple',   'iPhone 13 Pro Max','back_glass',           99.00, 'Express £129'),
    ('Apple',   'iPhone 12 Pro Max','back_glass',           89.00, 'Express £119'),
    ('Apple',   'iPhone 15',        'back_glass',           99.00, 'Express £129'),
    ('Apple',   'iPhone 14',        'back_glass',           89.00, 'Express £119'),
    ('Apple',   'iPhone 11',        'back_glass',           79.00, 'Express £99'),
    ('Samsung', 'Galaxy S24 Ultra', 'back_glass',          119.00, 'Gorilla Glass Armor; express £149'),
    ('Samsung', 'Galaxy S23 Ultra', 'back_glass',          109.00, 'Express £139'),
    ('Samsung', 'Galaxy S24',       'back_glass',           89.00, 'Express £119'),
    ('Google',  'Pixel 8 Pro',      'back_glass',           99.00, 'Polished finish; express £129')
ON CONFLICT (brand, model, service_key) DO NOTHING;
