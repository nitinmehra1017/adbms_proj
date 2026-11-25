USE healthcare_ai_db;

-- Existing primary, unique, and foreign-key indexes plus Step 3A indexes.
SHOW INDEX FROM patients;
SHOW INDEX FROM appointments;
SHOW INDEX FROM admissions;
SHOW INDEX FROM billing;

-- Real workload examples. EXPLAIN reveals the optimizer's actual choice.
SELECT admission_id, patient_id, department_id, admission_date, diagnosis
FROM admissions
WHERE admission_date >= '2026-01-01';

EXPLAIN
SELECT admission_id, patient_id, department_id, admission_date, diagnosis
FROM admissions
WHERE admission_date >= '2026-01-01';

SELECT appointment_id, patient_id, doctor_id, appointment_date, status
FROM appointments
WHERE appointment_date >= '2026-01-01'
ORDER BY appointment_date;

EXPLAIN
SELECT appointment_id, patient_id, doctor_id, appointment_date, status
FROM appointments
WHERE appointment_date >= '2026-01-01'
ORDER BY appointment_date;
