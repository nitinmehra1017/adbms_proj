-- This is a controlled local federation simulation: hospital_a_db and hospital_b_db
-- are separate MySQL databases on one server, not a production multi-server deployment.

-- ============================================================
-- 1. COMBINED PATIENT AND ADMISSION COUNTS
-- ============================================================
SELECT SUM(patient_count) AS combined_patients, SUM(admission_count) AS combined_admissions
FROM (
  SELECT COUNT(*) AS patient_count, (SELECT COUNT(*) FROM hospital_a_db.admissions) AS admission_count
  FROM hospital_a_db.patients
  UNION ALL
  SELECT COUNT(*), (SELECT COUNT(*) FROM hospital_b_db.admissions)
  FROM hospital_b_db.patients
) AS hospital_counts;

-- ============================================================
-- 2. COMBINED ADMISSIONS BY DEPARTMENT
-- ============================================================
SELECT department, SUM(admission_count) AS combined_admission_count
FROM (
  SELECT department, COUNT(*) AS admission_count
  FROM hospital_a_db.admissions
  GROUP BY department
  UNION ALL
  SELECT department, COUNT(*) AS admission_count
  FROM hospital_b_db.admissions
  GROUP BY department
) AS department_counts
GROUP BY department
ORDER BY combined_admission_count DESC, department;

-- ============================================================
-- 3. BILLING TOTALS BY HOSPITAL AND COMBINED
-- ============================================================
SELECT hospital, billing_total
FROM (
  SELECT 'Hospital A' AS hospital, COALESCE(SUM(amount), 0.00) AS billing_total FROM hospital_a_db.billing
  UNION ALL
  SELECT 'Hospital B', COALESCE(SUM(amount), 0.00) FROM hospital_b_db.billing
) AS hospital_billing
UNION ALL
SELECT 'Combined', SUM(billing_total)
FROM (
  SELECT COALESCE(SUM(amount), 0.00) AS billing_total FROM hospital_a_db.billing
  UNION ALL
  SELECT COALESCE(SUM(amount), 0.00) FROM hospital_b_db.billing
) AS combined_billing;

-- ============================================================
-- 4. CROSS-HOSPITAL ADMISSION ACTIVITY
-- ============================================================
-- UNION ALL is intentional: independent hospitals can legitimately contain similar
-- admissions, and deduplicating them would incorrectly hide source records.
SELECT hospital, patient_name, diagnosis, department, admission_date
FROM (
  SELECT 'Hospital A' AS hospital, p.patient_name, a.diagnosis, a.department, a.admission_date
  FROM hospital_a_db.admissions AS a
  INNER JOIN hospital_a_db.patients AS p ON p.patient_id = a.patient_id
  UNION ALL
  SELECT 'Hospital B', p.patient_name, a.diagnosis, a.department, a.admission_date
  FROM hospital_b_db.admissions AS a
  INNER JOIN hospital_b_db.patients AS p ON p.patient_id = a.patient_id
) AS combined_activity
ORDER BY admission_date, hospital, patient_name;
