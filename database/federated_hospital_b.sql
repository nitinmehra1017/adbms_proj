CREATE DATABASE IF NOT EXISTS hospital_b_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE hospital_b_db;

CREATE TABLE IF NOT EXISTS patients (
  patient_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  gender VARCHAR(12) NOT NULL,
  city VARCHAR(80) NOT NULL,
  CONSTRAINT chk_hospital_b_patient_age CHECK (age BETWEEN 0 AND 120),
  CONSTRAINT chk_hospital_b_patient_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admissions (
  admission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  admission_date DATE NOT NULL,
  diagnosis VARCHAR(180) NOT NULL,
  department VARCHAR(100) NOT NULL,
  CONSTRAINT fk_hospital_b_admission_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS billing (
  bill_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  bill_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  CONSTRAINT chk_hospital_b_billing_amount CHECK (amount >= 0),
  CONSTRAINT fk_hospital_b_billing_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT IGNORE INTO patients (patient_id, patient_name, age, gender, city) VALUES
  (1, 'Mehul Shah', 47, 'MALE', 'Ahmedabad'),
  (2, 'Ira Thomas', 36, 'FEMALE', 'Chennai'),
  (3, 'Prateek Nanda', 59, 'MALE', 'Noida'),
  (4, 'Farah Ali', 42, 'FEMALE', 'Hyderabad'),
  (5, 'Sanjay Pillai', 68, 'MALE', 'Thiruvananthapuram'),
  (6, 'Naina Bose', 24, 'FEMALE', 'Kolkata'),
  (7, 'Om Prakash', 12, 'MALE', 'Lucknow');

INSERT IGNORE INTO admissions (admission_id, patient_id, admission_date, diagnosis, department) VALUES
  (1, 1, '2026-01-05', 'Hypertension', 'Cardiology'),
  (2, 2, '2026-01-29', 'Diabetes mellitus', 'General Medicine'),
  (3, 3, '2026-02-11', 'Lumbar fracture', 'Orthopedics'),
  (4, 4, '2026-02-27', 'Asthma exacerbation', 'General Medicine'),
  (5, 5, '2026-03-14', 'Transient ischemic attack', 'Neurology'),
  (6, 6, '2026-03-31', 'Community-acquired infection', 'General Medicine'),
  (7, 7, '2026-04-16', 'Viral fever', 'Pediatrics'),
  (8, 1, '2026-05-02', 'Cardiac follow-up', 'Cardiology'),
  (9, 4, '2026-05-26', 'Asthma follow-up', 'General Medicine');

INSERT IGNORE INTO billing (bill_id, patient_id, bill_date, amount) VALUES
  (1, 1, '2026-01-07', 4900.00),
  (2, 2, '2026-01-31', 3700.00),
  (3, 3, '2026-02-14', 6800.00),
  (4, 4, '2026-03-01', 2900.00),
  (5, 5, '2026-03-16', 7200.00),
  (6, 6, '2026-04-02', 2500.00),
  (7, 7, '2026-04-18', 1600.00);
