USE healthcare_ai_db;

DROP PROCEDURE IF EXISTS get_patient_medical_summary;

DELIMITER //
CREATE PROCEDURE get_patient_medical_summary(IN p_patient_id INT)
BEGIN
  -- A nonexistent patient ID naturally returns an empty result set.
  -- Independent scalar subqueries avoid multiplying one-to-many counts.
  SELECT
    p.patient_id,
    p.name AS patient_name,
    p.age,
    p.gender,
    p.blood_group,
    (SELECT COUNT(*) FROM appointments AS a WHERE a.patient_id = p.patient_id) AS appointment_count,
    (SELECT COUNT(*) FROM admissions AS a WHERE a.patient_id = p.patient_id) AS admission_count,
    (SELECT MAX(a.admission_date) FROM admissions AS a WHERE a.patient_id = p.patient_id) AS latest_admission_date,
    (SELECT COUNT(*) FROM lab_reports AS l WHERE l.patient_id = p.patient_id) AS lab_report_count,
    (SELECT COUNT(*) FROM prescriptions AS pr WHERE pr.patient_id = p.patient_id) AS prescription_count,
    COALESCE((SELECT SUM(b.amount) FROM billing AS b WHERE b.patient_id = p.patient_id), 0.00) AS total_billing_amount
  FROM patients AS p
  WHERE p.patient_id = p_patient_id;
END //
DELIMITER ;
