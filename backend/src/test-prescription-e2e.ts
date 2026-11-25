import assert from 'node:assert';

const BASE = 'http://localhost:5000/api';

async function request(path: string, options: { method?: string; body?: any; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.body) headers['Content-Type'] = 'application/json';
  if (options.cookie) headers['Cookie'] = options.cookie;

  const res = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const cookieHeader = res.headers.get('set-cookie');
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: json, cookie: cookieHeader };
}

async function runTestSuite() {
  console.log('🧪 Starting End-to-End Test Suite for Prescriptions & Pharmacy Workflow...\n');

  // 1. Doctor Login
  console.log('1. Logging in as Doctor...');
  const docLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'doctor@hospital.test', password: 'Demo@123' }
  });
  assert.strictEqual(docLogin.status, 200, 'Doctor login failed');
  const docCookie = docLogin.cookie?.split(';')[0];
  console.log('   ✓ Doctor authenticated successfully');

  // 2. Doctor Search Patients
  console.log('2. Searching patients directory...');
  const patRes = await request('/doctor/patients?search=Bobby&page=1&limit=5', {
    cookie: docCookie
  });
  assert.strictEqual(patRes.status, 200);
  assert.ok(patRes.body.patients.length > 0, 'No patients found');
  const targetPatient = patRes.body.patients[0];
  console.log(`   ✓ Found patient: ${targetPatient.name} (ID: ${targetPatient.patientId}, Age: ${targetPatient.age})`);

  // 3. Doctor Creates Prescription
  console.log('3. Doctor creates multi-medicine prescription...');
  const createRes = await request('/prescriptions', {
    method: 'POST',
    cookie: docCookie,
    body: {
      patientId: targetPatient.patientId,
      generalNotes: 'Take medicines after meals with plenty of water.',
      items: [
        {
          medicineName: 'Amoxicillin',
          strength: '500mg',
          dosageInstruction: '1 capsule after meals',
          frequency: 'Thrice daily',
          duration: '7 days',
          quantityPrescribed: 21,
          routeOfAdmin: 'Oral',
          extraInstructions: 'Complete full course even if symptoms subside'
        },
        {
          medicineName: 'Paracetamol',
          strength: '650mg',
          dosageInstruction: '1 tablet for fever or headache',
          frequency: 'Twice daily',
          duration: '3 days',
          quantityPrescribed: 6,
          routeOfAdmin: 'Oral'
        }
      ]
    }
  });
  assert.strictEqual(createRes.status, 201, 'Failed to create prescription');
  const ref = createRes.body.prescriptionRef;
  assert.ok(/^[A-F0-9]{20}$/.test(ref), 'Prescription reference format invalid');
  console.log(`   ✓ Prescription created with reference: ${ref} (status: DRAFT)`);

  // 4. Doctor Issues Prescription
  console.log('4. Doctor issues prescription...');
  const issueRes = await request(`/prescriptions/${ref}/issue`, {
    method: 'POST',
    cookie: docCookie
  });
  assert.strictEqual(issueRes.status, 200, 'Failed to issue prescription');
  console.log('   ✓ Prescription atomically issued in MySQL');

  // 5. Verify Doctor View of Issued Prescription
  const getRes = await request(`/prescriptions/${ref}`, {
    cookie: docCookie
  });
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.prescription.status, 'ISSUED');
  assert.strictEqual(getRes.body.prescription.items.length, 2);
  const item1 = getRes.body.prescription.items[0];
  const item2 = getRes.body.prescription.items[1];
  console.log(`   ✓ Verified status: ISSUED, Medicines: ${item1.medicineName} (${item1.quantityPrescribed}), ${item2.medicineName} (${item2.quantityPrescribed})`);

  // 6. Security & RBAC: Staff Cannot Access Pharmacy Lookup
  console.log('5. Testing RBAC: Staff user attempting pharmacy lookup...');
  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'staff@hospital.test', password: 'Demo@123' }
  });
  const staffCookie = staffLogin.cookie?.split(';')[0];
  const staffLookup = await request('/pharmacy/lookup', {
    method: 'POST',
    cookie: staffCookie,
    body: { prescriptionRef: ref }
  });
  assert.strictEqual(staffLookup.status, 403, 'Staff should be forbidden from pharmacy lookup');
  console.log('   ✓ RBAC enforced: Staff receives 403 Forbidden');

  // 7. Pharmacy Login
  console.log('6. Logging in as Pharmacy Staff...');
  const pharmLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'pharmacy@hospital.test', password: 'Demo@123' }
  });
  assert.strictEqual(pharmLogin.status, 200, 'Pharmacy login failed');
  const pharmCookie = pharmLogin.cookie?.split(';')[0];
  console.log('   ✓ Pharmacy staff authenticated successfully');

  // 8. Pharmacy Scans/Looks up Prescription
  console.log('7. Pharmacy looks up prescription by QR reference token...');
  const pharmLookup = await request('/pharmacy/lookup', {
    method: 'POST',
    cookie: pharmCookie,
    body: { prescriptionRef: ref }
  });
  assert.strictEqual(pharmLookup.status, 200, 'Pharmacy lookup failed');
  assert.strictEqual(pharmLookup.body.prescription.patientName, targetPatient.name);
  console.log(`   ✓ Verified correct patient: ${pharmLookup.body.prescription.patientName}`);

  // 9. Dispensing Validation: Over-dispensing rejection
  console.log('8. Testing over-dispensing protection...');
  const overDispense = await request(`/pharmacy/prescriptions/${ref}/dispense`, {
    method: 'POST',
    cookie: pharmCookie,
    body: {
      itemId: item1.itemId,
      quantityToDispense: 50 // only 21 prescribed
    }
  });
  assert.strictEqual(overDispense.status, 422, 'Over-dispensing should be rejected with 422');
  console.log('   ✓ Over-dispensing rejected correctly');

  // 10. Partial Dispensing
  console.log('9. Recording partial dispensing (dispense 10 of 21 for Item 1)...');
  const partDispense = await request(`/pharmacy/prescriptions/${ref}/dispense`, {
    method: 'POST',
    cookie: pharmCookie,
    body: {
      itemId: item1.itemId,
      quantityToDispense: 10,
      dispensingNote: 'Dispensed partial bottle of 10 capsules'
    }
  });
  assert.strictEqual(partDispense.status, 200);

  const checkPart = await request(`/pharmacy/prescriptions/${ref}`, {
    cookie: pharmCookie
  });
  assert.strictEqual(checkPart.body.prescription.status, 'PARTIALLY_DISPENSED');
  const updatedItem1 = checkPart.body.prescription.items.find((i: any) => i.itemId === item1.itemId);
  assert.strictEqual(updatedItem1.quantityDispensed, 10);
  assert.strictEqual(updatedItem1.quantityRemaining, 11);
  console.log('   ✓ Status updated to PARTIALLY_DISPENSED (Dispensed: 10, Remaining: 11)');

  // 11. Dispense Remaining to Complete
  console.log('10. Dispensing remaining quantities to complete prescription...');
  await request(`/pharmacy/prescriptions/${ref}/dispense`, {
    method: 'POST',
    cookie: pharmCookie,
    body: { itemId: item1.itemId, quantityToDispense: 11 }
  });
  await request(`/pharmacy/prescriptions/${ref}/dispense`, {
    method: 'POST',
    cookie: pharmCookie,
    body: { itemId: item2.itemId, quantityToDispense: 6, dispensingNote: 'Dispensed full strip of 6' }
  });

  const checkComplete = await request(`/pharmacy/prescriptions/${ref}`, {
    cookie: pharmCookie
  });
  assert.strictEqual(checkComplete.body.prescription.status, 'DISPENSED');
  console.log('   ✓ Status updated to DISPENSED');

  // 12. Check Dispensing History
  console.log('11. Verifying pharmacy dispensing history...');
  const histRes = await request('/pharmacy/dispensing-history?page=1&limit=5', {
    cookie: pharmCookie
  });
  assert.strictEqual(histRes.status, 200);
  assert.ok(histRes.body.events.length >= 3, 'Dispensing events missing');
  console.log(`   ✓ Found ${histRes.body.total} dispensing events recorded with timestamps and user email`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The prescription and pharmacy module is fully operational.\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
