import { randomBytes } from 'node:crypto';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/pool.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PrescriptionStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_DISPENSED'
  | 'DISPENSED'
  | 'REVOKED';

export type PrescriptionItem = {
  itemId: number;
  medicineName: string;
  strength: string | null;
  dosageInstruction: string;
  frequency: string;
  duration: string;
  stripSize: number;
  pricePerStrip: number;
  unitPrice: number;
  totalPrice: number;
  quantityPrescribed: number;
  routeOfAdmin: string | null;
  extraInstructions: string | null;
  // computed for pharmacy display
  quantityDispensed: number;
  quantityRemaining: number;
};

export type PrescriptionHeader = {
  prescriptionRef: string;
  patientId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientBloodGroup: string;
  issuingUserId: number;
  doctorName: string;
  status: PrescriptionStatus;
  totalAmount: number;
  generalNotes: string | null;
  issuedAt: string | null;
  createdAt: string;
  items: PrescriptionItem[];
};

export type DispensingEvent = {
  eventId: number;
  itemId: number;
  medicineName: string;
  strength: string | null;
  prescriptionRef: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  quantityDispensed: number;
  amountPaid: number;
  stripSize: number;
  pricePerStrip: number;
  unitPrice: number;
  dispensedBy: number;
  dispensedByEmail: string;
  dispensingNote: string | null;
  dispensedAt: string;
};

