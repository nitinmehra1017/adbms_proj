-- =============================================================
-- Migration 005: Prescription Billing, Pricing & Patient History
-- =============================================================

USE healthcare_ai_db;

-- 1. Add pricing and strip size columns to prescription_items if not present
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'healthcare_ai_db'
    AND TABLE_NAME = 'prescription_items'
    AND COLUMN_NAME = 'strip_size'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE prescription_items
     ADD COLUMN strip_size INT UNSIGNED NOT NULL DEFAULT 10 AFTER duration,
     ADD COLUMN price_per_strip DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER strip_size,
     ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER price_per_strip,
     ADD COLUMN total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER unit_price',
  'SELECT "strip_size already exists in prescription_items"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add total_amount to prescription_headers if not present
SET @col_hdr_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'healthcare_ai_db'
    AND TABLE_NAME = 'prescription_headers'
    AND COLUMN_NAME = 'total_amount'
);

SET @sql_hdr = IF(@col_hdr_exists = 0,
  'ALTER TABLE prescription_headers
     ADD COLUMN total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER status',
  'SELECT "total_amount already exists in prescription_headers"'
);
PREPARE stmt_hdr FROM @sql_hdr;
EXECUTE stmt_hdr;
DEALLOCATE PREPARE stmt_hdr;

-- 3. Add amount_paid to dispensing_events if not present
SET @col_disp_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'healthcare_ai_db'
    AND TABLE_NAME = 'dispensing_events'
    AND COLUMN_NAME = 'amount_paid'
);

SET @sql_disp = IF(@col_disp_exists = 0,
  'ALTER TABLE dispensing_events
     ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER quantity_dispensed',
  'SELECT "amount_paid already exists in dispensing_events"'
);
PREPARE stmt_disp FROM @sql_disp;
EXECUTE stmt_disp;
DEALLOCATE PREPARE stmt_disp;

-- 4. Backfill any existing test items with default pricing (₹300/strip of 10)
UPDATE prescription_items
SET strip_size = 10,
    price_per_strip = 300.00,
    unit_price = 30.00,
    total_price = CEIL(quantity_prescribed / 10) * 300.00
WHERE price_per_strip = 0.00;

-- 5. Backfill prescription_headers total_amount from items
UPDATE prescription_headers ph
JOIN (
  SELECT prescription_ref, SUM(total_price) AS sum_amount
  FROM prescription_items
  GROUP BY prescription_ref
) pi ON pi.prescription_ref = ph.prescription_ref
SET ph.total_amount = pi.sum_amount
WHERE ph.total_amount = 0.00;

-- 6. Backfill existing dispensing_events amount_paid
UPDATE dispensing_events de
JOIN prescription_items pi ON pi.item_id = de.item_id
SET de.amount_paid = de.quantity_dispensed * (pi.price_per_strip / pi.strip_size)
WHERE de.amount_paid = 0.00;
