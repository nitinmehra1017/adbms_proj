-- =============================================================
-- Migration 004: Prescription Management & Pharmacy Workflow
-- =============================================================
-- Run once. Guarded by IF NOT EXISTS / INSERT IGNORE.
-- Does NOT drop any existing table or reset existing data.
-- =============================================================

-- 1. Add PHARMACY demo user (idempotent)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'Pharmacy Staff',
  'pharmacy@hospital.test',
  -- bcrypt hash of 'Demo@123' (cost 10)
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.P',
  'PHARMACY'
);

-- 2. prescription_headers: one row per issued prescription
CREATE TABLE IF NOT EXISTS prescription_headers (
  prescription_ref   CHAR(20)         NOT NULL,          -- UUID-derived opaque token
  patient_id         INT UNSIGNED     NOT NULL,
  issuing_user_id    INT UNSIGNED     NOT NULL,           -- user_id of the DOCTOR
  doctor_name        VARCHAR(150)     NOT NULL,           -- denormalized for display
  status             ENUM('DRAFT','ISSUED','PARTIALLY_DISPENSED','DISPENSED','REVOKED')
                                      NOT NULL DEFAULT 'DRAFT',
  general_notes      TEXT             NULL,
  issued_at          TIMESTAMP        NULL DEFAULT NULL,
  created_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  superseded_by_ref  CHAR(20)         NULL,               -- points to replacement prescription
  PRIMARY KEY (prescription_ref),
  INDEX idx_ph_patient (patient_id),
  INDEX idx_ph_user    (issuing_user_id),
  INDEX idx_ph_status  (status),
  INDEX idx_ph_issued  (issued_at),
  CONSTRAINT fk_ph_patient FOREIGN KEY (patient_id)      REFERENCES patients (patient_id) ON UPDATE CASCADE,
  CONSTRAINT fk_ph_user    FOREIGN KEY (issuing_user_id) REFERENCES users    (user_id)    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. prescription_items: medicine line items for each header
CREATE TABLE IF NOT EXISTS prescription_items (
  item_id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  prescription_ref   CHAR(20)         NOT NULL,
  medicine_name      VARCHAR(200)     NOT NULL,
  strength           VARCHAR(80)      NULL,
  dosage_instruction VARCHAR(300)     NOT NULL,
  frequency          VARCHAR(100)     NOT NULL,
  duration           VARCHAR(80)      NOT NULL,
  quantity_prescribed DECIMAL(10,2)   NOT NULL CHECK (quantity_prescribed > 0),
  route_of_admin     VARCHAR(80)      NULL,
  extra_instructions TEXT             NULL,
  PRIMARY KEY (item_id),
  INDEX idx_pi_ref (prescription_ref),
  CONSTRAINT fk_pi_ref FOREIGN KEY (prescription_ref) REFERENCES prescription_headers (prescription_ref) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. dispensing_events: one row per dispensing transaction
CREATE TABLE IF NOT EXISTS dispensing_events (
  event_id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  item_id            INT UNSIGNED     NOT NULL,
  prescription_ref   CHAR(20)         NOT NULL,
  quantity_dispensed DECIMAL(10,2)    NOT NULL CHECK (quantity_dispensed > 0),
  dispensed_by       INT UNSIGNED     NOT NULL,           -- user_id of PHARMACY staff
  dispensing_note    TEXT             NULL,
  dispensed_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  INDEX idx_de_item   (item_id),
  INDEX idx_de_ref    (prescription_ref),
  INDEX idx_de_user   (dispensed_by),
  INDEX idx_de_ts     (dispensed_at),
  CONSTRAINT fk_de_item   FOREIGN KEY (item_id)          REFERENCES prescription_items   (item_id)          ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_de_ref    FOREIGN KEY (prescription_ref) REFERENCES prescription_headers (prescription_ref) ON UPDATE CASCADE,
  CONSTRAINT fk_de_user   FOREIGN KEY (dispensed_by)     REFERENCES users               (user_id)           ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. prescription_audit_log: tracks important lifecycle events
CREATE TABLE IF NOT EXISTS prescription_audit_log (
  audit_id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  prescription_ref   CHAR(20)         NOT NULL,
  actor_user_id      INT UNSIGNED     NOT NULL,
  event_type         VARCHAR(60)      NOT NULL,           -- CREATED, ISSUED, DISPENSED, REVOKED, LOOKUP_FAIL, etc.
  event_detail       TEXT             NULL,
  created_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  INDEX idx_pal_ref  (prescription_ref),
  INDEX idx_pal_user (actor_user_id),
  INDEX idx_pal_ts   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
