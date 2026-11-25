import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  PackageCheck,
  Printer,
  Receipt,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getPharmacyDispensingHistory,
  getPharmacyPrescription,
  pharmacyLookupByRef,
  recordDispensing,
  searchPharmacyPrescriptions,
} from '../services/prescription';
import type {
  DispensingEvent,
  PrescriptionHeader,
  PrescriptionItem,
  PrescriptionStatus,
} from '../types/prescription';
import { STATUS_COLORS, STATUS_LABELS } from '../types/prescription';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Pharmacy Receipt / Bill Modal ───────────────────────────────────────────

function PharmacyReceiptModal({
  event,
  onClose,
}: {
  event: DispensingEvent;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const stripCount = event.stripSize ? Math.ceil(event.quantityDispensed / event.stripSize) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-teal-600" />
            <h2 className="text-base font-semibold text-gray-900">Pharmacy Dispensing Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-5 text-gray-800">
          {/* Pharmacy branding */}
          <div className="border-b border-dashed border-gray-200 pb-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">APOLLO HEALTHCARE CLINICAL PHARMACY</h3>
            <p className="text-xs text-gray-500">Hospital Central Dispensary · In-Patient &amp; Out-Patient Services</p>
            <p className="mt-1 font-mono text-xs text-gray-400">
              Receipt #{event.eventId.toString().padStart(6, '0')} · Ref: {event.prescriptionRef}
            </p>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-3 text-xs rounded-xl bg-gray-50 p-3.5 border border-gray-100">
            <div>
              <p className="text-gray-400 font-medium">PATIENT NAME</p>
              <p className="font-bold text-gray-900 text-sm">{event.patientName || 'Verified Patient'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">DEMOGRAPHICS</p>
              <p className="font-semibold text-gray-700">
                {event.patientAge ? `${event.patientAge} yrs` : ''} {event.patientGender ? `· ${event.patientGender}` : ''}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">DISPENSED AT</p>
              <p className="font-semibold text-gray-700">{formatDate(event.dispensedAt)}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">DISPENSED BY</p>
              <p className="font-semibold text-gray-700">{event.dispensedByEmail}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Itemized Medication Bill</p>
            <table className="w-full text-left text-xs border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Packaging</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Price/Strip</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-900">{event.medicineName}</p>
                    {event.strength && <p className="text-[11px] text-gray-500">{event.strength}</p>}
                  </td>
                  <td className="py-3 px-3 text-gray-600">
                    Strip of {event.stripSize || 10}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-gray-800">
                    {event.quantityDispensed} tabs ({stripCount} {stripCount === 1 ? 'strip' : 'strips'})
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600">
                    ₹{Number(event.pricePerStrip || 300).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">
                    ₹{Number(event.amountPaid || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Amount Paid</p>
                <p className="text-[11px] text-emerald-600">Status: Complete / Dispensed</p>
              </div>
              <p className="text-2xl font-black text-emerald-800">₹{Number(event.amountPaid || 0).toFixed(2)}</p>
            </div>
          </div>

          {event.dispensingNote && (
            <p className="text-xs italic text-gray-500">Note: {event.dispensingNote}</p>
          )}

          <p className="text-center text-[11px] text-gray-400">
            Thank you for choosing Hospital Pharmacy. For questions regarding your medication, please consult your physician.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm"
          >
            <Printer size={16} /> Print Bill
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── QR Scanner ───────────────────────────────────────────────────────────────

function QrScannerPanel({ onDetected }: { onDetected: (ref: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [camError, setCamError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setCamError(null);
    setDetected(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable';
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
        setCamError('Camera permission denied. Please allow camera access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCamError('No camera found on this device.');
      } else {
        setCamError(`Camera error: ${msg}`);
      }
    }
  }, []);

  // Scan frames for QR codes using BarcodeDetector
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    if ('BarcodeDetector' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      detector.detect(canvas).then((barcodes: Array<{ rawValue: string }>) => {
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue.trim().toUpperCase();
          handleDetected(value);
        } else {
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      }).catch(() => {
        rafRef.current = requestAnimationFrame(scanFrame);
      });
    } else {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }, []);

  const handleDetected = (value: string) => {
    cancelAnimationFrame(rafRef.current);
    setDetected(value);
    setScanning(false);
    stopCamera();
    onDetected(value);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-900" style={{ aspectRatio: '4/3', maxHeight: 300 }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ display: scanning ? 'block' : 'none' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner overlay */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-48 w-48">
              <div className="absolute inset-0 rounded-xl border-2 border-white/50" />
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} h-8 w-8 border-2 border-teal-400 ${i === 0 ? 'rounded-tl-lg border-t border-l' : i === 1 ? 'rounded-tr-lg border-t border-r' : i === 2 ? 'rounded-bl-lg border-b border-l' : 'rounded-br-lg border-b border-r'}`} />
              ))}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-teal-400/80 animate-pulse" />
            </div>
          </div>
        )}

        {!scanning && !camError && !detected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <Camera size={32} className="text-gray-400" />
            <p className="text-sm text-gray-400">Camera inactive</p>
          </div>
        )}

        {camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <CameraOff size={28} className="text-rose-400" />
            <p className="text-sm text-rose-300">{camError}</p>
          </div>
        )}

        {detected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-900/80">
            <CheckCircle2 size={36} className="text-emerald-400" />
            <p className="font-mono text-sm text-emerald-300">{detected}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!scanning ? (
          <button
            onClick={() => void startCamera()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition"
          >
            <Camera size={16} /> Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <X size={16} /> Stop Camera
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Prescription Detail & Dispensing ─────────────────────────────────────────

function DispensingRow({
  item,
  prescriptionRef,
  onDispensed,
}: {
  item: PrescriptionItem;
  prescriptionRef: string;
  onDispensed: () => void;
}) {
  const [qty, setQty] = useState(item.quantityRemaining > 0 ? item.quantityRemaining : 0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const remaining = item.quantityRemaining;
  const isFullyDispensed = remaining <= 0;

  const stripSize = item.stripSize || 10;
  const pricePerStrip = item.pricePerStrip || 300;
  const unitPrice = item.unitPrice || (pricePerStrip / stripSize);
  const stripsPrescribed = Math.ceil(item.quantityPrescribed / stripSize);
  const currentStripsToDispense = Math.ceil(qty / stripSize);
  const amountForQty = Math.round(qty * unitPrice * 100) / 100;

  if (done) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Dispensed &amp; billed successfully!</span>
        </div>
        <span className="font-bold">₹{amountForQty.toFixed(2)}</span>
      </div>
    );
  }

  const handleDispense = async () => {
    if (qty <= 0 || qty > remaining) {
      setError(`Quantity must be between 1 and ${remaining}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await recordDispensing(prescriptionRef, {
        itemId: item.itemId,
        quantityToDispense: qty,
        amountPaid: amountForQty,
        dispensingNote: note.trim() || undefined,
      });
      setDone(true);
      onDispensed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dispensing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-base">{item.medicineName}</p>
            {item.strength && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{item.strength}</span>}
            {item.routeOfAdmin && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">{item.routeOfAdmin}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {item.dosageInstruction} · {item.frequency} · {item.duration}
          </p>
          {item.extraInstructions && <p className="text-xs italic text-gray-400 mt-0.5">Note: {item.extraInstructions}</p>}
        </div>

        {/* Pricing Pill */}
        <div className="text-right shrink-0">
          <span className="font-black text-emerald-700 text-base">₹{(item.totalPrice || (stripsPrescribed * pricePerStrip)).toFixed(2)}</span>
          <p className="text-[11px] text-gray-400">
            {stripsPrescribed} {stripsPrescribed === 1 ? 'strip' : 'strips'} of {stripSize} @ ₹{pricePerStrip}
          </p>
        </div>
      </div>

      {/* Stock tracking details */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 my-2.5 border border-gray-100">
        <div><span className="text-gray-400">Prescribed: </span><strong>{item.quantityPrescribed}</strong> units</div>
        <div><span className="text-gray-400">Dispensed: </span><strong className="text-amber-600">{item.quantityDispensed}</strong></div>
        <div><span className="text-gray-400">Remaining: </span><strong className={remaining > 0 ? 'text-emerald-700' : 'text-gray-400'}>{remaining}</strong></div>
      </div>

      {isFullyDispensed ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 text-center font-medium">
          ✓ Fully dispensed and billed
        </div>
      ) : (
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Dispensing Quantity:</span>
            <span className="font-semibold text-emerald-700">Amount to Bill: ₹{amountForQty.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={remaining}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-teal-400 focus:outline-none"
              placeholder="Qty"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-teal-400 focus:outline-none"
              placeholder="Dispensing note (optional)"
            />
            <button
              onClick={() => void handleDispense()}
              disabled={submitting}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition shadow-sm whitespace-nowrap"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : `Dispense & Bill ₹${amountForQty.toFixed(2)}`}
            </button>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function PrescriptionDetailPanel({
  prescriptionRef,
  onClose,
}: {
  prescriptionRef: string;
  onClose: () => void;
}) {
  const [prescription, setPrescription] = useState<PrescriptionHeader | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPharmacyPrescription(prescriptionRef);
      setPrescription(res.prescription);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prescription.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [prescriptionRef, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
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

  if (!prescription) return null;

  const canDispense = ['ISSUED', 'PARTIALLY_DISPENSED'].includes(prescription.status);
  const totalPrescriptionAmount = prescription.totalAmount ||
    prescription.items?.reduce((acc, it) => acc + (it.totalPrice || 0), 0) || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft size={16} /> Back to search
        </button>
        <StatusBadge status={prescription.status} />
      </div>

      {/* Patient verification banner */}
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-teal-600 border border-teal-200 shadow-sm">
              <User size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Verified Patient</p>
              <p className="font-black text-gray-900 text-xl leading-tight">{prescription.patientName}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {prescription.patientAge} yrs · {prescription.patientGender} · Blood: {prescription.patientBloodGroup}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Bill Amount</p>
            <p className="text-2xl font-black text-emerald-700">₹{totalPrescriptionAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-mono text-teal-800 bg-white/80 border border-teal-100 rounded-lg px-3 py-1.5">
          <span>QR Ref: {prescription.prescriptionRef}</span>
          <span>Prescribed by {prescription.doctorName} · {formatDate(prescription.issuedAt)}</span>
        </div>
      </div>

      {/* Bill calculation banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-semibold flex items-center gap-1.5">
            <DollarSign size={15} className="text-emerald-600" />
            Prescription Billing &amp; Strip Calculation Breakdown
          </span>
          <span className="font-mono text-emerald-700 font-bold">Total: ₹{totalPrescriptionAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Medicine items + dispensing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            Prescription Medications ({prescription.items?.length ?? 0})
          </p>
          {!canDispense && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Prescription {prescription.status.toLowerCase()}
            </span>
          )}
        </div>

        {prescription.items?.map((item) => (
          <DispensingRow
            key={item.itemId}
            item={item}
            prescriptionRef={prescription.prescriptionRef}
            onDispensed={() => setRefreshKey((k) => k + 1)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Pharmacy History Tab ─────────────────────────────────────────────────────

function PharmacyHistoryTab() {
  const [events, setEvents] = useState<DispensingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<DispensingEvent | null>(null);

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await getPharmacyDispensingHistory(p, 20);
      setEvents(res.events);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(1); }, []);

  if (loading) return (
    <div className="flex justify-center py-12 text-gray-400">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );

  if (events.length === 0) return (
    <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
      <PackageCheck size={32} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm text-gray-400">No dispensing records yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {events.map((ev) => {
        const stripCount = ev.stripSize ? Math.ceil(ev.quantityDispensed / ev.stripSize) : 1;
        return (
          <div key={ev.eventId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-teal-300 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                {/* Patient Name header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-base">
                    {ev.patientName || 'Verified Patient'}
                  </span>
                  {ev.patientAge ? (
                    <span className="text-xs text-gray-500 font-normal">
                      ({ev.patientAge} yrs{ev.patientGender ? `, ${ev.patientGender}` : ''})
                    </span>
                  ) : null}
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 border border-teal-200">
                    Dispensed
                  </span>
                </div>

                {/* Medicine name & Packaging */}
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">
                    {ev.medicineName}
                    {ev.strength && <span className="ml-1 text-gray-500 font-normal text-xs">({ev.strength})</span>}
                  </p>
                  <span className="text-xs text-gray-400">·</span>
                  <p className="text-xs text-gray-600">
                    Qty: <strong>{ev.quantityDispensed}</strong> tabs ({stripCount} {stripCount === 1 ? 'strip' : 'strips'} of {ev.stripSize || 10})
                  </p>
                </div>

                {/* Amount Paid Pill */}
                <div className="pt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-black text-emerald-800 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Amount Paid: ₹{Number(ev.amountPaid || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Ref: {ev.prescriptionRef}</span>
                </div>

                <p className="text-xs text-gray-400 pt-0.5">Dispensed by: {ev.dispensedByEmail}</p>
                {ev.dispensingNote && <p className="text-xs italic text-gray-500">Note: {ev.dispensingNote}</p>}
              </div>

              {/* Timestamp & Bill View Button */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} /> {formatDate(ev.dispensedAt)}
                </p>
                <button
                  onClick={() => setSelectedReceipt(ev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-sm"
                >
                  <Receipt size={14} /> View Bill / Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button disabled={page === 1} onClick={() => { setPage(page - 1); void load(page - 1); }}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => { setPage(page + 1); void load(page + 1); }}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {selectedReceipt && (
        <PharmacyReceiptModal
          event={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

// ─── Search Tab ───────────────────────────────────────────────────────────────

function SearchTab({ onSelect }: { onSelect: (ref: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Omit<PrescriptionHeader, 'items'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchPharmacyPrescriptions(query, 1, 20);
      setResults(res.prescriptions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void handleSearch(e)} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prescriptions by patient name…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition">
          Search
        </button>
      </form>

      {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-400" /></div>}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-6">No prescriptions found for "{query}"</p>
      )}

      {!loading && results.map((rx) => (
        <button key={rx.prescriptionRef} onClick={() => onSelect(rx.prescriptionRef)}
          className="flex w-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-teal-300 hover:shadow-md transition">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600">
            <User size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{rx.patientName}</p>
              <StatusBadge status={rx.status} />
              {rx.totalAmount ? (
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  ₹{Number(rx.totalAmount).toFixed(2)}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-500">{rx.patientAge} yrs · {rx.patientGender}</p>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{rx.prescriptionRef}</p>
          </div>
          <p className="shrink-0 text-xs text-gray-400">{formatDate(rx.issuedAt)}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Main Pharmacy Dashboard ──────────────────────────────────────────────────

type ActiveTab = 'scan' | 'search' | 'history';

export function PharmacyDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [manualRef, setManualRef] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [activePrescriptionRef, setActivePrescriptionRef] = useState<string | null>(null);

  const handleLookup = async (ref: string) => {
    const cleanRef = ref.trim().toUpperCase();
    if (!/^[A-F0-9]{20}$/.test(cleanRef)) {
      setLookupError('Invalid prescription reference. Please scan a valid QR code or enter the 20-character reference.');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    try {
      await pharmacyLookupByRef(cleanRef);
      setActivePrescriptionRef(cleanRef);
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : 'Prescription not found or not available for dispensing.');
    } finally {
      setLookupLoading(false);
    }
  };

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'scan', label: 'Scan QR', icon: <Camera size={15} /> },
    { id: 'search', label: 'Patient Search', icon: <Search size={15} /> },
    { id: 'history', label: 'History', icon: <ClipboardList size={15} /> },
  ];

  if (activePrescriptionRef) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <PackageCheck size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dispense &amp; Bill Prescription</h1>
            <p className="text-sm text-gray-500">Verify patient, review billing calculation, and record dispensing</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <PrescriptionDetailPanel
            prescriptionRef={activePrescriptionRef}
            onClose={() => setActivePrescriptionRef(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
          <PackageCheck size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pharmacy Dashboard</h1>
          <p className="text-sm text-gray-500">Scan QR codes, verify prescriptions, and record dispensing bills</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setLookupError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-teal-600 text-teal-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Scan QR Tab */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Live Camera QR Scanner</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Point the camera at the patient's QR prescription to auto-verify and calculate pharmacy billing.
                </p>
              </div>

              <QrScannerPanel onDetected={(ref) => void handleLookup(ref)} />

              <div className="relative flex items-center justify-center">
                <hr className="w-full border-gray-200" />
                <span className="absolute bg-white px-3 text-xs text-gray-400">or enter reference manually</span>
              </div>

              {/* Manual Entry Fallback */}
              <form
                onSubmit={(e) => { e.preventDefault(); void handleLookup(manualRef); }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualRef}
                    onChange={(e) => setManualRef(e.target.value.toUpperCase())}
                    placeholder="e.g. ADECD6CACA1D46E8B19"
                    maxLength={20}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm tracking-wider uppercase text-gray-900 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading || !manualRef.trim()}
                    className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition shadow-sm"
                  >
                    {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : 'Lookup'}
                  </button>
                </div>
              </form>

              {lookupError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {lookupError}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <SearchTab onSelect={(ref) => setActivePrescriptionRef(ref)} />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <PharmacyHistoryTab />
          )}
        </div>
      </div>
    </div>
  );
}
