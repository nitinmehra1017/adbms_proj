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
