import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { checkDatabaseConnection, pool } from './db/pool.js';
import { AUTH_COOKIE_NAME, authenticate, authenticationCookieOptions, createAuthenticationToken, requireRole } from './middleware/authMiddleware.js';
import { findSafeUserById, findUserByEmail } from './services/authService.js';
import { answerHealthcareQuestionWithExecutionDetails, AssistantExecutionError, AssistantValidationError } from './services/aiAssistantService.js';
import { getRecentAiQueryAudits, recordAiQueryAudit } from './services/aiQueryAuditService.js';
import { GeminiConfigurationError, GeminiServiceError, generateSqlFromQuestion, generateTestResponse } from './services/geminiService.js';
import { getHealthcareSchemaContext } from './services/schemaService.js';
import { executeReadOnlySql, SqlExecutionError } from './services/sqlExecutionService.js';
import { validateSql } from './services/sqlValidator.js';
import { getClinicalAnalytics, getPatientReport, searchPatients } from './services/doctorReportService.js';
import {
  createPrescription,
  getDoctorPrescriptionHistory,
  getPatientPrescriptionHistory,
  getPrescriptionByRef,
  getPharmacyDispensingHistory,
  issuePrescription,
  lookupPrescriptionForPharmacy,
  recordDispensingEvent,
  searchPharmacyPrescriptions
} from './services/prescriptionService.js';

const app = express();
const port = Number(process.env.PORT ?? 5000);

function databaseIdentifier(environmentVariable: 'HOSPITAL_A_DB' | 'HOSPITAL_B_DB') {
  const value = process.env[environmentVariable];
  if (!value || !/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`${environmentVariable} is not configured with a valid database name.`);
  }
  return `\`${value}\``;
}

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    message: 'Healthcare AI backend is running'
  });
});

app.post('/api/auth/login', async (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!email || !password || email.length > 150 || password.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    response.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = createAuthenticationToken({ id: user.id, role: user.role });
    response.cookie(AUTH_COOKIE_NAME, token, authenticationCookieOptions());
    response.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof Error && error.message === 'JWT configuration is incomplete.') {
      response.status(503).json({ success: false, message: 'Authentication service is not configured.' });
      return;
    }
    console.error('[Authentication diagnostic]', error instanceof Error ? error.message : 'Unknown authentication error');
    response.status(503).json({ success: false, message: 'Authentication service is currently unavailable.' });
  }
});

app.get('/api/auth/me', authenticate, async (request, response) => {
  try {
    const user = await findSafeUserById(request.authUser!.id);
    if (!user) {
      response.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }
    response.json({ success: true, user });
  } catch (error) {
    console.error('[Authentication diagnostic]', error instanceof Error ? error.message : 'Unknown authentication error');
    response.status(503).json({ success: false, message: 'Authentication service is currently unavailable.' });
  }
});

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, authenticationCookieOptions());
  response.json({ success: true, message: 'Logged out.' });
});

