USE healthcare_ai_db;

-- ============================================================
-- 1. COMPLEX JOINS
-- ============================================================

-- Query 1A: INNER JOIN connects each appointment to its patient and doctor.
SELECT p.name AS patient_name, a.appointment_date, d.name AS doctor_name, d.specialization
FROM appointments AS a
INNER JOIN patients AS p ON p.patient_id = a.patient_id
INNER JOIN doctors AS d ON d.doctor_id = a.doctor_id
ORDER BY a.appointment_date;

-- Query 1B: Patient admissions joined with the department responsible for admission.
SELECT p.name AS patient_name, a.diagnosis, a.admission_date, d.department_name
FROM admissions AS a
INNER JOIN patients AS p ON p.patient_id = a.patient_id
INNER JOIN departments AS d ON d.department_id = a.department_id
ORDER BY a.admission_date;

-- Query 1C: LEFT JOIN preserves departments even if they currently have no doctors.
SELECT d.department_name, dr.name AS doctor_name, dr.specialization
FROM departments AS d
LEFT JOIN doctors AS dr ON dr.department_id = d.department_id
ORDER BY d.department_name, dr.name;

-- ============================================================
-- 2. AGGREGATION
-- ============================================================

-- Query 2A: COUNT groups the real patient population by gender.
SELECT gender, COUNT(*) AS patient_count
FROM patients
GROUP BY gender
ORDER BY patient_count DESC;

-- Query 2B: COUNT admissions for every department, retaining zero-admission departments.
SELECT d.department_name, COUNT(a.admission_id) AS admission_count
FROM departments AS d
LEFT JOIN admissions AS a ON a.department_id = d.department_id
GROUP BY d.department_id, d.department_name
ORDER BY admission_count DESC, d.department_name;

-- Query 2C: SUM calculates lifetime billing recorded for each patient.
SELECT p.patient_id, p.name AS patient_name, COALESCE(SUM(b.amount), 0.00) AS total_billing
FROM patients AS p
LEFT JOIN billing AS b ON b.patient_id = p.patient_id
GROUP BY p.patient_id, p.name
ORDER BY total_billing DESC, p.patient_id;

-- Query 2D: AVG reports the average value of an individual billing record.
SELECT AVG(amount) AS average_billing_amount
FROM billing;

-- Query 2E: MIN and MAX identify the billing range in the real dataset.
SELECT MIN(amount) AS minimum_billing_amount, MAX(amount) AS maximum_billing_amount
FROM billing;

-- ============================================================
-- 3. GROUP BY + HAVING
-- ============================================================

-- Query 3A: HAVING filters departments after their admission totals have been aggregated.
SELECT d.department_name, COUNT(a.admission_id) AS admission_count
FROM departments AS d
LEFT JOIN admissions AS a ON a.department_id = d.department_id
GROUP BY d.department_id, d.department_name
HAVING COUNT(a.admission_id) > 8
ORDER BY admission_count DESC;

-- Query 3B: HAVING identifies doctors with more than five appointments.
SELECT d.name AS doctor_name, COUNT(a.appointment_id) AS appointment_count
FROM doctors AS d
LEFT JOIN appointments AS a ON a.doctor_id = d.doctor_id
GROUP BY d.doctor_id, d.name
HAVING COUNT(a.appointment_id) > 5
ORDER BY appointment_count DESC, doctor_name;

-- ============================================================
-- 4. SUBQUERIES
-- ============================================================

-- Query 4A: Compare each patient's billing total with the average patient billing total.
SELECT p.patient_id, p.name AS patient_name, SUM(b.amount) AS total_billing
FROM patients AS p
INNER JOIN billing AS b ON b.patient_id = p.patient_id
GROUP BY p.patient_id, p.name
HAVING SUM(b.amount) > (
  SELECT AVG(patient_total)
  FROM (SELECT SUM(amount) AS patient_total FROM billing GROUP BY patient_id) AS billing_totals
)
ORDER BY total_billing DESC;

-- Query 4B: Find the patient or patients holding the maximum single billing amount.
SELECT p.patient_id, p.name AS patient_name, b.amount AS maximum_bill
FROM billing AS b
INNER JOIN patients AS p ON p.patient_id = b.patient_id
WHERE b.amount = (SELECT MAX(amount) FROM billing);

