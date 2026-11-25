USE healthcare_ai_db;

-- phone already has the unique index created by patients.phone UNIQUE.
-- Foreign-key columns already have InnoDB indexes: appointments.patient_id,
-- appointments.doctor_id, admissions.department_id, and billing.patient_id.
-- The following indexes serve date-range filtering/sorting and diagnosis filtering.
CREATE INDEX idx_appointments_date ON appointments (appointment_date);
CREATE INDEX idx_admissions_date ON admissions (admission_date);
CREATE INDEX idx_admissions_diagnosis ON admissions (diagnosis);
CREATE INDEX idx_billing_date ON billing (bill_date);
