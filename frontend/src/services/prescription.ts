import { apiRequest } from './api';
import type {
  CreatePrescriptionPayload,
  DispensingEvent,
  PrescriptionHeader,
  PrescriptionListResponse
} from '../types/prescription';

// ─── Doctor endpoints ─────────────────────────────────────────────────────────

export async function createPrescription(payload: CreatePrescriptionPayload): Promise<{ prescriptionRef: string }> {
  return apiRequest<{ success: true; prescriptionRef: string }>('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function issuePrescription(ref: string): Promise<void> {
  await apiRequest<{ success: true }>(`/api/prescriptions/${ref}/issue`, { method: 'POST' });
}

export async function getDoctorPrescription(ref: string): Promise<{ prescription: PrescriptionHeader }> {
  return apiRequest<{ success: true; prescription: PrescriptionHeader }>(`/api/prescriptions/${ref}`);
}

export async function getDoctorPrescriptionHistory(
  page = 1,
  limit = 20
): Promise<PrescriptionListResponse> {
  return apiRequest<PrescriptionListResponse>(`/api/prescriptions/history?page=${page}&limit=${limit}`);
}

export async function getPatientPrescriptionHistory(
  patientId: number
): Promise<{ prescriptions: PrescriptionHeader[] }> {
  return apiRequest<{ success: true; prescriptions: PrescriptionHeader[] }>(
    `/api/doctor/patients/${patientId}/prescriptions`
  );
}

// ─── Pharmacy endpoints ───────────────────────────────────────────────────────

export async function pharmacyLookupByRef(prescriptionRef: string): Promise<{ prescription: PrescriptionHeader }> {
  return apiRequest<{ success: true; prescription: PrescriptionHeader }>('/api/pharmacy/lookup', {
    method: 'POST',
    body: JSON.stringify({ prescriptionRef })
  });
}

export async function searchPharmacyPrescriptions(
  search: string,
  page = 1,
  limit = 20
): Promise<PrescriptionListResponse> {
  const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
  return apiRequest<PrescriptionListResponse>(`/api/pharmacy/prescriptions?${params.toString()}`);
}

export async function getPharmacyPrescription(ref: string): Promise<{ prescription: PrescriptionHeader }> {
  return apiRequest<{ success: true; prescription: PrescriptionHeader }>(`/api/pharmacy/prescriptions/${ref}`);
}

export async function recordDispensing(
  ref: string,
  payload: { itemId: number; quantityToDispense: number; amountPaid?: number; dispensingNote?: string }
): Promise<void> {
  await apiRequest<{ success: true }>(`/api/pharmacy/prescriptions/${ref}/dispense`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getPharmacyDispensingHistory(
  page = 1,
  limit = 20
): Promise<{ events: DispensingEvent[]; total: number; totalPages: number }> {
  return apiRequest<{ events: DispensingEvent[]; total: number; totalPages: number }>(
    `/api/pharmacy/dispensing-history?page=${page}&limit=${limit}`
  );
}
