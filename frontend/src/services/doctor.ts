import { apiRequest } from './api';
import type { ClinicalAnalytics, PatientReport, PatientSummaryItem } from '../types/doctor';

export type PatientsResponse = {
  success: boolean;
  patients: PatientSummaryItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type PatientReportResponse = {
  success: boolean;
  report: PatientReport;
};

export type ClinicalAnalyticsResponse = {
  success: boolean;
  analytics: ClinicalAnalytics;
};

export function getPatients(search: string = '', page: number = 1, limit: number = 20) {
  const params = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit)
  });
  return apiRequest<PatientsResponse>(`/api/doctor/patients?${params.toString()}`);
}

export function getPatientReport(patientId: number) {
  return apiRequest<PatientReportResponse>(`/api/doctor/patients/${patientId}`);
}

export function getClinicalAnalytics() {
  return apiRequest<ClinicalAnalyticsResponse>('/api/doctor/analytics');
}