-- Query 4C: Doctors whose appointment counts exceed the average doctor appointment count.
SELECT d.doctor_id, d.name AS doctor_name, COUNT(a.appointment_id) AS appointment_count
FROM doctors AS d
LEFT JOIN appointments AS a ON a.doctor_id = d.doctor_id
GROUP BY d.doctor_id, d.name
HAVING COUNT(a.appointment_id) > (
  SELECT AVG(appointment_total)
  FROM (SELECT COUNT(*) AS appointment_total FROM appointments GROUP BY doctor_id) AS doctor_totals
)
ORDER BY appointment_count DESC, doctor_name;

-- ============================================================
-- 5. CORRELATED SUBQUERY
-- ============================================================

-- Query 5A: Correlated because the inner calculation references outer patient p.city.
SELECT p.patient_id, p.name AS patient_name, p.city, SUM(b.amount) AS total_billing
FROM patients AS p
INNER JOIN billing AS b ON b.patient_id = p.patient_id
GROUP BY p.patient_id, p.name, p.city
HAVING SUM(b.amount) > (
  SELECT AVG(b2.amount)
  FROM billing AS b2
  INNER JOIN patients AS p2 ON p2.patient_id = b2.patient_id
  WHERE p2.city = p.city
)
ORDER BY p.city, total_billing DESC;

-- ============================================================
-- 6. COMMON TABLE EXPRESSIONS
-- ============================================================

-- Query 6A: CTE makes department admission totals reusable and readable.
WITH department_admissions AS (
  SELECT department_id, COUNT(*) AS admission_count
  FROM admissions
  GROUP BY department_id
)
SELECT d.department_name, COALESCE(da.admission_count, 0) AS admission_count
FROM departments AS d
LEFT JOIN department_admissions AS da ON da.department_id = d.department_id
ORDER BY admission_count DESC, d.department_name;

-- Query 6B: CTE first calculates patient billing totals, then joins demographic data.
WITH patient_billing AS (
  SELECT patient_id, SUM(amount) AS total_billing
  FROM billing
  GROUP BY patient_id
)
SELECT p.name AS patient_name, p.city, COALESCE(pb.total_billing, 0.00) AS total_billing
FROM patients AS p
LEFT JOIN patient_billing AS pb ON pb.patient_id = p.patient_id
ORDER BY total_billing DESC, p.name;

-- ============================================================
-- 7. WINDOW FUNCTIONS
-- ============================================================

-- Query 7A: RANK ranks departments by admission volume and retains ties.
WITH department_admissions AS (
  SELECT d.department_id, d.department_name, COUNT(a.admission_id) AS admission_count
  FROM departments AS d
  LEFT JOIN admissions AS a ON a.department_id = d.department_id
  GROUP BY d.department_id, d.department_name
)
SELECT department_name, admission_count,
  RANK() OVER (ORDER BY admission_count DESC) AS admission_rank
FROM department_admissions
ORDER BY admission_rank, department_name;

-- Query 7B: DENSE_RANK ranks doctors by appointment count without gaps after ties.
WITH doctor_appointments AS (
  SELECT d.doctor_id, d.name AS doctor_name, COUNT(a.appointment_id) AS appointment_count
  FROM doctors AS d
  LEFT JOIN appointments AS a ON a.doctor_id = d.doctor_id
  GROUP BY d.doctor_id, d.name
)
SELECT doctor_name, appointment_count,
  DENSE_RANK() OVER (ORDER BY appointment_count DESC) AS appointment_rank
FROM doctor_appointments
ORDER BY appointment_rank, doctor_name;

-- Query 7C: ROW_NUMBER orders patients by billing within each city (PARTITION BY city).
WITH patient_billing AS (
  SELECT p.patient_id, p.name AS patient_name, p.city, COALESCE(SUM(b.amount), 0.00) AS total_billing
  FROM patients AS p
  LEFT JOIN billing AS b ON b.patient_id = p.patient_id
  GROUP BY p.patient_id, p.name, p.city
)
SELECT patient_name, city, total_billing,
  ROW_NUMBER() OVER (PARTITION BY city ORDER BY total_billing DESC, patient_name) AS billing_position_in_city
FROM patient_billing
ORDER BY city, billing_position_in_city;

