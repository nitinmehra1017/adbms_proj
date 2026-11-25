USE healthcare_ai_db;

-- Separate from audit_logs, which remains reserved for database-trigger auditing.
CREATE TABLE IF NOT EXISTS ai_query_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  question TEXT NOT NULL,
  generated_sql TEXT NULL,
  query_type VARCHAR(50) NULL,
  execution_status VARCHAR(40) NOT NULL,
  row_count INT UNSIGNED NULL,
  execution_time_ms INT UNSIGNED NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_ai_query_audit_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ai_query_audit_status
    CHECK (execution_status IN ('SUCCESS', 'VALIDATION_REJECTED', 'GEMINI_UNAVAILABLE', 'EXECUTION_FAILED', 'SYSTEM_ERROR')),
  INDEX idx_ai_query_audit_user_created (user_id, created_at DESC),
  INDEX idx_ai_query_audit_created (created_at DESC)
) ENGINE=InnoDB;
