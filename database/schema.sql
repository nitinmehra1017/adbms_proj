CREATE DATABASE IF NOT EXISTS healthcare_ai_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE healthcare_ai_db;

CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'DOCTOR', 'STAFF'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departments (
  department_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctors (
  doctor_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(120) NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  patient_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  gender VARCHAR(12) NOT NULL,
  blood_group VARCHAR(3) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  city VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_patients_age CHECK (age BETWEEN 0 AND 120),
  CONSTRAINT chk_patients_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  CONSTRAINT chk_patients_blood_group CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_date DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_appointments_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admissions (
  admission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  admission_date DATE NOT NULL,
  discharge_date DATE NULL,
  diagnosis VARCHAR(180) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_admissions_status CHECK (status IN ('ADMITTED', 'DISCHARGED')),
  CONSTRAINT chk_admissions_dates CHECK (discharge_date IS NULL OR discharge_date >= admission_date),
  CONSTRAINT fk_admissions_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_admissions_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lab_reports (
  report_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  test_name VARCHAR(120) NOT NULL,
  result VARCHAR(255) NOT NULL,
  report_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lab_reports_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  medicine VARCHAR(150) NOT NULL,
  dosage VARCHAR(120) NOT NULL,
  prescription_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prescriptions_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_prescriptions_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS billing (
  bill_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  bill_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_billing_amount CHECK (amount >= 0),
  CONSTRAINT chk_billing_status CHECK (payment_status IN ('PAID', 'PENDING', 'CANCELLED')),
  CONSTRAINT fk_billing_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
