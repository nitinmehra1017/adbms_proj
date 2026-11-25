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
  totalAmount?: number;
  generalNotes: string | null;
  issuedAt: string | null;
  createdAt: string;
  items?: PrescriptionItem[];
};

export type PrescriptionListResponse = {
  prescriptions: Omit<PrescriptionHeader, 'items'>[];
  total: number;
  totalPages: number;
};

export type PrescriptionItemInput = {
  medicineName: string;
  strength?: string;
  dosageInstruction: string;
  frequency: string;
  duration: string;
  stripSize?: number;
  pricePerStrip?: number;
  quantityPrescribed: number;
  routeOfAdmin?: string;
  extraInstructions?: string;
};

export type CreatePrescriptionPayload = {
  patientId: number;
  generalNotes?: string;
  items: PrescriptionItemInput[];
};

export type DispensingEvent = {
  eventId: number;
  itemId: number;
  medicineName: string;
  strength?: string | null;
  prescriptionRef: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  quantityDispensed: number;
  amountPaid: number;
  stripSize?: number;
  pricePerStrip?: number;
  unitPrice?: number;
  dispensedBy: number;
  dispensedByEmail: string;
  dispensingNote: string | null;
  dispensedAt: string;
};

export const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PARTIALLY_DISPENSED: 'Partially Dispensed',
  DISPENSED: 'Dispensed',
  REVOKED: 'Revoked'
};

export const STATUS_COLORS: Record<PrescriptionStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  ISSUED: 'bg-blue-50 text-blue-700 border-blue-200',
  PARTIALLY_DISPENSED: 'bg-amber-50 text-amber-700 border-amber-200',
  DISPENSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REVOKED: 'bg-rose-50 text-rose-700 border-rose-200'
};
