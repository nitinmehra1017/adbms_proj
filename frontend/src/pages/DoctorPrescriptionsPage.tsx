import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock,
  Copy,
  FileText,
  History,
  Loader2,
  PlusCircle,
  Search,
  Stethoscope,
  Trash2,
  User,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { getPatients } from '../services/doctor';
import {
  createPrescription,
  getDoctorPrescriptionHistory,
  getPatientPrescriptionHistory,
  issuePrescription,
} from '../services/prescription';
import type { PatientSummaryItem } from '../types/doctor';
import type {
  CreatePrescriptionPayload,
  PrescriptionHeader,
  PrescriptionItemInput,
  PrescriptionStatus,
} from '../types/prescription';
import { STATUS_COLORS, STATUS_LABELS } from '../types/prescription';
import { useAuth } from '../hooks/useAuth';

// ─── Helpers ────────────────────────────────────────────────────────────────

const EMPTY_ITEM: PrescriptionItemInput = {
  medicineName: '',
  strength: '',
  dosageInstruction: '',
  frequency: '',
  duration: '',
  quantityPrescribed: 1,
  routeOfAdmin: '',
  extraInstructions: '',
};

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── QR Modal ───────────────────────────────────────────────────────────────

function QrModal({
  prescriptionRef,
  patient,
  onClose,
}: {
  prescriptionRef: string;
  patient: { name: string; age: number; gender: string };
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, prescriptionRef, {
        width: 260,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
    }
  }, [prescriptionRef]);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">Prescription Issued</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <p className="text-sm text-gray-500">Patient</p>
          <p className="mt-0.5 text-lg font-semibold text-gray-900">{patient.name}</p>
          <p className="text-sm text-gray-500">
            {patient.age} yrs · {patient.gender}
          </p>

          <div className="my-5 flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl border border-gray-100 p-2 shadow-sm" />
          </div>

          <p className="text-xs text-gray-400">Prescription Reference</p>
          <p className="mt-1 font-mono text-base font-semibold tracking-widest text-gray-800">
            {prescriptionRef}
          </p>
          <p className="mt-3 text-xs leading-5 text-gray-400">
            The pharmacy scans this QR code to retrieve the verified prescription and record dispensing.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Past Prescriptions Component ────────────────────────────────────

