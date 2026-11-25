USE healthcare_ai_db;

-- ============================================================
-- SUCCESSFUL ADMISSION + BILLING TRANSACTION
-- ============================================================
-- This executable example creates two related healthcare records as one unit.
-- Execute it once when demonstrating COMMIT; it intentionally persists one admission and one bill.

SELECT COUNT(*) AS admissions_before FROM admissions;
SELECT COUNT(*) AS billing_before FROM billing;

START TRANSACTION;

INSERT INTO admissions (patient_id, department_id, admission_date, discharge_date, diagnosis, status)
VALUES (1, 1, '2026-09-28', NULL, 'Transaction workflow observation', 'ADMITTED');
SET @new_admission_id = LAST_INSERT_ID();

INSERT INTO billing (patient_id, amount, payment_status, bill_date)
VALUES (1, 2500.00, 'PENDING', '2026-09-28');
SET @new_billing_id = LAST_INSERT_ID();

COMMIT;

SELECT COUNT(*) AS admissions_after FROM admissions;
SELECT COUNT(*) AS billing_after FROM billing;
SELECT admission_id, patient_id, department_id, admission_date, diagnosis, status
FROM admissions WHERE admission_id = @new_admission_id;
SELECT bill_id, patient_id, amount, payment_status, bill_date
FROM billing WHERE bill_id = @new_billing_id;

-- ============================================================
-- FAILED TRANSACTION / ROLLBACK PATTERN
-- ============================================================
-- MySQL does not automatically roll back earlier successful statements after every SQL error.
-- The application must explicitly issue ROLLBACK in its error handler:
--
-- START TRANSACTION;
-- INSERT INTO admissions (...) VALUES (... valid values ...);
-- INSERT INTO billing (...) VALUES (99999, 2500.00, 'PENDING', CURRENT_DATE);
-- -- The billing foreign key fails because patient 99999 does not exist.
-- ROLLBACK;
--
-- POST /api/db/transactions/admission exercises this behavior with mysql2. A negative
-- totalAmount triggers the real billing CHECK constraint after the admission INSERT,
-- and the endpoint explicitly rolls the transaction back.