export type CreatePrescriptionInput = {
  patientId: number;
  issuingUserId: number;
  doctorName: string;
  generalNotes?: string;
  items: Array<{
    medicineName: string;
    strength?: string;
    dosageInstruction: string;
    frequency: string;
    duration: string;
    quantityPrescribed: number;
    stripSize?: number;
    pricePerStrip?: number;
    routeOfAdmin?: string;
    extraInstructions?: string;
  }>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generates a 20-char opaque hex reference that is non-guessable. */
function generatePrescriptionRef(): string {
  return randomBytes(10).toString('hex').toUpperCase(); // 20 chars
}

function toISOString(val: unknown): string | null {
  if (!val) return null;
  return new Date(val as string).toISOString();
}

async function writePrescriptionAudit(
  conn: PoolConnection,
  prescriptionRef: string,
  actorUserId: number,
  eventType: string,
  eventDetail?: string
): Promise<void> {
  await conn.execute(
    `INSERT INTO prescription_audit_log (prescription_ref, actor_user_id, event_type, event_detail)
     VALUES (?, ?, ?, ?)`,
    [prescriptionRef, actorUserId, eventType, eventDetail ?? null]
  );
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a DRAFT prescription with its line items inside a single transaction.
 * Returns the new prescription_ref on success.
 */
export async function createPrescription(
  input: CreatePrescriptionInput
): Promise<string> {
  if (!input.items.length) throw new Error('At least one medicine item is required.');

  const ref = generatePrescriptionRef();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Validate patient exists
    const [patRows] = await conn.execute<RowDataPacket[]>(
      `SELECT patient_id FROM patients WHERE patient_id = ? LIMIT 1`,
      [input.patientId]
    );
    if (!patRows.length) throw new Error('Patient not found.');

    // Calculate item pricing and total header amount
    let calculatedHeaderTotal = 0;
    const processedItems = input.items.map((item) => {
      const qty = Number(item.quantityPrescribed) || 1;
      const stripSize = Number(item.stripSize) > 0 ? Number(item.stripSize) : 10;
      const pricePerStrip = Number(item.pricePerStrip) >= 0 ? Number(item.pricePerStrip) : 300;
      const unitPrice = Math.round((pricePerStrip / stripSize) * 100) / 100;
      const stripsNeeded = Math.ceil(qty / stripSize);
      const totalPrice = Math.round(stripsNeeded * pricePerStrip * 100) / 100;
      calculatedHeaderTotal += totalPrice;

      return {
        ...item,
        qty,
        stripSize,
        pricePerStrip,
        unitPrice,
        totalPrice
      };
    });

    await conn.execute(
      `INSERT INTO prescription_headers
         (prescription_ref, patient_id, issuing_user_id, doctor_name, status, total_amount, general_notes)
       VALUES (?, ?, ?, ?, 'DRAFT', ?, ?)`,
      [ref, input.patientId, input.issuingUserId, input.doctorName, calculatedHeaderTotal, input.generalNotes ?? null]
    );

    for (const item of processedItems) {
      await conn.execute(
        `INSERT INTO prescription_items
           (prescription_ref, medicine_name, strength, dosage_instruction, frequency,
            duration, strip_size, price_per_strip, unit_price, total_price,
            quantity_prescribed, route_of_admin, extra_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ref,
          item.medicineName,
          item.strength ?? null,
          item.dosageInstruction,
          item.frequency,
          item.duration,
          item.stripSize,
          item.pricePerStrip,
          item.unitPrice,
          item.totalPrice,
          item.qty,
          item.routeOfAdmin ?? null,
          item.extraInstructions ?? null
        ]
      );
    }

    await writePrescriptionAudit(conn, ref, input.issuingUserId, 'CREATED', `total_amount=${calculatedHeaderTotal}`);
    await conn.commit();
    return ref;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Issue a DRAFT prescription: atomically marks it ISSUED with a timestamp.
 */
export async function issuePrescription(
  prescriptionRef: string,
  requestingUserId: number
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT prescription_ref, issuing_user_id, status FROM prescription_headers
       WHERE prescription_ref = ? FOR UPDATE`,
      [prescriptionRef]
    );
    if (!rows.length) throw new Error('Prescription not found.');
    const ph = rows[0] as { prescription_ref: string; issuing_user_id: number; status: string };
    if (ph.issuing_user_id !== requestingUserId) throw new Error('Forbidden: not your prescription.');
    if (ph.status !== 'DRAFT') throw new Error(`Cannot issue a prescription with status '${ph.status}'.`);

    await conn.execute(
      `UPDATE prescription_headers SET status = 'ISSUED', issued_at = NOW()
       WHERE prescription_ref = ?`,
      [prescriptionRef]
    );

    await writePrescriptionAudit(conn, prescriptionRef, requestingUserId, 'ISSUED');
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Fetch a full prescription (header + items with dispensed totals and pricing).
 * Returns null if not found.
 */
export async function getPrescriptionByRef(
  ref: string
): Promise<PrescriptionHeader | null> {
  const [headerRows] = await pool.execute<RowDataPacket[]>(
    `SELECT ph.prescription_ref, ph.patient_id, p.name AS patient_name,
            p.age AS patient_age, p.gender AS patient_gender,
            p.blood_group AS patient_blood_group,
            ph.issuing_user_id, ph.doctor_name, ph.status,
            COALESCE(ph.total_amount, 0.00) AS total_amount,
            ph.general_notes, ph.issued_at, ph.created_at
     FROM prescription_headers ph
     JOIN patients p ON p.patient_id = ph.patient_id
     WHERE ph.prescription_ref = ?
     LIMIT 1`,
    [ref]
  );
  if (!headerRows.length) return null;
  const h = headerRows[0];

  const [itemRows] = await pool.execute<RowDataPacket[]>(
    `SELECT pi.item_id, pi.medicine_name, pi.strength, pi.dosage_instruction,
            pi.frequency, pi.duration,
            COALESCE(pi.strip_size, 10) AS strip_size,
            COALESCE(pi.price_per_strip, 300.00) AS price_per_strip,
            COALESCE(pi.unit_price, 30.00) AS unit_price,
            COALESCE(pi.total_price, 0.00) AS total_price,
            pi.quantity_prescribed,
            pi.route_of_admin, pi.extra_instructions,
            COALESCE(SUM(de.quantity_dispensed), 0) AS quantity_dispensed
     FROM prescription_items pi
     LEFT JOIN dispensing_events de ON de.item_id = pi.item_id
     WHERE pi.prescription_ref = ?
     GROUP BY pi.item_id`,
    [ref]
  );

  const items: PrescriptionItem[] = itemRows.map((r) => {
    const qtyPrescribed = Number(r.quantity_prescribed);
    const qtyDispensed = Number(r.quantity_dispensed);
    const stripSize = Number(r.strip_size) || 10;
    const pricePerStrip = Number(r.price_per_strip) || 300;
    const unitPrice = Number(r.unit_price) || Math.round((pricePerStrip / stripSize) * 100) / 100;
    const totalPrice = Number(r.total_price) || (Math.ceil(qtyPrescribed / stripSize) * pricePerStrip);

    return {
      itemId: r.item_id,
      medicineName: r.medicine_name,
      strength: r.strength,
      dosageInstruction: r.dosage_instruction,
      frequency: r.frequency,
      duration: r.duration,
      stripSize,
      pricePerStrip,
      unitPrice,
      totalPrice,
      quantityPrescribed: qtyPrescribed,
      routeOfAdmin: r.route_of_admin,
      extraInstructions: r.extra_instructions,
      quantityDispensed: qtyDispensed,
      quantityRemaining: qtyPrescribed - qtyDispensed
    };
  });

  return {
    prescriptionRef: h.prescription_ref,
    patientId: h.patient_id,
    patientName: h.patient_name,
    patientAge: h.patient_age,
    patientGender: h.patient_gender,
    patientBloodGroup: h.patient_blood_group,
    issuingUserId: h.issuing_user_id,
    doctorName: h.doctor_name,
    status: h.status as PrescriptionStatus,
    totalAmount: Number(h.total_amount) || items.reduce((acc, it) => acc + it.totalPrice, 0),
    generalNotes: h.general_notes,
    issuedAt: toISOString(h.issued_at),
    createdAt: toISOString(h.created_at) ?? new Date().toISOString(),
    items
  };
}

/**
 * List prescriptions the given doctor user has issued (paginated).
 */
export async function getDoctorPrescriptionHistory(
  issuingUserId: number,
  page: number,
  limit: number
): Promise<{ prescriptions: Omit<PrescriptionHeader, 'items'>[]; total: number; totalPages: number }> {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ph.prescription_ref, ph.patient_id, p.name AS patient_name,
            p.age AS patient_age, p.gender AS patient_gender,
            p.blood_group AS patient_blood_group,
            ph.issuing_user_id, ph.doctor_name, ph.status,
            COALESCE(ph.total_amount, 0.00) AS total_amount,
            ph.general_notes, ph.issued_at, ph.created_at
     FROM prescription_headers ph
     JOIN patients p ON p.patient_id = ph.patient_id
     WHERE ph.issuing_user_id = ?
     ORDER BY ph.created_at DESC
     LIMIT ? OFFSET ?`,
    [issuingUserId, limit, offset]
  );

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM prescription_headers WHERE issuing_user_id = ?`,
    [issuingUserId]
  );
  const total = Number(countRows[0]?.total ?? 0);

  return {
    prescriptions: rows.map((h) => ({
      prescriptionRef: h.prescription_ref,
      patientId: h.patient_id,
      patientName: h.patient_name,
      patientAge: h.patient_age,
      patientGender: h.patient_gender,
      patientBloodGroup: h.patient_blood_group,
      issuingUserId: h.issuing_user_id,
      doctorName: h.doctor_name,
      status: h.status as PrescriptionStatus,
      totalAmount: Number(h.total_amount || 0),
      generalNotes: h.general_notes,
      issuedAt: toISOString(h.issued_at),
      createdAt: toISOString(h.created_at) ?? new Date().toISOString()
    })),
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Fetch all digital prescriptions issued for a specific patient.
 * Allows doctors to easily view the patient's previous prescriptions and details.
 */
export async function getPatientPrescriptionHistory(
  patientId: number
): Promise<PrescriptionHeader[]> {
  const [headerRows] = await pool.execute<RowDataPacket[]>(
    `SELECT ph.prescription_ref, ph.patient_id, p.name AS patient_name,
            p.age AS patient_age, p.gender AS patient_gender,
            p.blood_group AS patient_blood_group,
            ph.issuing_user_id, ph.doctor_name, ph.status,
            COALESCE(ph.total_amount, 0.00) AS total_amount,
            ph.general_notes, ph.issued_at, ph.created_at
     FROM prescription_headers ph
     JOIN patients p ON p.patient_id = ph.patient_id
     WHERE ph.patient_id = ?
     ORDER BY ph.created_at DESC`,
    [patientId]
  );

  if (!headerRows.length) return [];

  const results: PrescriptionHeader[] = [];

  for (const h of headerRows) {
    const [itemRows] = await pool.execute<RowDataPacket[]>(
      `SELECT pi.item_id, pi.medicine_name, pi.strength, pi.dosage_instruction,
              pi.frequency, pi.duration,
              COALESCE(pi.strip_size, 10) AS strip_size,
              COALESCE(pi.price_per_strip, 300.00) AS price_per_strip,
              COALESCE(pi.unit_price, 30.00) AS unit_price,
              COALESCE(pi.total_price, 0.00) AS total_price,
              pi.quantity_prescribed,
              pi.route_of_admin, pi.extra_instructions,
              COALESCE(SUM(de.quantity_dispensed), 0) AS quantity_dispensed
       FROM prescription_items pi
       LEFT JOIN dispensing_events de ON de.item_id = pi.item_id
       WHERE pi.prescription_ref = ?
       GROUP BY pi.item_id`,
      [h.prescription_ref]
    );

    const items: PrescriptionItem[] = itemRows.map((r) => {
      const qtyPrescribed = Number(r.quantity_prescribed);
      const qtyDispensed = Number(r.quantity_dispensed);
      const stripSize = Number(r.strip_size) || 10;
      const pricePerStrip = Number(r.price_per_strip) || 300;
      const unitPrice = Number(r.unit_price) || Math.round((pricePerStrip / stripSize) * 100) / 100;
      const totalPrice = Number(r.total_price) || (Math.ceil(qtyPrescribed / stripSize) * pricePerStrip);

      return {
        itemId: r.item_id,
        medicineName: r.medicine_name,
        strength: r.strength,
        dosageInstruction: r.dosage_instruction,
        frequency: r.frequency,
        duration: r.duration,
        stripSize,
        pricePerStrip,
        unitPrice,
        totalPrice,
        quantityPrescribed: qtyPrescribed,
        routeOfAdmin: r.route_of_admin,
        extraInstructions: r.extra_instructions,
        quantityDispensed: qtyDispensed,
        quantityRemaining: qtyPrescribed - qtyDispensed
      };
    });

    results.push({
      prescriptionRef: h.prescription_ref,
      patientId: h.patient_id,
      patientName: h.patient_name,
      patientAge: h.patient_age,
      patientGender: h.patient_gender,
      patientBloodGroup: h.patient_blood_group,
      issuingUserId: h.issuing_user_id,
      doctorName: h.doctor_name,
      status: h.status as PrescriptionStatus,
      totalAmount: Number(h.total_amount) || items.reduce((acc, it) => acc + it.totalPrice, 0),
      generalNotes: h.general_notes,
      issuedAt: toISOString(h.issued_at),
      createdAt: toISOString(h.created_at) ?? new Date().toISOString(),
      items
    });
  }

  return results;
}

/**
 * Pharmacy: lookup an ISSUED (or partially dispensed) prescription by ref.
 * Logs the lookup attempt. Returns null if not found/not accessible.
 */
export async function lookupPrescriptionForPharmacy(
  ref: string,
  pharmacyUserId: number
): Promise<PrescriptionHeader | null> {
  const prescription = await getPrescriptionByRef(ref);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (!prescription || !['ISSUED', 'PARTIALLY_DISPENSED'].includes(prescription.status)) {
      await writePrescriptionAudit(
        conn,
        ref,
        pharmacyUserId,
        'PHARMACY_LOOKUP_FAIL',
        prescription ? `Status was ${prescription.status}` : 'Not found'
      );
      await conn.commit();
      return null;
    }
    await writePrescriptionAudit(conn, ref, pharmacyUserId, 'PHARMACY_LOOKUP', 'QR/manual lookup');
    await conn.commit();
    return prescription;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Record a dispensing event for one prescription item.
 * Prevents over-dispensing via row-level lock + recheck inside transaction.
 * Automatically computes amount_paid from strip price or accepts specified amount.
 */
export async function recordDispensingEvent(input: {
  prescriptionRef: string;
  itemId: number;
  quantityToDispense: number;
  pharmacyUserId: number;
  amountPaid?: number;
  dispensingNote?: string;
}): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the prescription header
    const [headerRows] = await conn.execute<RowDataPacket[]>(
      `SELECT status FROM prescription_headers WHERE prescription_ref = ? FOR UPDATE`,
      [input.prescriptionRef]
    );
    if (!headerRows.length) throw new Error('Prescription not found.');
    const status = headerRows[0].status as PrescriptionStatus;
    if (!['ISSUED', 'PARTIALLY_DISPENSED'].includes(status)) {
      throw new Error(`Prescription is ${status} and cannot be dispensed.`);
    }

    // Lock item and recheck remaining
    const [itemRows] = await conn.execute<RowDataPacket[]>(
      `SELECT pi.quantity_prescribed,
              pi.strip_size, pi.price_per_strip, pi.unit_price, pi.total_price,
              COALESCE(SUM(de.quantity_dispensed), 0) AS already_dispensed
       FROM prescription_items pi
       LEFT JOIN dispensing_events de ON de.item_id = pi.item_id
       WHERE pi.item_id = ? AND pi.prescription_ref = ?
       GROUP BY pi.item_id
       FOR UPDATE OF pi`,
      [input.itemId, input.prescriptionRef]
    );
    if (!itemRows.length) throw new Error('Prescription item not found.');

    const prescribed = Number(itemRows[0].quantity_prescribed);
    const alreadyDispensed = Number(itemRows[0].already_dispensed);
    const remaining = prescribed - alreadyDispensed;

    if (input.quantityToDispense <= 0) throw new Error('Quantity must be greater than zero.');
    if (input.quantityToDispense > remaining) {
      throw new Error(
        `Cannot dispense ${input.quantityToDispense}. Only ${remaining} remaining.`
      );
    }

    // Calculate billing amount
    let finalAmountPaid: number;
    if (typeof input.amountPaid === 'number' && Number.isFinite(input.amountPaid) && input.amountPaid >= 0) {
      finalAmountPaid = input.amountPaid;
    } else {
      const stripSize = Number(itemRows[0].strip_size) || 10;
      const pricePerStrip = Number(itemRows[0].price_per_strip) || 300;
      const unitPrice = Number(itemRows[0].unit_price) || Math.round((pricePerStrip / stripSize) * 100) / 100;
      finalAmountPaid = Math.round(input.quantityToDispense * unitPrice * 100) / 100;
    }

    await conn.execute(
      `INSERT INTO dispensing_events
         (item_id, prescription_ref, quantity_dispensed, amount_paid, dispensed_by, dispensing_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.itemId, input.prescriptionRef, input.quantityToDispense, finalAmountPaid, input.pharmacyUserId, input.dispensingNote ?? null]
    );

    // Recalculate remaining quantities for all items and update status
    const [undispensedRows] = await conn.execute<RowDataPacket[]>(
      `SELECT pi.item_id
       FROM prescription_items pi
       LEFT JOIN (
         SELECT item_id, SUM(quantity_dispensed) AS total_dispensed
         FROM dispensing_events
         WHERE prescription_ref = ?
         GROUP BY item_id
       ) de ON de.item_id = pi.item_id
       WHERE pi.prescription_ref = ?
         AND (pi.quantity_prescribed - COALESCE(de.total_dispensed, 0)) > 0
       LIMIT 1`,
      [input.prescriptionRef, input.prescriptionRef]
    );

    const newStatus: PrescriptionStatus = undispensedRows.length === 0 ? 'DISPENSED' : 'PARTIALLY_DISPENSED';

    await conn.execute(
      `UPDATE prescription_headers SET status = ? WHERE prescription_ref = ?`,
      [newStatus, input.prescriptionRef]
    );

    await writePrescriptionAudit(
      conn,
      input.prescriptionRef,
      input.pharmacyUserId,
      'DISPENSED',
      `item_id=${input.itemId} qty=${input.quantityToDispense} amount=${finalAmountPaid} new_status=${newStatus}`
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Pharmacy dispensing history (paginated).
 * Joins prescription_headers and patients to return full patient name, age, and bill amount paid.
 */
export async function getPharmacyDispensingHistory(
  page: number,
  limit: number
): Promise<{ events: DispensingEvent[]; total: number; totalPages: number }> {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT de.event_id, de.item_id, pi.medicine_name, pi.strength,
            de.prescription_ref, de.quantity_dispensed,
            COALESCE(de.amount_paid, 0.00) AS amount_paid,
            COALESCE(pi.strip_size, 10) AS strip_size,
            COALESCE(pi.price_per_strip, 300.00) AS price_per_strip,
            COALESCE(pi.unit_price, 30.00) AS unit_price,
            p.name AS patient_name, p.age AS patient_age, p.gender AS patient_gender,
            de.dispensed_by, u.email AS dispensed_by_email,
            de.dispensing_note, de.dispensed_at
     FROM dispensing_events de
     JOIN prescription_items pi ON pi.item_id = de.item_id
     JOIN prescription_headers ph ON ph.prescription_ref = de.prescription_ref
     JOIN patients p ON p.patient_id = ph.patient_id
     JOIN users u ON u.user_id = de.dispensed_by
     ORDER BY de.dispensed_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM dispensing_events`
  );
  const total = Number(countRows[0]?.total ?? 0);

  return {
    events: rows.map((r) => ({
      eventId: r.event_id,
      itemId: r.item_id,
      medicineName: r.medicine_name,
      strength: r.strength,
      prescriptionRef: r.prescription_ref,
      patientName: r.patient_name,
      patientAge: Number(r.patient_age),
      patientGender: r.patient_gender,
      quantityDispensed: Number(r.quantity_dispensed),
      amountPaid: Number(r.amount_paid),
      stripSize: Number(r.strip_size),
      pricePerStrip: Number(r.price_per_strip),
      unitPrice: Number(r.unit_price),
      dispensedBy: r.dispensed_by,
      dispensedByEmail: r.dispensed_by_email,
      dispensingNote: r.dispensing_note,
      dispensedAt: toISOString(r.dispensed_at) ?? new Date().toISOString()
    })),
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Search prescriptions by patient name (for pharmacy patient-name search).
 */
export async function searchPharmacyPrescriptions(
  search: string,
  page: number,
  limit: number
): Promise<{ prescriptions: Omit<PrescriptionHeader, 'items'>[]; total: number; totalPages: number }> {
  const offset = (page - 1) * limit;
  const like = `%${search}%`;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ph.prescription_ref, ph.patient_id, p.name AS patient_name,
            p.age AS patient_age, p.gender AS patient_gender,
            p.blood_group AS patient_blood_group,
            ph.issuing_user_id, ph.doctor_name, ph.status,
            COALESCE(ph.total_amount, 0.00) AS total_amount,
            ph.general_notes, ph.issued_at, ph.created_at
     FROM prescription_headers ph
     JOIN patients p ON p.patient_id = ph.patient_id
     WHERE ph.status IN ('ISSUED','PARTIALLY_DISPENSED','DISPENSED')
       AND p.name LIKE ?
     ORDER BY ph.issued_at DESC
     LIMIT ? OFFSET ?`,
    [like, limit, offset]
  );

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM prescription_headers ph
     JOIN patients p ON p.patient_id = ph.patient_id
     WHERE ph.status IN ('ISSUED','PARTIALLY_DISPENSED','DISPENSED')
       AND p.name LIKE ?`,
    [like]
  );
  const total = Number(countRows[0]?.total ?? 0);

  return {
    prescriptions: rows.map((h) => ({
      prescriptionRef: h.prescription_ref,
      patientId: h.patient_id,
      patientName: h.patient_name,
      patientAge: h.patient_age,
      patientGender: h.patient_gender,
      patientBloodGroup: h.patient_blood_group,
      issuingUserId: h.issuing_user_id,
      doctorName: h.doctor_name,
      status: h.status as PrescriptionStatus,
      totalAmount: Number(h.total_amount || 0),
      generalNotes: h.general_notes,
      issuedAt: toISOString(h.issued_at),
      createdAt: toISOString(h.created_at) ?? new Date().toISOString()
    })),
    total,
    totalPages: Math.ceil(total / limit)
  };
}
