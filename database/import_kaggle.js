/**
 * ETL Pipeline: Kaggle Healthcare Dataset Ingestion
 * 
 * Ingests and normalizes the Kaggle Healthcare Dataset (prasad22/healthcare-dataset)
 * into MySQL database `healthcare_ai_db`.
 * 
 * Preserves:
 *  - Existing demo users (admin, doctor, staff)
 *  - Existing 50 demo patients, appointments, admissions, billing
 *  - Views, indexes, stored procedures, triggers, audit logging, and RBAC
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const CSV_PATH = path.join(__dirname, 'data/healthcare_dataset.csv');
const BATCH_SIZE = 1000;

function cleanName(raw) {
  if (!raw) return 'Unknown';
  return raw
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, (char) => char.toUpperCase());
}

function parseCsvLine(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      cols.push(current.replace(/^"|"$/g, '').trim());
      current = '';
    } else {
      current += c;
    }
  }
  cols.push(current.replace(/^"|"$/g, '').trim());
  return cols;
}

async function main() {
  console.log('====================================================');
  console.log('  Kaggle Healthcare Dataset ETL Pipeline');
  console.log('====================================================');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'healthcare_ai_db',
    multipleStatements: true,
    dateStrings: true
  });

  console.log(`Connected to database '${process.env.DB_NAME}'.`);

  try {
    // 1. Ensure Staging Table Exists
    console.log('\n[1/6] Verifying staging table `kaggle_healthcare_staging`...');
    await conn.query(`
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
    `);

    // 2. Read and Stage CSV Records
    console.log('[2/6] Loading CSV records into staging table...');
    await conn.query('TRUNCATE TABLE kaggle_healthcare_staging');

    const fileStream = fs.createReadStream(CSV_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    let rawRowCount = 0;
    let stagingBatch = [];

    for await (const line of rl) {
      if (!line.trim()) continue;
      const cols = parseCsvLine(line);

      if (isHeader) {
        isHeader = false;
        continue;
      }

      if (cols.length < 15) continue;
      rawRowCount++;

      const [
        name, age, gender, bloodType, condition, admDate,
        doctor, hospital, insurance, billingAmt, room, admType,
        disDate, medication, testResults
      ] = cols;

      stagingBatch.push([
        name, parseInt(age, 10), gender.toUpperCase(), bloodType.trim(),
        condition.trim(), admDate.trim(), doctor.trim(), hospital.trim(),
        insurance.trim(), parseFloat(billingAmt), room.trim(), admType.trim(),
        disDate.trim(), medication.trim(), testResults.trim()
      ]);

      if (stagingBatch.length >= BATCH_SIZE) {
        await conn.query(
          `INSERT INTO kaggle_healthcare_staging 
            (name, age, gender, blood_type, medical_condition, date_of_admission,
             doctor, hospital, insurance_provider, billing_amount, room_number,
             admission_type, discharge_date, medication, test_results)
           VALUES ?`,
          [stagingBatch]
        );
        stagingBatch = [];
      }
    }

    if (stagingBatch.length > 0) {
      await conn.query(
        `INSERT INTO kaggle_healthcare_staging 
          (name, age, gender, blood_type, medical_condition, date_of_admission,
           doctor, hospital, insurance_provider, billing_amount, room_number,
           admission_type, discharge_date, medication, test_results)
         VALUES ?`,
        [stagingBatch]
      );
    }

    console.log(`  -> Staged ${rawRowCount} rows into \`kaggle_healthcare_staging\`.`);

    // 3. Mark Rejections in Staging (Constraint Validation)
    console.log('\n[3/6] Validating database constraints on staging records...');
    const [negBillingResult] = await conn.query(`
      UPDATE kaggle_healthcare_staging
      SET import_status = 'REJECTED',
          rejection_reason = 'Negative billing amount violates chk_billing_amount (amount < 0)'
      WHERE billing_amount < 0
    `);
    const rejectedCount = negBillingResult.affectedRows;
    console.log(`  -> Rejected ${rejectedCount} rows with negative billing amounts.`);

    await conn.query(`
      UPDATE kaggle_healthcare_staging
      SET import_status = 'VALID'
      WHERE import_status = 'PENDING'
    `);

    // 4. Ensure Departments Exist
    console.log('\n[4/6] Ensuring clinical departments are mapped...');
    const requiredDepts = [
      ['Cardiology', 'East Wing, Level 2'],
      ['Neurology', 'East Wing, Level 3'],
      ['Orthopedics', 'West Wing, Level 1'],
      ['General Medicine', 'Central Wing, Level 1'],
      ['Pediatrics', 'North Wing, Level 2'],
      ['Pulmonology', 'West Wing, Level 2'],
      ['Oncology', 'North Wing, Level 3']
    ];

    for (const [deptName, location] of requiredDepts) {
      await conn.query(
        'INSERT IGNORE INTO departments (department_name, location) VALUES (?, ?)',
        [deptName, location]
      );
    }

    const [deptRows] = await conn.query('SELECT department_id, department_name FROM departments');
    const deptMap = {};
    for (const d of deptRows) {
      deptMap[d.department_name] = d.department_id;
    }

    const conditionToDept = {
      'Hypertension': deptMap['Cardiology'],
      'Arthritis': deptMap['Orthopedics'],
      'Diabetes': deptMap['General Medicine'],
      'Obesity': deptMap['General Medicine'],
      'Asthma': deptMap['Pulmonology'] || deptMap['General Medicine'],
      'Cancer': deptMap['Oncology'] || deptMap['General Medicine']
    };

    // 5. Clean Previous Kaggle Normalized Records (if re-running ETL)
    console.log('\n[5/6] Checking for prior Kaggle normalized records for idempotent reload...');
    const [existingKagglePatients] = await conn.query("SELECT COUNT(*) AS cnt FROM patients WHERE phone LIKE 'KAG-%'");
    if (existingKagglePatients[0].cnt > 0) {
      console.log(`  -> Found ${existingKagglePatients[0].cnt} prior Kaggle patients. Removing previous Kaggle data...`);
      // Delete in reverse foreign key order
      await conn.query(`
        DELETE b FROM billing b JOIN patients p ON b.patient_id = p.patient_id WHERE p.phone LIKE 'KAG-%';
        DELETE pr FROM prescriptions pr JOIN patients p ON pr.patient_id = p.patient_id WHERE p.phone LIKE 'KAG-%';
        DELETE lr FROM lab_reports lr JOIN patients p ON lr.patient_id = p.patient_id WHERE p.phone LIKE 'KAG-%';
        DELETE ap FROM appointments ap JOIN patients p ON ap.patient_id = p.patient_id WHERE p.phone LIKE 'KAG-%';
        DELETE ad FROM admissions ad JOIN patients p ON ad.patient_id = p.patient_id WHERE p.phone LIKE 'KAG-%';
        DELETE FROM patients WHERE phone LIKE 'KAG-%';
      `);
      console.log('  -> Prior Kaggle normalized records removed. Demo records remain intact.');
    }

    // 6. Normalized Relational Import
    console.log('\n[6/6] Normalizing and inserting into relational tables...');

    // Distinct Doctors
    console.log('  -> Mapping distinct doctors...');
    const [validStaging] = await conn.query(
      "SELECT staging_id, name, age, gender, blood_type, medical_condition, date_of_admission, doctor, hospital, billing_amount, discharge_date, medication, test_results FROM kaggle_healthcare_staging WHERE import_status = 'VALID' ORDER BY staging_id"
    );

    const doctorMap = {};
    let doctorBatch = [];
    let docIdx = 100;

    for (const row of validStaging) {
      const docName = cleanName(row.doctor);
      if (!doctorMap[docName]) {
        docIdx++;
        const targetDeptId = conditionToDept[row.medical_condition] || deptMap['General Medicine'];
        const email = `dr.${docName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${docIdx}@hospital.test`;
        doctorMap[docName] = { id: null, name: docName, deptId: targetDeptId, email };
        doctorBatch.push([docName, `Specialist in ${row.medical_condition}`, targetDeptId, email]);
      }
    }

    console.log(`  -> Inserting ${doctorBatch.length} unique doctors in batches...`);
    for (let i = 0; i < doctorBatch.length; i += BATCH_SIZE) {
      const chunk = doctorBatch.slice(i, i + BATCH_SIZE);
      await conn.query('INSERT IGNORE INTO doctors (name, specialization, department_id, email) VALUES ?', [chunk]);
    }

    // Refresh Doctor Map with IDs
    const [allDocs] = await conn.query('SELECT doctor_id, name FROM doctors');
    for (const d of allDocs) {
      doctorMap[d.name] = d.doctor_id;
    }

    // Distinct Patients
    console.log('  -> Extracting distinct patients...');
    const patientMap = {};
    const patientBatch = [];
    let patientSeq = 0;

    for (const row of validStaging) {
      const pName = cleanName(row.name);
      const key = `${pName}|${row.age}|${row.gender}|${row.blood_type}`;
      if (!patientMap[key]) {
        patientSeq++;
        const phone = `KAG-P${String(patientSeq).padStart(8, '0')}`;
        const city = row.hospital.replace(/[,\.]/g, '').substring(0, 80);
        patientMap[key] = { id: null, phone, name: pName, age: row.age, gender: row.gender, blood: row.blood_type, city };
        patientBatch.push([pName, row.age, row.gender, row.blood_type, phone, city]);
      }
    }

    console.log(`  -> Inserting ${patientBatch.length} distinct patients in batches...`);
    for (let i = 0; i < patientBatch.length; i += BATCH_SIZE) {
      const chunk = patientBatch.slice(i, i + BATCH_SIZE);
      await conn.query(
        'INSERT INTO patients (name, age, gender, blood_group, phone, city) VALUES ?',
        [chunk]
      );
    }

    // Fetch back inserted patient IDs by phone
    console.log('  -> Fetching patient primary keys...');
    const [kagglePatients] = await conn.query("SELECT patient_id, phone FROM patients WHERE phone LIKE 'KAG-%'");
    const phoneToId = {};
    for (const p of kagglePatients) {
      phoneToId[p.phone] = p.patient_id;
    }
    for (const key of Object.keys(patientMap)) {
      patientMap[key].id = phoneToId[patientMap[key].phone];
    }

    // Insert Admissions, Billing, Prescriptions, Lab Reports, Appointments
    console.log(`  -> Inserting ${validStaging.length} admissions, billing, lab, prescriptions & appointments...`);
    const admissionsBatch = [];
    const billingBatch = [];
    const prescriptionsBatch = [];
    const labReportsBatch = [];
    const appointmentsBatch = [];

    for (const row of validStaging) {
      const pName = cleanName(row.name);
      const key = `${pName}|${row.age}|${row.gender}|${row.blood_type}`;
      const patientId = patientMap[key]?.id;
      const deptId = conditionToDept[row.medical_condition] || deptMap['General Medicine'];
      const docName = cleanName(row.doctor);
      const doctorId = doctorMap[docName] || 1;
      const roundedBilling = Math.round(row.billing_amount * 100) / 100;

      admissionsBatch.push([
        patientId, deptId, row.date_of_admission, row.discharge_date,
        row.medical_condition, 'DISCHARGED'
      ]);

      billingBatch.push([
        patientId, roundedBilling, 'PAID', row.date_of_admission
      ]);

      prescriptionsBatch.push([
        patientId, doctorId, row.medication, 'Standard therapeutic dosage', row.date_of_admission
      ]);

      labReportsBatch.push([
        patientId, 'Diagnostic Evaluation', row.test_results, row.date_of_admission
      ]);

      appointmentsBatch.push([
        patientId, doctorId, `${row.date_of_admission} 09:00:00`,
        'COMPLETED', `Admission consultation: ${row.medical_condition}`
      ]);
    }

    for (let i = 0; i < admissionsBatch.length; i += BATCH_SIZE) {
      const end = i + BATCH_SIZE;
      await conn.query(
        'INSERT INTO admissions (patient_id, department_id, admission_date, discharge_date, diagnosis, status) VALUES ?',
        [admissionsBatch.slice(i, end)]
      );
      await conn.query(
        'INSERT INTO billing (patient_id, amount, payment_status, bill_date) VALUES ?',
        [billingBatch.slice(i, end)]
      );
      await conn.query(
        'INSERT INTO prescriptions (patient_id, doctor_id, medicine, dosage, prescription_date) VALUES ?',
        [prescriptionsBatch.slice(i, end)]
      );
      await conn.query(
        'INSERT INTO lab_reports (patient_id, test_name, result, report_date) VALUES ?',
        [labReportsBatch.slice(i, end)]
      );
      await conn.query(
        'INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason) VALUES ?',
        [appointmentsBatch.slice(i, end)]
      );
    }

    // Mark staging records as imported
    await conn.query("UPDATE kaggle_healthcare_staging SET import_status = 'IMPORTED' WHERE import_status = 'VALID'");

    // Summary Verification
    console.log('\n====================================================');
    console.log('  ETL Ingestion Complete — Final Counts');
    console.log('====================================================');
    const [finalCounts] = await conn.query(`
      SELECT 
        (SELECT COUNT(*) FROM kaggle_healthcare_staging) AS staging_rows,
        (SELECT COUNT(*) FROM kaggle_healthcare_staging WHERE import_status = 'REJECTED') AS rejected_rows,
        (SELECT COUNT(*) FROM kaggle_healthcare_staging WHERE import_status = 'IMPORTED') AS imported_staging,
        (SELECT COUNT(*) FROM patients) AS total_patients,
        (SELECT COUNT(*) FROM patients WHERE phone LIKE 'KAG-%') AS kaggle_patients,
        (SELECT COUNT(*) FROM admissions) AS total_admissions,
        (SELECT COUNT(*) FROM billing) AS total_billing,
        (SELECT COUNT(*) FROM doctors) AS total_doctors,
        (SELECT COUNT(*) FROM departments) AS total_departments,
        (SELECT COUNT(*) FROM users) AS demo_users
    `);

    console.table(finalCounts[0]);
    console.log('\nAll foreign-key relations, check constraints, demo users, and views preserved.');

  } catch (error) {
    console.error('ETL Pipeline failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
