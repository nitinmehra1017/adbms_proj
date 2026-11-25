import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';

export type PatientSummaryItem = {
  patientId: number;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  city: string;
  phone: string;
  admissionCount: number;
  latestAdmissionDate: string | null;
  primaryCondition: string | null;
};

export type PatientReport = {
  patient: {
    id: number;
    name: string;
    age: number;
    gender: string;
    bloodGroup: string;
    city: string;
    phone: string;
    source: 'KAGGLE' | 'DEMO';
  };
  metrics: {
    totalAdmissions: number;
    totalBilled: number;
    avgLengthOfStayDays: number;
    primaryCondition: string;
  };
  kaggleMetadata: {
    hospital: string | null;
    attendingDoctor: string | null;
    roomNumber: string | null;
    admissionType: string | null;
    insuranceProvider: string | null;
  } | null;
  admissions: Array<{
    id: number;
    admissionDate: string;
    dischargeDate: string | null;
    diagnosis: string;
    department: string;
    status: string;
    lengthOfStayDays: number;
  }>;
  prescriptions: Array<{
    id: number;
    medicine: string;
    dosage: string;
    prescriptionDate: string;
    prescribingDoctor: string;
  }>;
  labReports: Array<{
    id: number;
    testName: string;
    result: string;
    reportDate: string;
  }>;
  billing: Array<{
    id: number;
    amount: number;
    paymentStatus: string;
    billDate: string;
  }>;
  appointments: Array<{
    id: number;
    appointmentDate: string;
    status: string;
    reason: string;
    doctorName: string;
  }>;
};

export type ClinicalAnalytics = {
  conditionDistribution: Array<{ condition: string; count: number }>;
  testResultDistribution: Array<{ result: string; count: number }>;
  admissionTypeDistribution: Array<{ type: string; count: number }>;
};

