CREATE DATABASE IF NOT EXISTS hospital_a_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE hospital_a_db;

CREATE TABLE IF NOT EXISTS patients (
  patient_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  gender VARCHAR(12) NOT NULL,
  city VARCHAR(80) NOT NULL,
  CONSTRAINT chk_hospital_a_patient_age CHECK (age BETWEEN 0 AND 120),
  CONSTRAINT chk_hospital_a_patient_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admissions (
  admission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  admission_date DATE NOT NULL,
  diagnosis VARCHAR(180) NOT NULL,
  department VARCHAR(100) NOT NULL,
  CONSTRAINT fk_hospital_a_admission_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS billing (
  bill_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  bill_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  CONSTRAINT chk_hospital_a_billing_amount CHECK (amount >= 0),
  CONSTRAINT fk_hospital_a_billing_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT IGNORE INTO patients (patient_id, patient_name, age, gender, city) VALUES
  (1, 'Aanya Kulkarni', 34, 'FEMALE', 'Pune'),
  (2, 'Harish Malhotra', 57, 'MALE', 'Mumbai'),
  (3, 'Nitin George', 45, 'MALE', 'Kochi'),
  (4, 'Sonal Mehra', 29, 'FEMALE', 'Delhi'),
  (5, 'Vijay Rao', 63, 'MALE', 'Bengaluru'),
  (6, 'Anita Dsouza', 38, 'FEMALE', 'Goa'),
  (7, 'Rajiv Batra', 51, 'MALE', 'Jaipur'),
  (8, 'Kiran Sethi', 16, 'OTHER', 'Chandigarh');

INSERT IGNORE INTO admissions (admission_id, patient_id, admission_date, diagnosis, department) VALUES
  (1, 1, '2026-01-08', 'Diabetes mellitus', 'General Medicine'),
  (2, 2, '2026-01-14', 'Cardiac arrhythmia', 'Cardiology'),
  (3, 3, '2026-02-02', 'Asthma exacerbation', 'General Medicine'),
  (4, 4, '2026-02-18', 'Migraine', 'Neurology'),
  (5, 5, '2026-03-06', 'Hypertension', 'Cardiology'),
  (6, 6, '2026-03-25', 'Community-acquired infection', 'General Medicine'),
  (7, 7, '2026-04-09', 'Distal radius fracture', 'Orthopedics'),
  (8, 8, '2026-04-21', 'Viral fever', 'Pediatrics'),
  (9, 1, '2026-05-11', 'Diabetes review', 'General Medicine'),
  (10, 2, '2026-06-03', 'Chest pain observation', 'Cardiology');

INSERT IGNORE INTO billing (bill_id, patient_id, bill_date, amount) VALUES
  (1, 1, '2026-01-10', 4200.00),
  (2, 2, '2026-01-17', 7800.00),
  (3, 3, '2026-02-04', 3100.00),
  (4, 4, '2026-02-20', 2600.00),
  (5, 5, '2026-03-08', 5400.00),
  (6, 6, '2026-03-28', 2300.00),
  (7, 7, '2026-04-12', 6100.00),
  (8, 8, '2026-04-23', 1800.00);
