USE healthcare_ai_db;

DROP TRIGGER IF EXISTS after_billing_insert;

DELIMITER //
CREATE TRIGGER after_billing_insert
AFTER INSERT ON billing
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (table_name, operation, record_id, description)
  VALUES (
    'billing',
    'INSERT',
    NEW.bill_id,
    CONCAT('Billing record inserted for patient #', NEW.patient_id,
           '; amount=', FORMAT(NEW.amount, 2),
           '; payment_status=', NEW.payment_status)
  );
END //
DELIMITER ;
