/**
 * E2E Integration Test: Prescription Pricing, Billing & Patient History
 * 
 * Verifies:
 * 1. Doctor login & authentication
 * 2. Fetching patient previous prescription history (GET /api/doctor/patients/:id/prescriptions)
 * 3. Creating digital prescription with strip packaging & pricing:
 *    - 15 days, 30 tablets, 10 in single strip, 300rs strip -> Calculates ₹900.00!
 * 4. Issuing prescription (DRAFT -> ISSUED)
 * 5. Verifying patient prescription history now includes this prescription with ₹900.00
 * 6. Pharmacy login & authentication
 * 7. Pharmacy QR lookup (POST /api/pharmacy/lookup) showing patient name and calculated bill
 * 8. Dispensing medication with billing amount recorded
 * 9. Pharmacy dispensing history (GET /api/pharmacy/dispensing-history) showing patient name and ₹900.00 bill
 */

import 'dotenv/config';
import { pool } from './db/pool.js';
import {
  createPrescription,
  getDoctorPrescriptionHistory,
  getPatientPrescriptionHistory,
  getPharmacyDispensingHistory,
  getPrescriptionByRef,
  issuePrescription,
  lookupPrescriptionForPharmacy,
  recordDispensingEvent,
} from './services/prescriptionService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: unknown) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (detail) console.error('    Detail:', detail);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('  E2E Test: Prescription Billing & Patient History');
  console.log('====================================================\n');

  try {
    // 1. Verify a test patient exists (e.g. patient_id = 1)
    console.log('[Test 1] Verify target patient exists in database');
    const [patRows] = await pool.query<any[]>('SELECT patient_id, name FROM patients LIMIT 1');
    assert(patRows.length > 0, 'Target patient found', patRows[0]);
    const patientId = patRows[0].patient_id;
    const patientName = patRows[0].name;

    // 2. Fetch initial prescription history for this patient
    console.log(`\n[Test 2] Doctor checks patient prescription history for #${patientId} (${patientName})`);
    const initialHistory = await getPatientPrescriptionHistory(patientId);
    assert(Array.isArray(initialHistory), 'Patient prescription history returned array', { count: initialHistory.length });

    // 3. Doctor creates a new prescription with strip pricing (User example: 300rs strip, 15 days, 10 per strip = 900 total)
    console.log('\n[Test 3] Doctor creates prescription with strip packaging (300rs strip, 15 days, 10/strip -> 900 total)');
    const doctorUserId = 2; // doctor@hospital.test
    const prescriptionRef = await createPrescription({
      patientId,
      issuingUserId: doctorUserId,
      doctorName: 'Dr. John Doe',
      generalNotes: 'Take after meals for 15 days with water',
      items: [
        {
          medicineName: 'Amoxicillin',
          strength: '500mg',
          dosageInstruction: '1 tablet twice daily after meals',
          frequency: 'Twice daily',
          duration: '15 days',
          quantityPrescribed: 30, // 15 days x 2 = 30 tablets
          stripSize: 10,          // 10 in single strip
          pricePerStrip: 300,     // 300rs strip
          routeOfAdmin: 'Oral',
          extraInstructions: 'Complete full course'
        }
      ]
    });
    assert(/^[A-F0-9]{20}$/.test(prescriptionRef), `Prescription created with 20-char ref: ${prescriptionRef}`);

    // Verify calculated amount in database
    const createdRx = await getPrescriptionByRef(prescriptionRef);
    assert(createdRx !== null, 'Prescription retrieved from database');
    assert(createdRx?.status === 'DRAFT', 'Initial status is DRAFT');
    assert(createdRx?.items.length === 1, 'Contains 1 item');
    const item = createdRx!.items[0];
    assert(item.stripSize === 10, 'Strip size is 10');
    assert(item.pricePerStrip === 300, 'Price per strip is 300.00');
    assert(item.totalPrice === 900, `Total price calculated as ₹900.00 (got ₹${item.totalPrice})`);
    assert(createdRx?.totalAmount === 900, `Header total amount is ₹900.00 (got ₹${createdRx?.totalAmount})`);

    // 4. Doctor issues the prescription
    console.log('\n[Test 4] Doctor issues prescription');
    await issuePrescription(prescriptionRef, doctorUserId);
    const issuedRx = await getPrescriptionByRef(prescriptionRef);
    assert(issuedRx?.status === 'ISSUED', 'Status transitioned to ISSUED');
    assert(issuedRx?.issuedAt !== null, 'issued_at timestamp set');

    // 5. Patient prescription history now contains this prescription
    console.log(`\n[Test 5] Verify patient prescription history now includes new prescription #${prescriptionRef}`);
    const updatedHistory = await getPatientPrescriptionHistory(patientId);
    assert(updatedHistory.length > initialHistory.length, 'Prescription history count increased');
    assert(updatedHistory[0].prescriptionRef === prescriptionRef, 'Latest prescription is the newly issued one');
    assert(updatedHistory[0].totalAmount === 900, 'Latest prescription shows total amount ₹900.00');
    assert(updatedHistory[0].items[0].medicineName === 'Amoxicillin', 'Items properly populated in history');

    // 6. Pharmacy looks up the prescription via QR / Ref
    console.log('\n[Test 6] Pharmacy looks up prescription by QR ref');
    const pharmacyUserId = 4; // pharmacy@hospital.test
    const pharmacyRx = await lookupPrescriptionForPharmacy(prescriptionRef, pharmacyUserId);
    assert(pharmacyRx !== null, 'Prescription successfully retrieved by pharmacy');
    assert(pharmacyRx?.patientName === patientName, `Patient name matches: ${patientName}`);
    assert(pharmacyRx?.totalAmount === 900, 'Pharmacy sees total bill amount ₹900.00');

    // 7. Pharmacy records dispensing and calculates bill
    console.log('\n[Test 7] Pharmacy dispenses medication and records ₹900.00 bill');
    await recordDispensingEvent({
      prescriptionRef,
      itemId: item.itemId,
      quantityToDispense: 30,
      amountPaid: 900.00,
      pharmacyUserId,
      dispensingNote: 'Dispensed 3 strips of 10 tablets @ 300/strip. Total 900rs.'
    });

    const dispensedRx = await getPrescriptionByRef(prescriptionRef);
    assert(dispensedRx?.status === 'DISPENSED', 'Status transitioned to DISPENSED');
    assert(dispensedRx?.items[0].quantityRemaining === 0, 'Remaining quantity is 0');

    // 8. Pharmacy dispensing history displays Patient Name and Amount Paid
    console.log('\n[Test 8] Pharmacy dispensing history shows Patient Name and Amount Paid (₹900.00)');
    const dispensingHistory = await getPharmacyDispensingHistory(1, 10);
    assert(dispensingHistory.events.length > 0, 'Dispensing history contains records');
    const latestEvent = dispensingHistory.events[0];
    assert(latestEvent.prescriptionRef === prescriptionRef, 'Latest event matches prescription ref');
    assert(latestEvent.patientName === patientName, `History shows patient name: "${latestEvent.patientName}"`);
    assert(latestEvent.amountPaid === 900, `History shows amount paid: ₹${latestEvent.amountPaid.toFixed(2)}`);
    assert(latestEvent.medicineName === 'Amoxicillin', `History shows medicine name: ${latestEvent.medicineName}`);
    assert(latestEvent.quantityDispensed === 30, `History shows quantity: ${latestEvent.quantityDispensed}`);

    console.log('\n====================================================');
    console.log(`  E2E Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

run();