function PatientPastPrescriptionsCard({
  patientId,
  patientName,
  onCopyItems,
}: {
  patientId: number;
  patientName: string;
  onCopyItems: (items: PrescriptionItemInput[]) => void;
}) {
  const [history, setHistory] = useState<PrescriptionHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    getPatientPrescriptionHistory(patientId)
      .then((res) => {
        if (active) setHistory(res.prescriptions);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-600">
        <Loader2 size={16} className="animate-spin" />
        Checking previous prescription history for {patientName}…
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-xs text-gray-500">
        <History size={16} className="text-gray-400 shrink-0" />
        <span>No prior digital prescriptions on record for {patientName}. This is their initial prescription in the system.</span>
      </div>
    );
  }

  const latest = history[0];
  const olderPrescriptions = history.slice(1);

  const handleCopy = (rx: PrescriptionHeader) => {
    if (!rx.items || rx.items.length === 0) return;
    const copied: PrescriptionItemInput[] = rx.items.map((i) => ({
      medicineName: i.medicineName,
      strength: i.strength ?? undefined,
      dosageInstruction: i.dosageInstruction,
      frequency: i.frequency,
      duration: i.duration,
      quantityPrescribed: i.quantityPrescribed,
      routeOfAdmin: i.routeOfAdmin ?? 'Oral',
      extraInstructions: i.extraInstructions ?? undefined,
    }));
    onCopyItems(copied);
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2">
          <Stethoscope size={18} className="text-blue-600" />
          <h4 className="text-sm font-semibold text-blue-950">
            Patient Prescription History ({history.length} {history.length === 1 ? 'record' : 'records'})
          </h4>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(latest)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Copy size={13} /> Copy Last Prescription
        </button>
      </div>

      {/* Latest Prescription Card */}
      <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Last Prescribed</span>
              <StatusBadge status={latest.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Issued {formatDate(latest.issuedAt ?? latest.createdAt)} by <span className="font-medium text-gray-700">{latest.doctorName}</span>
            </p>
          </div>
          <span className="font-mono text-xs text-gray-400">Ref: {latest.prescriptionRef}</span>
        </div>

        {/* Medicines in this prescription */}
        <div className="mt-3 space-y-2">
          {latest.items?.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
              <div>
                <span className="font-semibold text-gray-900">{it.medicineName}</span>
                {it.strength && <span className="ml-1 text-gray-500">({it.strength})</span>}
                <p className="text-gray-500 mt-0.5">{it.dosageInstruction} · {it.frequency} · {it.duration}</p>
              </div>
              <span className="font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                Qty: {it.quantityPrescribed}
              </span>
            </div>
          ))}
        </div>

        {latest.generalNotes && (
          <p className="mt-2.5 text-xs italic text-gray-500 bg-amber-50/70 border border-amber-100 rounded-lg px-2.5 py-1.5">
            Notes: {latest.generalNotes}
          </p>
        )}
      </div>

      {/* Accordion for older records */}
      {olderPrescriptions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAll ? 'Hide older prescriptions' : `View ${olderPrescriptions.length} older prescription${olderPrescriptions.length > 1 ? 's' : ''}`}
          </button>

          {showAll && (
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-200">
              {olderPrescriptions.map((rx) => (
                <div key={rx.prescriptionRef} className="rounded-xl border border-gray-200 bg-white p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">{formatDate(rx.issuedAt ?? rx.createdAt)}</span>
                      <span className="ml-2"><StatusBadge status={rx.status} /></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(rx)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Copy this
                    </button>
                  </div>
                  <div className="mt-1.5 text-gray-600 space-y-0.5">
                    {rx.items?.map((it, i) => (
                      <p key={i}>• {it.medicineName} ({it.strength || ''}) - {it.quantityPrescribed} units ({it.frequency}, {it.duration})</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Patient Search Panel ────────────────────────────────────────────────────

function PatientSearchPanel({
  onSelect,
}: {
  onSelect: (patient: PatientSummaryItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<PatientSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPatients(q, p, 10);
      setPatients(res.patients);
      setTotalPages(res.totalPages);
    } catch {
      setError('Failed to load patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load('', 1); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load(query, 1);
  };

  const handlePage = (next: number) => {
    setPage(next);
    void load(query, next);
  };

  return (
    <div className="flex h-full flex-col">
      <form onSubmit={handleSearch} className="flex gap-2 p-4 border-b border-gray-100">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient by name…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}
        {error && <p className="p-4 text-sm text-rose-600">{error}</p>}
        {!loading && patients.length === 0 && !error && (
          <p className="p-4 text-sm text-gray-400">No patients found.</p>
        )}
        {!loading &&
          patients.map((p) => (
            <button
              key={p.patientId}
              onClick={() => onSelect(p)}
              className="flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-blue-50"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                <User size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    ID #{p.patientId}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {p.age} yrs · {p.gender} · Blood: {p.bloodGroup}
                </p>
                {p.primaryCondition && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">Condition: {p.primaryCondition}</p>
                )}
              </div>
            </button>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
          <button
            disabled={page === 1}
            onClick={() => handlePage(page - 1)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-400">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => handlePage(page + 1)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Create Prescription Form ─────────────────────────────────────────────────

function CreatePrescriptionForm({
  patient,
  onBack,
  onIssued,
}: {
  patient: PatientSummaryItem;
  onBack: () => void;
  onIssued: (ref: string) => void;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<PrescriptionItemInput[]>([{ ...EMPTY_ITEM }]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof PrescriptionItemInput, value: string | number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const handleCopyFromHistory = (copied: PrescriptionItemInput[]) => {
    setItems(copied);
  };

  const validate = (): string | null => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.medicineName.trim()) return `Item ${i + 1}: Medicine name is required.`;
      if (!item.dosageInstruction.trim()) return `Item ${i + 1}: Dosage instruction is required.`;
      if (!item.frequency.trim()) return `Item ${i + 1}: Frequency is required.`;
      if (!item.duration.trim()) return `Item ${i + 1}: Duration is required.`;
      if (!item.quantityPrescribed || item.quantityPrescribed <= 0)
        return `Item ${i + 1}: Quantity must be greater than zero.`;
    }
    return null;
  };

  const handleIssue = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreatePrescriptionPayload = {
        patientId: patient.patientId,
        generalNotes: generalNotes.trim() || undefined,
        items: items.map((i) => ({
          ...i,
          strength: i.strength?.trim() || undefined,
          routeOfAdmin: i.routeOfAdmin?.trim() || undefined,
          extraInstructions: i.extraInstructions?.trim() || undefined,
        })),
      };
      const { prescriptionRef } = await createPrescription(payload);
      await issuePrescription(prescriptionRef);
      onIssued(prescriptionRef);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const ROUTE_OPTIONS = ['Oral', 'IV', 'IM', 'Subcutaneous', 'Topical', 'Inhaled', 'Sublingual', 'Rectal', 'Nasal', 'Ophthalmic'];
  const FREQ_OPTIONS = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed (PRN)', 'At bedtime'];

  if (preview) {
    return (
      <div className="flex flex-col gap-5">
        {/* Preview header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setPreview(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <h3 className="font-semibold text-gray-900">Review Prescription</h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Patient row */}
          <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-600">
              <User size={16} />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{patient.name}</p>
              <p className="text-xs text-gray-500">
                {patient.age} yrs · {patient.gender} · Blood: {patient.bloodGroup}
              </p>
            </div>
            <div className="ml-auto text-right text-xs text-gray-400">
              <p>Prescribed by</p>
              <p className="font-medium text-gray-700">{user?.email}</p>
            </div>
          </div>

          {/* Medicines Preview */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Medicines ({items.length})
          </p>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.medicineName}
                      {item.strength && (
                        <span className="ml-2 text-sm font-normal text-gray-500">{item.strength}</span>
                      )}
                    </p>
                    {item.routeOfAdmin && (
                      <p className="text-xs text-blue-600">{item.routeOfAdmin}</p>
                    )}
                  </div>
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Qty: {item.quantityPrescribed}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div><span className="text-gray-400">Dosage: </span>{item.dosageInstruction}</div>
                  <div><span className="text-gray-400">Freq: </span>{item.frequency}</div>
                  <div><span className="text-gray-400">Duration: </span>{item.duration}</div>
                </div>

                {item.extraInstructions && (
                  <p className="mt-1.5 text-xs italic text-gray-500">Note: {item.extraInstructions}</p>
                )}
              </div>
            ))}
          </div>

          {generalNotes && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-700">General Notes</p>
              <p className="mt-1 text-sm text-amber-800">{generalNotes}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setPreview(false)}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={() => void handleIssue()}
            disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Issuing &amp; Generating QR…
              </span>
            ) : (
              'Issue Prescription (Generate QR)'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="font-semibold text-gray-900">New Prescription</h3>
          <p className="text-xs text-gray-500">
            {patient.name} · {patient.age} yrs · {patient.gender} · Blood: {patient.bloodGroup}
          </p>
        </div>
      </div>

      {/* Patient Past Prescriptions Component */}
      <PatientPastPrescriptionsCard
        patientId={patient.patientId}
        patientName={patient.name}
        onCopyItems={handleCopyFromHistory}
      />

      {/* Medicine items */}
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Medicine #{idx + 1}</p>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(idx)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Medicine name */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Medicine Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.medicineName}
                  onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                  placeholder="e.g. Amoxicillin"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Strength */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Strength</label>
                <input
                  type="text"
                  value={item.strength}
                  onChange={(e) => updateItem(idx, 'strength', e.target.value)}
                  placeholder="e.g. 500mg"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Route */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Route of Administration</label>
                <select
                  value={item.routeOfAdmin}
                  onChange={(e) => updateItem(idx, 'routeOfAdmin', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select route…</option>
                  {ROUTE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Dosage */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Dosage Instructions <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.dosageInstruction}
                  onChange={(e) => updateItem(idx, 'dosageInstruction', e.target.value)}
                  placeholder="e.g. 1 tablet after meals"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Frequency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={item.frequency}
                  onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select frequency…</option>
                  {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Duration <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                  placeholder="e.g. 15 days"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Quantity Prescribed <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={item.quantityPrescribed}
                  onChange={(e) => updateItem(idx, 'quantityPrescribed', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Extra instructions */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Additional Instructions</label>
                <input
                  type="text"
                  value={item.extraInstructions}
                  onChange={(e) => updateItem(idx, 'extraInstructions', e.target.value)}
                  placeholder="e.g. take with water, avoid alcohol"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addItem}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-300 py-3 text-sm font-medium text-blue-600 transition hover:border-blue-400 hover:bg-blue-50"
        >
          <PlusCircle size={16} />
          Add another medicine
        </button>
      </div>

      {/* General Notes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">General Prescription Notes</label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={3}
          placeholder="Optional — clinical advice or special instructions for the pharmacist or patient…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={() => {
          const err = validate();
          if (err) { setError(err); return; }
          setError(null);
          setPreview(true);
        }}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
      >
        Review &amp; Issue Prescription
      </button>
    </div>
  );
}

// ─── Doctor Prescription History Tab ─────────────────────────────────────────

function HistoryTab({ onViewQr }: { onViewQr: (ref: string, patientName: string, age: number, gender: string) => void }) {
  const [prescriptions, setPrescriptions] = useState<Omit<PrescriptionHeader, 'items'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterQuery, setFilterQuery] = useState('');

  const load = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDoctorPrescriptionHistory(p, 15);
      setPrescriptions(res.prescriptions);
      setTotalPages(res.totalPages);
    } catch {
      setError('Failed to load prescription history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(1); }, []);

  const filtered = filterQuery.trim()
    ? prescriptions.filter((rx) =>
        rx.patientName.toLowerCase().includes(filterQuery.toLowerCase()) ||
        rx.prescriptionRef.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : prescriptions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
        <ClipboardList size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-400">No prescriptions issued yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter issued prescriptions by patient name or reference…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((rx) => (
          <div key={rx.prescriptionRef} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-base">{rx.patientName}</p>
                  <StatusBadge status={rx.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {rx.patientAge} yrs · {rx.patientGender} · Blood: {rx.patientBloodGroup}
                </p>
                <p className="mt-1 font-mono text-xs text-gray-400">Ref: {rx.prescriptionRef}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  {formatDate(rx.issuedAt ?? rx.createdAt)}
                </p>
              </div>
              {(rx.status === 'ISSUED' || rx.status === 'PARTIALLY_DISPENSED') && (
                <button
                  onClick={() => onViewQr(rx.prescriptionRef, rx.patientName, rx.patientAge, rx.patientGender)}
                  className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                  Show QR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={page === 1}
            onClick={() => { setPage(page - 1); void load(page - 1); }}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => { setPage(page + 1); void load(page + 1); }}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type View = 'tabs' | 'create';
type ActiveTab = 'new' | 'history';

export function DoctorPrescriptionsPage() {
  const [view, setView] = useState<View>('tabs');
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummaryItem | null>(null);
  const [issuedRef, setIssuedRef] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ ref: string; name: string; age: number; gender: string } | null>(null);

  const handlePatientSelect = (patient: PatientSummaryItem) => {
    setSelectedPatient(patient);
    setView('create');
  };

  const handleIssued = (ref: string) => {
    setIssuedRef(ref);
    if (selectedPatient) {
      setQrData({ ref, name: selectedPatient.name, age: selectedPatient.age, gender: selectedPatient.gender });
    }
    setView('tabs');
    setActiveTab('history');
    setSelectedPatient(null);
  };

  const handleShowQr = (ref: string, name: string, age: number, gender: string) => {
    setQrData({ ref, name, age, gender });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
          <FileText size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500">Create digital QR prescriptions and review patient history</p>
        </div>
      </div>

      {view === 'tabs' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {(['new', 'history'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'new' ? 'New Prescription' : 'Issued Prescriptions History'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'new' && (
              <div>
                <p className="mb-4 text-sm text-gray-500">Search and select a patient to view their prescription history or write a new prescription.</p>
                <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: 420 }}>
                  <PatientSearchPanel onSelect={handlePatientSelect} />
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <HistoryTab onViewQr={handleShowQr} />
            )}
          </div>
        </div>
      )}

      {view === 'create' && selectedPatient && (
        <CreatePrescriptionForm
          patient={selectedPatient}
          onBack={() => { setView('tabs'); setSelectedPatient(null); }}
          onIssued={handleIssued}
        />
      )}

      {/* QR Modal – shown after issuance or when "Show QR" clicked */}
      {qrData && (
        <QrModal
          prescriptionRef={qrData.ref}
          patient={{ name: qrData.name, age: qrData.age, gender: qrData.gender }}
          onClose={() => { setQrData(null); setIssuedRef(null); }}
        />
      )}
    </div>
  );
}