app.get('/api/db/health', async (_request, response) => {
  try {
    await checkDatabaseConnection();
    response.json({
      status: 'ok',
      message: 'MySQL database is reachable'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error';
    response.status(503).json({
      status: 'unavailable',
      message: 'MySQL database is not reachable',
      detail: message
    });
  }
});

app.get('/api/db/schema-status', async (_request, response) => {
  try {
    const database = process.env.DB_NAME;
    const [tableRows] = await pool.query<(RowDataPacket & { TABLE_NAME: string })[]>(
      `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE' ORDER BY TABLE_NAME`,
      [database]
    );
    const tables = tableRows.map((row) => row.TABLE_NAME);
    const allowedTables = new Set(['users', 'departments', 'doctors', 'patients', 'appointments', 'admissions', 'lab_reports', 'prescriptions', 'billing', 'audit_logs']);
    const rowCounts = Object.fromEntries(await Promise.all(tables.filter((table) => allowedTables.has(table)).map(async (table) => {
      const [rows] = await pool.query<(RowDataPacket & { row_count: number })[]>(`SELECT COUNT(*) AS row_count FROM \`${table}\``);
      return [table, rows[0].row_count];
    })));
    response.json({ database, tables, rowCounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.get('/api/db/views', async (_request, response) => {
  try {
    const [views] = await pool.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS view_name, VIEW_DEFINITION AS definition
       FROM information_schema.views
       WHERE table_schema = ?
       ORDER BY TABLE_NAME`,
      [process.env.DB_NAME]
    );
    response.json({ database: process.env.DB_NAME, views });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.get('/api/db/indexes', async (_request, response) => {
  try {
    const [indexes] = await pool.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique,
              SEQ_IN_INDEX AS sequence_in_index, COLUMN_NAME AS column_name, INDEX_TYPE AS index_type
       FROM information_schema.statistics
       WHERE table_schema = ?
         AND table_name IN ('patients', 'appointments', 'admissions', 'billing')
       ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
      [process.env.DB_NAME]
    );
    response.json({ database: process.env.DB_NAME, indexes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.get('/api/db/explain', async (_request, response) => {
  try {
    const statement = `SELECT admission_id, patient_id, department_id, admission_date, diagnosis
      FROM admissions WHERE admission_date >= '2026-01-01'`;
    const [explain] = await pool.query<RowDataPacket[]>(`EXPLAIN ${statement}`);
    response.json({ query: statement, explain });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.post('/api/db/procedure/patient-summary', async (request, response) => {
  const patientId = Number(request.body?.patientId);
  if (!Number.isSafeInteger(patientId) || patientId <= 0) {
    response.status(400).json({ message: 'patientId must be a positive integer.' });
    return;
  }
  try {
    const [resultSets] = await pool.query<RowDataPacket[][]>('CALL get_patient_medical_summary(?)', [patientId]);
    response.json({ patientId, summary: resultSets[0] ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.get('/api/db/triggers', async (_request, response) => {
  try {
    const [triggers] = await pool.query<RowDataPacket[]>(
      `SELECT trigger_name, event_manipulation, event_object_table, action_timing, action_statement, created
       FROM information_schema.triggers
       WHERE trigger_schema = ?
       ORDER BY trigger_name`,
      [process.env.DB_NAME]
    );
    response.json({ database: process.env.DB_NAME, triggers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.get('/api/db/audit', authenticate, requireRole('ADMIN'), async (_request, response) => {
  try {
    const [auditLogs] = await pool.query<RowDataPacket[]>(
      `SELECT log_id, table_name, operation, record_id, description, created_at
       FROM audit_logs ORDER BY log_id DESC LIMIT 100`
    );
    response.json({ auditLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    response.status(503).json({ status: 'unavailable', message });
  }
});

app.post('/api/db/transactions/admission', async (request, response) => {
  const patientId = Number(request.body?.patientId);
  const departmentId = Number(request.body?.departmentId);
  const diagnosis = typeof request.body?.diagnosis === 'string' ? request.body.diagnosis.trim() : '';
  const admissionDate = typeof request.body?.admissionDate === 'string' ? request.body.admissionDate : '';
  const totalAmount = Number(request.body?.totalAmount);

  if (!Number.isSafeInteger(patientId) || patientId <= 0 ||
      !Number.isSafeInteger(departmentId) || departmentId <= 0 ||
      !diagnosis || !/^\d{4}-\d{2}-\d{2}$/.test(admissionDate) || !Number.isFinite(totalAmount)) {
    response.status(400).json({ message: 'patientId, departmentId, diagnosis, YYYY-MM-DD admissionDate, and numeric totalAmount are required.' });
    return;
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [admission] = await connection.execute<ResultSetHeader>(
      `INSERT INTO admissions (patient_id, department_id, admission_date, discharge_date, diagnosis, status)
       VALUES (?, ?, ?, NULL, ?, 'ADMITTED')`,
      [patientId, departmentId, admissionDate, diagnosis]
    );
    const [billing] = await connection.execute<ResultSetHeader>(
      `INSERT INTO billing (patient_id, amount, payment_status, bill_date)
       VALUES (?, ?, 'PENDING', ?)`,
      [patientId, totalAmount, admissionDate]
    );

    await connection.commit();
    response.status(201).json({
      transactionStatus: 'COMMITTED',
      admissionId: admission.insertId,
      billingId: billing.insertId
    });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    const code = error instanceof Error && 'code' in error ? String(error.code) : 'DATABASE_ERROR';
    response.status(409).json({
      transactionStatus: 'ROLLED_BACK',
      message: 'Admission and billing were not saved because the transaction failed.',
      reason: code
    });
  } finally {
    connection.release();
  }
});

app.get('/api/db/federated/summary', async (_request, response) => {
  try {
    const hospitalA = databaseIdentifier('HOSPITAL_A_DB');
    const hospitalB = databaseIdentifier('HOSPITAL_B_DB');
    const [rows] = await pool.query<(RowDataPacket & { name: string; patients: number; admissions: number; billingTotal: number })[]>(
      `SELECT 'Hospital A' AS name,
          (SELECT COUNT(*) FROM ${hospitalA}.patients) AS patients,
          (SELECT COUNT(*) FROM ${hospitalA}.admissions) AS admissions,
          (SELECT COALESCE(SUM(amount), 0.00) FROM ${hospitalA}.billing) AS billingTotal
       UNION ALL
       SELECT 'Hospital B',
          (SELECT COUNT(*) FROM ${hospitalB}.patients),
          (SELECT COUNT(*) FROM ${hospitalB}.admissions),
          (SELECT COALESCE(SUM(amount), 0.00) FROM ${hospitalB}.billing)`
    );
    const hospitals = rows.map((row) => ({
      name: row.name,
      patients: Number(row.patients),
      admissions: Number(row.admissions),
      billingTotal: Number(row.billingTotal)
    }));
    const combined = hospitals.reduce((total, hospital) => ({
      patients: total.patients + hospital.patients,
      admissions: total.admissions + hospital.admissions,
      billingTotal: total.billingTotal + hospital.billingTotal
    }), { patients: 0, admissions: 0, billingTotal: 0 });
    response.json({ hospitals, combined });
  } catch (_error) {
    response.status(503).json({
      status: 'unavailable',
      message: 'Unable to query one or more federated hospital databases.'
    });
  }
});

app.get('/api/db/federated/admissions', async (_request, response) => {
  try {
    const hospitalA = databaseIdentifier('HOSPITAL_A_DB');
    const hospitalB = databaseIdentifier('HOSPITAL_B_DB');
    const [admissions] = await pool.query<RowDataPacket[]>(
      `SELECT hospital, patientName, diagnosis, department, admissionDate
       FROM (
         SELECT 'Hospital A' AS hospital, p.patient_name AS patientName, a.diagnosis, a.department, a.admission_date AS admissionDate
         FROM ${hospitalA}.admissions AS a
         INNER JOIN ${hospitalA}.patients AS p ON p.patient_id = a.patient_id
         UNION ALL
         SELECT 'Hospital B', p.patient_name, a.diagnosis, a.department, a.admission_date
         FROM ${hospitalB}.admissions AS a
         INNER JOIN ${hospitalB}.patients AS p ON p.patient_id = a.patient_id
       ) AS combined_admissions
       ORDER BY admissionDate, hospital, patientName`
    );
    response.json({ admissions });
  } catch (_error) {
    response.status(503).json({
      status: 'unavailable',
      message: 'Unable to query one or more federated hospital databases.'
    });
  }
});

app.post('/api/ai/test', async (request, response) => {
  const prompt = request.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    response.status(400).json({ success: false, message: 'prompt must be a non-empty string.' });
    return;
  }
  if (prompt.length > 2_000) {
    response.status(400).json({ success: false, message: 'prompt must be 2000 characters or fewer.' });
    return;
  }
  try {
    const generatedText = await generateTestResponse(prompt.trim());
    response.json({ success: true, response: generatedText });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      response.status(503).json({ success: false, message: 'Gemini service is not configured.' });
      return;
    }
    if (error instanceof GeminiServiceError) {
      // Temporary Step 4A diagnostic: preserves SDK status/code/message server-side only.
      // The service redacts API-key-shaped values and request credentials before logging.
      console.error('[Gemini API diagnostic]', JSON.stringify(error.diagnostic ?? { message: error.message }));
      response.status(503).json({ success: false, message: 'Gemini service is currently unavailable.' });
      return;
    }
    response.status(500).json({ success: false, message: 'Unexpected AI service error.' });
  }
});

app.post('/api/ai/sql', async (request, response) => {
  const question = request.body?.question;
  if (typeof question !== 'string' || !question.trim()) {
    response.status(400).json({ success: false, message: 'question must be a non-empty string.' });
    return;
  }
  if (question.length > 2_000) {
    response.status(400).json({ success: false, message: 'question must be 2000 characters or fewer.' });
    return;
  }
  try {
    const schemaContext = await getHealthcareSchemaContext();
    const generated = await generateSqlFromQuestion(question.trim(), schemaContext);
    response.json({ success: true, ...generated });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      response.status(503).json({ success: false, message: 'Gemini service is not configured.' });
      return;
    }
    if (error instanceof GeminiServiceError) {
      console.error('[Gemini SQL diagnostic]', JSON.stringify(error.diagnostic ?? { message: error.message }));
      response.status(503).json({ success: false, message: 'Gemini SQL generation is currently unavailable.' });
      return;
    }
    console.error('[Schema metadata diagnostic]', error instanceof Error ? error.message : 'Unknown schema metadata error');
    response.status(503).json({ success: false, message: 'Database schema metadata is currently unavailable.' });
  }
});

app.post('/api/ai/assistant', authenticate, async (request, response) => {
  const question = request.body?.question;
  if (typeof question !== 'string' || !question.trim()) {
    response.status(400).json({ success: false, message: 'question must be a non-empty string.' });
    return;
  }
  if (question.length > 2_000) {
    response.status(400).json({ success: false, message: 'question must be 2000 characters or fewer.' });
    return;
  }

  const audit = async (entry: Parameters<typeof recordAiQueryAudit>[0]) => {
    try {
      await recordAiQueryAudit(entry);
    } catch (auditError) {
      console.error('[AI query audit diagnostic]', auditError instanceof Error ? auditError.message : 'Unknown audit write error');
    }
  };

  try {
    const assistant = await answerHealthcareQuestionWithExecutionDetails(question.trim());
    await audit({
      userId: request.authUser!.id,
      question: question.trim(),
      generatedSql: assistant.response.sql,
      queryType: assistant.response.query_type,
      executionStatus: 'SUCCESS',
      rowCount: assistant.response.result.rowCount,
      executionTimeMs: assistant.executionTimeMs
    });
    response.json({ success: true, question: question.trim(), ...assistant.response });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      await audit({ userId: request.authUser!.id, question: question.trim(), executionStatus: 'GEMINI_UNAVAILABLE' });
      response.status(503).json({ success: false, message: 'Gemini service is not configured.' });
      return;
    }
    if (error instanceof GeminiServiceError) {
      await audit({ userId: request.authUser!.id, question: question.trim(), executionStatus: 'GEMINI_UNAVAILABLE' });
      console.error('[Gemini assistant diagnostic]', JSON.stringify(error.diagnostic ?? { message: error.message }));
      response.status(503).json({ success: false, message: 'Gemini SQL generation is currently unavailable.' });
      return;
    }
    if (error instanceof AssistantValidationError) {
      await audit({
        userId: request.authUser!.id,
        question: question.trim(),
        generatedSql: error.generated?.sql,
        queryType: error.generated?.query_type,
        executionStatus: 'VALIDATION_REJECTED'
      });
      response.status(400).json({ success: false, message: 'Generated SQL was rejected by the safety validator.' });
      return;
    }
    if (error instanceof AssistantExecutionError) {
      await audit({
        userId: request.authUser!.id,
        question: question.trim(),
        generatedSql: error.generated.sql,
        queryType: error.generated.query_type,
        executionStatus: 'EXECUTION_FAILED'
      });
      console.error('[Assistant SQL execution diagnostic]', error.message);
      response.status(500).json({ success: false, message: 'Read-only SQL execution failed.' });
      return;
    }
    await audit({ userId: request.authUser!.id, question: question.trim(), executionStatus: 'SYSTEM_ERROR' });
    console.error('[AI assistant diagnostic]', error instanceof Error ? error.message : 'Unknown assistant error');
    response.status(503).json({ success: false, message: 'AI assistant is currently unavailable.' });
  }
});

app.get('/api/db/ai-audit', authenticate, requireRole('ADMIN'), async (_request, response) => {
  try {
    response.json({ auditLogs: await getRecentAiQueryAudits() });
  } catch (error) {
    console.error('[AI query audit diagnostic]', error instanceof Error ? error.message : 'Unknown audit read error');
    response.status(503).json({ status: 'unavailable', message: 'AI query audit records are currently unavailable.' });
  }
});

app.get('/api/doctor/patients', authenticate, requireRole('DOCTOR'), async (request, response) => {
  try {
    const search = typeof request.query.search === 'string' ? request.query.search : '';
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 20;
    const result = await searchPatients(search, page, limit);
    response.json({ success: true, ...result });
  } catch (error) {
    console.error('[Doctor patients search error]', error instanceof Error ? error.message : 'Unknown error');
    response.status(500).json({ success: false, message: 'Failed to retrieve patient directory.' });
  }
});

app.get('/api/doctor/patients/:id', authenticate, requireRole('DOCTOR'), async (request, response) => {
  const patientId = Number(request.params.id);
  if (!Number.isSafeInteger(patientId) || patientId <= 0) {
    response.status(400).json({ success: false, message: 'Invalid patient ID.' });
    return;
  }
  try {
    const report = await getPatientReport(patientId);
    if (!report) {
      response.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }
    response.json({ success: true, report });
  } catch (error) {
    console.error('[Doctor patient report error]', error instanceof Error ? error.message : 'Unknown error');
    response.status(500).json({ success: false, message: 'Failed to retrieve patient report.' });
  }
});

app.get('/api/doctor/analytics', authenticate, requireRole('DOCTOR'), async (_request, response) => {
  try {
    const analytics = await getClinicalAnalytics();
    response.json({ success: true, analytics });
  } catch (error) {
    console.error('[Doctor clinical analytics error]', error instanceof Error ? error.message : 'Unknown error');
    response.status(500).json({ success: false, message: 'Failed to retrieve clinical analytics.' });
  }
});

app.post('/api/ai/sql/execute', authenticate, async (request, response) => {
  const validation = validateSql(request.body?.sql);
  if (!validation.valid) {
    response.status(400).json({ success: false, message: 'SQL query is not permitted.' });
    return;
  }

  try {
    const result = await executeReadOnlySql(validation.sql);
    response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof SqlExecutionError) {
      console.error('[SQL execution diagnostic]', error.message);
      response.status(500).json({ success: false, message: 'Read-only SQL execution failed.' });
      return;
    }
    console.error('[SQL execution diagnostic]', error instanceof Error ? error.message : 'Unknown SQL execution error');
    response.status(500).json({ success: false, message: 'Read-only SQL execution failed.' });
  }
});

app.listen(port, () => {
  console.log(`Healthcare API listening on http://localhost:${port}`);
});

// ══════════════════════════════════════════════════════════════════════════════
// DOCTOR – Prescription routes
// ══════════════════════════════════════════════════════════════════════════════

/** POST /api/prescriptions – create a DRAFT prescription */
app.post('/api/prescriptions', authenticate, requireRole('DOCTOR'), async (request, response) => {
  const body = request.body as {
    patientId?: unknown;
    generalNotes?: unknown;
    items?: unknown;
  };

  const patientId = Number(body.patientId);
  if (!Number.isSafeInteger(patientId) || patientId <= 0) {
    response.status(400).json({ success: false, message: 'Valid patientId is required.' });
    return;
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    response.status(400).json({ success: false, message: 'At least one medicine item is required.' });
    return;
  }

  for (const item of items as Record<string, unknown>[]) {
    if (!item.medicineName || typeof item.medicineName !== 'string' || !item.medicineName.trim()) {
      response.status(400).json({ success: false, message: 'Each item requires a medicineName.' });
      return;
    }
    if (!item.dosageInstruction || typeof item.dosageInstruction !== 'string') {
      response.status(400).json({ success: false, message: 'Each item requires dosageInstruction.' });
      return;
    }
    if (!item.frequency || typeof item.frequency !== 'string') {
      response.status(400).json({ success: false, message: 'Each item requires frequency.' });
      return;
    }
    if (!item.duration || typeof item.duration !== 'string') {
      response.status(400).json({ success: false, message: 'Each item requires duration.' });
      return;
    }
    const qty = Number(item.quantityPrescribed);
    if (!Number.isFinite(qty) || qty <= 0) {
      response.status(400).json({ success: false, message: 'Each item requires a positive quantityPrescribed.' });
      return;
    }
  }

  // Fetch the doctor's name from the users table
  const doctorUser = await findSafeUserById(request.authUser!.id);
  const doctorName = doctorUser?.email ?? 'Unknown Doctor';

  try {
    const ref = await createPrescription({
      patientId,
      issuingUserId: request.authUser!.id,
      doctorName,
      generalNotes: typeof body.generalNotes === 'string' ? body.generalNotes : undefined,
      items: (items as Record<string, unknown>[]).map((i) => ({
        medicineName: String(i.medicineName).trim(),
        strength: typeof i.strength === 'string' ? i.strength : undefined,
        dosageInstruction: String(i.dosageInstruction),
        frequency: String(i.frequency),
        duration: String(i.duration),
        quantityPrescribed: Number(i.quantityPrescribed),
        stripSize: typeof i.stripSize === 'number' ? i.stripSize : Number(i.stripSize) || 10,
        pricePerStrip: typeof i.pricePerStrip === 'number' ? i.pricePerStrip : Number(i.pricePerStrip) || 300,
        routeOfAdmin: typeof i.routeOfAdmin === 'string' ? i.routeOfAdmin : undefined,
        extraInstructions: typeof i.extraInstructions === 'string' ? i.extraInstructions : undefined
      }))
    });
    response.status(201).json({ success: true, prescriptionRef: ref });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create prescription.';
    console.error('[Prescription create error]', msg);
    response.status(msg === 'Patient not found.' ? 404 : 500).json({ success: false, message: msg });
  }
});

/** POST /api/prescriptions/:ref/issue – transition DRAFT → ISSUED */
app.post('/api/prescriptions/:ref/issue', authenticate, requireRole('DOCTOR'), async (request, response) => {
  const ref = String(request.params.ref);
  if (!/^[A-F0-9]{20}$/.test(ref)) {
    response.status(400).json({ success: false, message: 'Invalid prescription reference.' });
    return;
  }
  try {
    await issuePrescription(ref, request.authUser!.id);
    response.json({ success: true, message: 'Prescription issued.' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to issue prescription.';
    const status = msg.includes('Forbidden') ? 403 : msg.includes('not found') ? 404 : 409;
    response.status(status).json({ success: false, message: msg });
  }
});

/** GET /api/prescriptions/:ref – fetch a full prescription (doctor view) */
app.get('/api/prescriptions/:ref', authenticate, requireRole('DOCTOR', 'PHARMACY'), async (request, response) => {
  const ref = String(request.params.ref);
  if (!/^[A-F0-9]{20}$/.test(ref)) {
    response.status(400).json({ success: false, message: 'Invalid prescription reference.' });
    return;
  }
  try {
    const prescription = await getPrescriptionByRef(ref);
    if (!prescription) {
      response.status(404).json({ success: false, message: 'Prescription not found.' });
      return;
    }
    // Doctors may only see prescriptions they issued
    if (request.authUser!.role === 'DOCTOR' && prescription.issuingUserId !== request.authUser!.id) {
      response.status(403).json({ success: false, message: 'Forbidden.' });
      return;
    }
    response.json({ success: true, prescription });
  } catch (error) {
    console.error('[Prescription get error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Failed to retrieve prescription.' });
  }
});

/** GET /api/doctor/patients/:id/prescriptions – patient prescription history for doctor */
app.get('/api/doctor/patients/:id/prescriptions', authenticate, requireRole('DOCTOR'), async (request, response) => {
  const patientId = Number(request.params.id);
  if (!Number.isSafeInteger(patientId) || patientId <= 0) {
    response.status(400).json({ success: false, message: 'Invalid patient ID.' });
    return;
  }
  try {
    const prescriptions = await getPatientPrescriptionHistory(patientId);
    response.json({ success: true, prescriptions });
  } catch (error) {
    console.error('[Patient prescriptions history error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Failed to retrieve patient prescription history.' });
  }
});

/** GET /api/prescriptions/history – doctor's own issued prescriptions */
app.get('/api/prescriptions/history', authenticate, requireRole('DOCTOR'), async (request, response) => {
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20));
  try {
    const result = await getDoctorPrescriptionHistory(request.authUser!.id, page, limit);
    response.json({ success: true, ...result });
  } catch (error) {
    console.error('[Prescription history error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Failed to retrieve prescription history.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PHARMACY – routes
// ══════════════════════════════════════════════════════════════════════════════

/** POST /api/pharmacy/lookup – QR or manual reference lookup */
app.post('/api/pharmacy/lookup', authenticate, requireRole('PHARMACY'), async (request, response) => {
  const ref = typeof request.body?.prescriptionRef === 'string' ? request.body.prescriptionRef.trim().toUpperCase() : '';
  if (!/^[A-F0-9]{20}$/.test(ref)) {
    response.status(400).json({ success: false, message: 'Invalid prescription reference.' });
    return;
  }
  try {
    const prescription = await lookupPrescriptionForPharmacy(ref, request.authUser!.id);
    if (!prescription) {
      response.status(404).json({
        success: false,
        message: 'Prescription not found or is not available for dispensing.'
      });
      return;
    }
    response.json({ success: true, prescription });
  } catch (error) {
    console.error('[Pharmacy lookup error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Lookup failed.' });
  }
});

/** GET /api/pharmacy/prescriptions – search issued prescriptions by patient name */
app.get('/api/pharmacy/prescriptions', authenticate, requireRole('PHARMACY'), async (request, response) => {
  const search = typeof request.query.search === 'string' ? request.query.search : '';
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20));
  try {
    const result = await searchPharmacyPrescriptions(search, page, limit);
    response.json({ success: true, ...result });
  } catch (error) {
    console.error('[Pharmacy search error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Search failed.' });
  }
});

/** GET /api/pharmacy/prescriptions/:ref – pharmacy view of a specific prescription */
app.get('/api/pharmacy/prescriptions/:ref', authenticate, requireRole('PHARMACY'), async (request, response) => {
  const ref = String(request.params.ref);
  if (!/^[A-F0-9]{20}$/.test(ref)) {
    response.status(400).json({ success: false, message: 'Invalid prescription reference.' });
    return;
  }
  try {
    const prescription = await getPrescriptionByRef(ref);
    if (!prescription || !['ISSUED', 'PARTIALLY_DISPENSED', 'DISPENSED'].includes(prescription.status)) {
      response.status(404).json({ success: false, message: 'Prescription not found.' });
      return;
    }
    response.json({ success: true, prescription });
  } catch (error) {
    console.error('[Pharmacy get prescription error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Failed to retrieve prescription.' });
  }
});

/** POST /api/pharmacy/prescriptions/:ref/dispense – record dispensing */
app.post('/api/pharmacy/prescriptions/:ref/dispense', authenticate, requireRole('PHARMACY'), async (request, response) => {
  const ref = String(request.params.ref);
  if (!/^[A-F0-9]{20}$/.test(ref)) {
    response.status(400).json({ success: false, message: 'Invalid prescription reference.' });
    return;
  }

  const itemId = Number(request.body?.itemId);
  const quantityToDispense = Number(request.body?.quantityToDispense);
  const amountPaid = typeof request.body?.amountPaid === 'number' ? request.body.amountPaid : undefined;
  const dispensingNote = typeof request.body?.dispensingNote === 'string' ? request.body.dispensingNote.trim() : undefined;

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    response.status(400).json({ success: false, message: 'Valid itemId is required.' });
    return;
  }
  if (!Number.isFinite(quantityToDispense) || quantityToDispense <= 0) {
    response.status(400).json({ success: false, message: 'quantityToDispense must be a positive number.' });
    return;
  }

  try {
    await recordDispensingEvent({
      prescriptionRef: ref,
      itemId,
      quantityToDispense,
      pharmacyUserId: request.authUser!.id,
      amountPaid,
      dispensingNote
    });
    response.json({ success: true, message: 'Dispensing recorded.' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to record dispensing.';
    const status = msg.includes('Cannot dispense') || msg.includes('greater than zero') ? 422 : 500;
    console.error('[Pharmacy dispense error]', msg);
    response.status(status).json({ success: false, message: msg });
  }
});

/** GET /api/pharmacy/dispensing-history */
app.get('/api/pharmacy/dispensing-history', authenticate, requireRole('PHARMACY'), async (request, response) => {
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));
  try {
    const result = await getPharmacyDispensingHistory(page, limit);
    response.json({ success: true, ...result });
  } catch (error) {
    console.error('[Pharmacy history error]', error instanceof Error ? error.message : error);
    response.status(500).json({ success: false, message: 'Failed to retrieve dispensing history.' });
  }
});

