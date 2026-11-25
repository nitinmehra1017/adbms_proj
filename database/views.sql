USE healthcare_ai_db;

CREATE OR REPLACE VIEW patient_summary AS
SELECT
  p.patient_id,
  p.name AS patient_name,
  p.age,
  p.gender,
  p.blood_group,
  COALESCE(ap.appointment_count, 0) AS appointment_count,
  COALESCE(ad.admission_count, 0) AS admission_count,
  COALESCE(bl.total_billing_amount, 0.00) AS total_billing_amount
FROM patients AS p
LEFT JOIN (
  SELECT patient_id, COUNT(*) AS appointment_count
  FROM appointments
  GROUP BY patient_id
) AS ap ON ap.patient_id = p.patient_id
LEFT JOIN (
  SELECT patient_id, COUNT(*) AS admission_count
  FROM admissions
  GROUP BY patient_id
) AS ad ON ad.patient_id = p.patient_id
LEFT JOIN (
  SELECT patient_id, SUM(amount) AS total_billing_amount
  FROM billing
  GROUP BY patient_id
) AS bl ON bl.patient_id = p.patient_id;

CREATE OR REPLACE VIEW department_statistics AS
SELECT
  d.department_id,
  d.department_name,
  COALESCE(dc.doctor_count, 0) AS doctor_count,
  COALESCE(ac.admission_count, 0) AS admission_count,
  COALESCE(ba.average_patient_billing, 0.00) AS average_patient_billing
FROM departments AS d
LEFT JOIN (
  SELECT department_id, COUNT(*) AS doctor_count
  FROM doctors
  GROUP BY department_id
) AS dc ON dc.department_id = d.department_id
LEFT JOIN (
  SELECT department_id, COUNT(*) AS admission_count
  FROM admissions
  GROUP BY department_id
) AS ac ON ac.department_id = d.department_id
LEFT JOIN (
  SELECT admitted_patients.department_id, AVG(patient_bills.total_billing_amount) AS average_patient_billing
  FROM (
    SELECT DISTINCT department_id, patient_id
    FROM admissions
  ) AS admitted_patients
  LEFT JOIN (
    SELECT patient_id, SUM(amount) AS total_billing_amount
    FROM billing
    GROUP BY patient_id
  ) AS patient_bills ON patient_bills.patient_id = admitted_patients.patient_id
  GROUP BY admitted_patients.department_id
) AS ba ON ba.department_id = d.department_id;
