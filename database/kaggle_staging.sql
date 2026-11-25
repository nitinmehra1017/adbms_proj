USE healthcare_ai_db;

-- Staging table to hold the raw Kaggle Healthcare Dataset verbatim
CREATE TABLE IF NOT EXISTS kaggle_healthcare_staging (
  staging_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(20) NOT NULL,
  blood_type VARCHAR(10) NOT NULL,
  medical_condition VARCHAR(150) NOT NULL,
  date_of_admission DATE NOT NULL,
  doctor VARCHAR(150) NOT NULL,
  hospital VARCHAR(150) NOT NULL,
  insurance_provider VARCHAR(100) NOT NULL,
  billing_amount DECIMAL(14,4) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  admission_type VARCHAR(50) NOT NULL,
  discharge_date DATE NOT NULL,
  medication VARCHAR(150) NOT NULL,
  test_results VARCHAR(50) NOT NULL,
  import_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  rejection_reason VARCHAR(255) NULL,
  imported_patient_id INT UNSIGNED NULL,
  imported_admission_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staging_status (import_status),
  INDEX idx_staging_condition (medical_condition)
) ENGINE=InnoDB;