-- ============================================================
-- 8. CASE EXPRESSIONS
-- ============================================================

-- Query 8A: CASE assigns clinically useful patient age bands.
SELECT patient_id, name AS patient_name, age,
  CASE
    WHEN age BETWEEN 0 AND 17 THEN 'Child'
    WHEN age BETWEEN 18 AND 59 THEN 'Adult'
    ELSE 'Senior'
  END AS age_group
FROM patients
ORDER BY age, patient_id;

-- Query 8B: CASE classifies each real patient billing total into reporting bands.
SELECT p.patient_id, p.name AS patient_name, COALESCE(SUM(b.amount), 0.00) AS total_billing,
  CASE
    WHEN COALESCE(SUM(b.amount), 0.00) < 10000 THEN 'Low'
    WHEN COALESCE(SUM(b.amount), 0.00) <= 50000 THEN 'Medium'
    ELSE 'High'
  END AS billing_band
FROM patients AS p
LEFT JOIN billing AS b ON b.patient_id = p.patient_id
GROUP BY p.patient_id, p.name
ORDER BY total_billing DESC;

-- ============================================================
-- 9. DATE-BASED ANALYTICS
-- ============================================================

-- Query 9A: DATE_FORMAT groups admissions into calendar months.
SELECT DATE_FORMAT(admission_date, '%Y-%m') AS admission_month, COUNT(*) AS admission_count
FROM admissions
GROUP BY DATE_FORMAT(admission_date, '%Y-%m')
ORDER BY admission_month;

-- Query 9B: DATE_FORMAT groups appointments into calendar months.
SELECT DATE_FORMAT(appointment_date, '%Y-%m') AS appointment_month, COUNT(*) AS appointment_count
FROM appointments
GROUP BY DATE_FORMAT(appointment_date, '%Y-%m')
ORDER BY appointment_month;

-- Query 9C: Date-range filtering returns admissions during Q1 2026.
SELECT admission_id, patient_id, admission_date, diagnosis, status
FROM admissions
WHERE admission_date >= DATE('2026-01-01') AND admission_date < DATE('2026-04-01')
ORDER BY admission_date;

-- Query 9D: DATEDIFF calculates average completed admission length of stay in days.
SELECT ROUND(AVG(DATEDIFF(discharge_date, admission_date)), 2) AS average_length_of_stay_days
FROM admissions
WHERE discharge_date IS NOT NULL;

-- ============================================================
-- 10. UNION ALL
-- ============================================================

-- Query 10A: UNION ALL deliberately preserves an admission and appointment when both occur on the same date.
SELECT patient_id, DATE(appointment_date) AS activity_date, 'APPOINTMENT' AS activity_type, status AS activity_status
FROM appointments
UNION ALL
SELECT patient_id, admission_date AS activity_date, 'ADMISSION' AS activity_type, status AS activity_status
FROM admissions
ORDER BY activity_date, patient_id, activity_type;

-- ============================================================
-- 11. COMBINED ADVANCED QUERY
-- ============================================================

-- Query 11A: CTEs, joins, aggregation, and DENSE_RANK combine to compare department admission volume and patient billing.
WITH department_admissions AS (
  SELECT department_id, COUNT(*) AS admission_count
  FROM admissions
  GROUP BY department_id
),
department_billing AS (
  SELECT admitted.department_id, AVG(billed_patient.total_billing) AS average_patient_billing
  FROM (SELECT DISTINCT department_id, patient_id FROM admissions) AS admitted
  INNER JOIN (
    SELECT patient_id, SUM(amount) AS total_billing
    FROM billing
    GROUP BY patient_id
  ) AS billed_patient ON billed_patient.patient_id = admitted.patient_id
  GROUP BY admitted.department_id
)
SELECT d.department_name, COALESCE(da.admission_count, 0) AS admission_count,
  COALESCE(db.average_patient_billing, 0.00) AS average_patient_billing,
  DENSE_RANK() OVER (
    ORDER BY COALESCE(da.admission_count, 0) DESC, COALESCE(db.average_patient_billing, 0.00) DESC
  ) AS department_rank
FROM departments AS d
LEFT JOIN department_admissions AS da ON da.department_id = d.department_id
LEFT JOIN department_billing AS db ON db.department_id = d.department_id
ORDER BY department_rank, d.department_name;