export async function searchPatients(
  searchQuery: string,
  page: number = 1,
  limit: number = 20
): Promise<{ patients: PatientSummaryItem[]; total: number; page: number; totalPages: number }> {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * safeLimit;
  const searchPattern = `%${searchQuery.trim()}%`;

  const [countRows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM patients WHERE name LIKE ?',
    [searchPattern]
  );
  const total = Number(countRows[0]?.total || 0);
  const totalPages = Math.ceil(total / safeLimit) || 1;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.patient_id, p.name, p.age, p.gender, p.blood_group, p.city, p.phone,
            COUNT(a.admission_id) AS admission_count,
            DATE_FORMAT(MAX(a.admission_date), '%Y-%m-%d') AS latest_admission_date,
            SUBSTRING_INDEX(GROUP_CONCAT(a.diagnosis ORDER BY a.admission_date DESC SEPARATOR ' | '), ' | ', 1) AS primary_condition
     FROM patients p
     LEFT JOIN admissions a ON p.patient_id = a.patient_id
     WHERE p.name LIKE ?
     GROUP BY p.patient_id, p.name, p.age, p.gender, p.blood_group, p.city, p.phone
     ORDER BY p.name ASC
     LIMIT ? OFFSET ?`,
    [searchPattern, safeLimit, offset]
  );

  const patients: PatientSummaryItem[] = rows.map((r) => ({
    patientId: Number(r.patient_id),
    name: String(r.name),
    age: Number(r.age),
    gender: String(r.gender),
    bloodGroup: String(r.blood_group),
    city: String(r.city),
    phone: String(r.phone),
    admissionCount: Number(r.admission_count || 0),
    latestAdmissionDate: r.latest_admission_date ? String(r.latest_admission_date) : null,
    primaryCondition: r.primary_condition ? String(r.primary_condition) : 'None'
  }));

  return { patients, total, page: safePage, totalPages };
}

export async function getPatientReport(patientId: number): Promise<PatientReport | null> {
  const [patientRows] = await pool.query<RowDataPacket[]>(
    'SELECT patient_id, name, age, gender, blood_group, city, phone FROM patients WHERE patient_id = ?',
    [patientId]
  );

  if (!patientRows.length) return null;
  const p = patientRows[0];
  const isKaggle = String(p.phone).startsWith('KAG-');

  // Staging Kaggle Metadata
  let kaggleMetadata: PatientReport['kaggleMetadata'] = null;
  if (isKaggle) {
    const [stagingRows] = await pool.query<RowDataPacket[]>(
      `SELECT hospital, doctor, room_number, admission_type, insurance_provider
       FROM kaggle_healthcare_staging
       WHERE name = ? AND age = ? AND gender = ? AND blood_type = ?
       LIMIT 1`,
      [p.name, p.age, p.gender, p.blood_group]
    );
    if (stagingRows.length > 0) {
      const s = stagingRows[0];
      kaggleMetadata = {
        hospital: s.hospital ? String(s.hospital) : null,
        attendingDoctor: s.doctor ? String(s.doctor) : null,
        roomNumber: s.room_number ? String(s.room_number) : null,
        admissionType: s.admission_type ? String(s.admission_type) : null,
        insuranceProvider: s.insurance_provider ? String(s.insurance_provider) : null
      };
    }
  }

  // Admissions with explicit DATE_FORMAT
  const [admissionRows] = await pool.query<RowDataPacket[]>(
    `SELECT a.admission_id,
            DATE_FORMAT(a.admission_date, '%Y-%m-%d') AS admission_date,
            DATE_FORMAT(a.discharge_date, '%Y-%m-%d') AS discharge_date,
            a.diagnosis, a.status,
            COALESCE(d.department_name, 'General Medicine') AS department_name,
            DATEDIFF(COALESCE(a.discharge_date, CURRENT_DATE()), a.admission_date) AS length_of_stay_days
     FROM admissions a
     LEFT JOIN departments d ON a.department_id = d.department_id
     WHERE a.patient_id = ?
     ORDER BY a.admission_date DESC`,
    [patientId]
  );

  const admissions = admissionRows.map((a) => ({
    id: Number(a.admission_id),
    admissionDate: String(a.admission_date),
    dischargeDate: a.discharge_date ? String(a.discharge_date) : null,
    diagnosis: String(a.diagnosis),
    department: String(a.department_name),
    status: String(a.status),
    lengthOfStayDays: Math.max(0, Number(a.length_of_stay_days || 0))
  }));

  // Prescriptions with explicit DATE_FORMAT
  const [rxRows] = await pool.query<RowDataPacket[]>(
    `SELECT pr.prescription_id, pr.medicine, pr.dosage,
            DATE_FORMAT(pr.prescription_date, '%Y-%m-%d') AS prescription_date,
            COALESCE(doc.name, 'Attending Physician') AS doctor_name
     FROM prescriptions pr
     LEFT JOIN doctors doc ON pr.doctor_id = doc.doctor_id
     WHERE pr.patient_id = ?
     ORDER BY pr.prescription_date DESC`,
    [patientId]
  );

  const prescriptions = rxRows.map((rx) => ({
    id: Number(rx.prescription_id),
    medicine: String(rx.medicine),
    dosage: String(rx.dosage),
    prescriptionDate: String(rx.prescription_date),
    prescribingDoctor: String(rx.doctor_name)
  }));

  // Lab Reports with explicit DATE_FORMAT
  const [labRows] = await pool.query<RowDataPacket[]>(
    `SELECT report_id, test_name, result,
            DATE_FORMAT(report_date, '%Y-%m-%d') AS report_date
     FROM lab_reports
     WHERE patient_id = ?
     ORDER BY report_date DESC`,
    [patientId]
  );

  const labReports = labRows.map((l) => ({
    id: Number(l.report_id),
    testName: String(l.test_name),
    result: String(l.result),
    reportDate: String(l.report_date)
  }));

  // Billing with explicit DATE_FORMAT
  const [billRows] = await pool.query<RowDataPacket[]>(
    `SELECT bill_id, amount, payment_status,
            DATE_FORMAT(bill_date, '%Y-%m-%d') AS bill_date
     FROM billing
     WHERE patient_id = ?
     ORDER BY bill_date DESC`,
    [patientId]
  );

  const billing = billRows.map((b) => ({
    id: Number(b.bill_id),
    amount: Number(b.amount),
    paymentStatus: String(b.payment_status),
    billDate: String(b.bill_date)
  }));

  // Appointments with explicit DATE_FORMAT
  const [aptRows] = await pool.query<RowDataPacket[]>(
    `SELECT ap.appointment_id,
            DATE_FORMAT(ap.appointment_date, '%Y-%m-%d %H:%i:%s') AS appointment_date,
            ap.status, ap.reason,
            COALESCE(doc.name, 'Clinical Staff') AS doctor_name
     FROM appointments ap
     LEFT JOIN doctors doc ON ap.doctor_id = doc.doctor_id
     WHERE ap.patient_id = ?
     ORDER BY ap.appointment_date DESC`,
    [patientId]
  );

  const appointments = aptRows.map((ap) => ({
    id: Number(ap.appointment_id),
    appointmentDate: String(ap.appointment_date),
    status: String(ap.status),
    reason: String(ap.reason),
    doctorName: String(ap.doctor_name)
  }));

  // Calculated Metrics
  const totalBilled = billing.reduce((sum, item) => sum + item.amount, 0);
  const avgLengthOfStayDays = admissions.length > 0
    ? Math.round((admissions.reduce((sum, a) => sum + a.lengthOfStayDays, 0) / admissions.length) * 10) / 10
    : 0;
  const primaryCondition = admissions[0]?.diagnosis || 'No recorded admission';

  return {
    patient: {
      id: Number(p.patient_id),
      name: String(p.name),
      age: Number(p.age),
      gender: String(p.gender),
      bloodGroup: String(p.blood_group),
      city: String(p.city),
      phone: String(p.phone),
      source: isKaggle ? 'KAGGLE' : 'DEMO'
    },
    metrics: {
      totalAdmissions: admissions.length,
      totalBilled: Math.round(totalBilled * 100) / 100,
      avgLengthOfStayDays,
      primaryCondition
    },
    kaggleMetadata,
    admissions,
    prescriptions,
    labReports,
    billing,
    appointments
  };
}

export async function getClinicalAnalytics(): Promise<ClinicalAnalytics> {
  const [condRows] = await pool.query<RowDataPacket[]>(
    `SELECT diagnosis AS \`condition\`, COUNT(*) AS \`count\`
     FROM admissions
     GROUP BY diagnosis
     ORDER BY \`count\` DESC
     LIMIT 10`
  );

  const [testRows] = await pool.query<RowDataPacket[]>(
    `SELECT result, COUNT(*) AS \`count\`
     FROM lab_reports
     GROUP BY result
     ORDER BY \`count\` DESC
     LIMIT 5`
  );

  const [typeRows] = await pool.query<RowDataPacket[]>(
    `SELECT admission_type AS \`type\`, COUNT(*) AS \`count\`
     FROM kaggle_healthcare_staging
     WHERE import_status = 'IMPORTED'
     GROUP BY admission_type
     ORDER BY \`count\` DESC`
  );

  return {
    conditionDistribution: condRows.map((r) => ({
      condition: String(r.condition),
      count: Number(r.count)
    })),
    testResultDistribution: testRows.map((r) => ({
      result: String(r.result),
      count: Number(r.count)
    })),
    admissionTypeDistribution: typeRows.map((r) => ({
      type: String(r.type),
      count: Number(r.count)
    }))
  };
}
