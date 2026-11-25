USE healthcare_ai_db;

-- This table is intentionally limited to trigger-based database auditing.
-- It is not the future AI query audit-log design.
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(64) NOT NULL,
  operation VARCHAR(20) NOT NULL,
  record_id BIGINT UNSIGNED NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_audit_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
) ENGINE=InnoDB;
