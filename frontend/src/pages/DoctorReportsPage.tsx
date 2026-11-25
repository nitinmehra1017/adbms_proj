import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  FlaskConical,
  Info,
  LoaderCircle,
  Pill,
  Search,
  Stethoscope,
  TrendingUp,
  User,
  UserCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getClinicalAnalytics, getPatientReport, getPatients } from '../services/doctor';
import type { ClinicalAnalytics, PatientReport, PatientSummaryItem } from '../types/doctor';

const COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#ea580c', '#0284c7', '#16a34a', '#d97706'];

export function DoctorReportsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [patients, setPatients] = useState<PatientSummaryItem[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Selected Patient Report State
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [report, setReport] = useState<PatientReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Clinical Analytics State
  const [analytics, setAnalytics] = useState<ClinicalAnalytics | null>(null);

  // Load Patient List
  const loadPatients = async (query = search, targetPage = page) => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await getPatients(query, targetPage, 15);
      setPatients(res.patients);
      setTotalPatients(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load patient directory.');
    } finally {
      setLoadingList(false);
    }
  };

  // Load Analytics on mount
  useEffect(() => {
    void getClinicalAnalytics()
      .then((res) => setAnalytics(res.analytics))
      .catch((err) => console.error('Failed to load clinical analytics:', err));
  }, []);

  // Fetch Patient List on search/page change
  useEffect(() => {
    void loadPatients(search, page);
  }, [page]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadPatients(search, 1);
  };

  // Select a Patient
  const handleSelectPatient = async (id: number) => {
    setSelectedPatientId(id);
    setLoadingReport(true);
    setReportError(null);
    try {
      const res = await getPatientReport(id);
      setReport(res.report);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to retrieve patient report.');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Stethoscope size={14} className="text-blue-600" />
            Physician Portal
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Patient Reports &amp; Clinical Analysis
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Secure clinical records, longitudinal admission analytics, and diagnostic summaries.
          </p>
        </div>

        {selectedPatientId && (
          <button
            type="button"
            onClick={() => {
              setSelectedPatientId(null);
              setReport(null);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Patient Directory
          </button>
        )}
      </section>

      {/* DETAIL VIEW: Selected Patient Report */}
      {selectedPatientId ? (
        <section className="space-y-8">
          {loadingReport && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <LoaderCircle className="mx-auto animate-spin text-blue-600" size={32} />
              <p className="mt-3 font-semibold text-gray-900">Loading Clinical Report</p>
              <p className="mt-1 text-sm text-gray-500">Retrieving patient history, admissions, and diagnostic data...</p>
            </div>
          )}

          {reportError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
              <div className="flex gap-3">
                <AlertTriangle className="shrink-0 text-rose-600" size={20} />
                <div>
                  <h3 className="font-semibold text-rose-900">Unable to load patient report</h3>
                  <p className="mt-1 text-sm text-rose-700">{reportError}</p>
                  <button
                    type="button"
                    onClick={() => void handleSelectPatient(selectedPatientId)}
                    className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {report && !loadingReport && (
            <>
              {/* SECTION A: Patient Overview Card */}
              <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50/80 via-white to-gray-50/40 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-gray-900">{report.patient.name}</h2>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
                          ID #{report.patient.id}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          report.patient.source === 'KAGGLE'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-purple-200 bg-purple-50 text-purple-700'
                        }`}>
                          {report.patient.source === 'KAGGLE' ? 'Kaggle Dataset Record' : 'Demo Relational Record'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Facility / City: <span className="font-medium text-gray-700">{report.patient.city}</span>
                        {report.kaggleMetadata?.hospital && (
                          <> &bull; Hospital: <span className="font-medium text-gray-700">{report.kaggleMetadata.hospital}</span></>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {report.kaggleMetadata?.roomNumber && (
                        <div className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                          <span className="text-gray-400">Room:</span> <span className="font-semibold text-gray-800">{report.kaggleMetadata.roomNumber}</span>
                        </div>
                      )}
                      {report.kaggleMetadata?.admissionType && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-800">
                          <span className="text-blue-500">Admission:</span> <span className="font-semibold">{report.kaggleMetadata.admissionType}</span>
                        </div>
                      )}
                      {report.kaggleMetadata?.insuranceProvider && (
                        <div className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                          <span className="text-gray-400">Payer:</span> <span className="font-semibold text-gray-800">{report.kaggleMetadata.insuranceProvider}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4 lg:grid-cols-5">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Age</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{report.patient.age} yrs</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Gender</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{report.patient.gender}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Blood Group</p>
                    <p className="mt-1 text-xl font-bold text-red-600">{report.patient.bloodGroup}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Admissions</p>
                    <p className="mt-1 text-xl font-bold text-blue-600">{report.metrics.totalAdmissions}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-gray-50 p-4 sm:col-span-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Billed</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      ${report.metrics.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </article>

              {/* SECTION B: Diagnosis & Medical Analysis */}
              <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                  <Activity size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Diagnosis &amp; Medical Analysis</h3>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Primary Diagnosis</p>
                      <p className="mt-1 text-xl font-bold text-blue-700">{report.metrics.primaryCondition}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Latest Admission</p>
                        <p className="mt-0.5 font-medium text-gray-800">
                          {report.admissions[0]?.admissionDate || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Discharge Date</p>
                        <p className="mt-0.5 font-medium text-gray-800">
                          {report.admissions[0]?.dischargeDate || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {report.kaggleMetadata?.attendingDoctor && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Attending Physician</p>
                        <p className="mt-0.5 font-semibold text-gray-800">
                          Dr. {report.kaggleMetadata.attendingDoctor}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                    <h4 className="flex items-center gap-2 font-semibold text-blue-900">
                      <FileText size={16} className="text-blue-600" />
                      Factual Clinical Summary
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">
                      Patient <strong className="text-gray-900">{report.patient.name}</strong> ({report.patient.age}y, {report.patient.gender}, {report.patient.bloodGroup}) 
                      has <strong className="text-gray-900">{report.metrics.totalAdmissions}</strong> recorded hospital stay(s) with an average length of stay of <strong className="text-gray-900">{report.metrics.avgLengthOfStayDays} days</strong>.
                      Primary condition is documented as <strong className="text-blue-700">{report.metrics.primaryCondition}</strong>.
                      {report.prescriptions[0] && (
                        <> Active therapy recorded: <span className="font-semibold text-gray-900">{report.prescriptions[0].medicine}</span>.</>
                      )}
                      {report.labReports[0] && (
                        <> Diagnostic evaluation outcome: <span className="font-semibold text-gray-900">{report.labReports[0].result}</span>.</>
                      )}
                    </p>
                    <p className="mt-3 text-xs italic text-gray-500">
                      Note: Summary strictly derived from factual database entries without automated predictive diagnoses.
                    </p>
                  </div>
                </div>
              </article>

              {/* SECTION C: Visual Analytics */}
              <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                  <TrendingUp size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Clinical Analytics</h3>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Chart 1: Patient Billing by Episode */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="text-sm font-semibold text-gray-800">Patient Billing by Episode ($)</h4>
                    <p className="mt-0.5 text-xs text-gray-500">Individual billed amounts across recorded dates</p>
                    <div className="mt-4 h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.billing.slice(0, 10).reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="billDate" stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Billed']}
                          />
                          <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Dataset Condition Distribution */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="text-sm font-semibold text-gray-800">Dataset Condition Distribution</h4>
                    <p className="mt-0.5 text-xs text-gray-500">Prevalence of conditions across the hospital database</p>
                    <div className="mt-4 h-64 w-full">
                      {analytics?.conditionDistribution ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.conditionDistribution.slice(0, 6)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                            <YAxis dataKey="condition" type="category" stroke="#9ca3af" fontSize={11} width={90} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              formatter={(val) => [Number(val).toLocaleString(), 'Patients']}
                            />
                            <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          Loading analytics data...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              {/* SECTION D: Medical History Tables */}
              <article className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recorded Medical History</h3>
                  <p className="mt-1 text-sm text-gray-500">Chronological inpatient admissions and diagnostic evaluations</p>
                </div>

                {/* Admissions Table */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Admissions ({report.admissions.length})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Admission Date</th>
                          <th className="px-4 py-3">Discharge Date</th>
                          <th className="px-4 py-3">Diagnosis</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Length of Stay</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {report.admissions.map((adm) => (
                          <tr key={adm.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{adm.admissionDate}</td>
                            <td className="px-4 py-3 text-gray-600">{adm.dischargeDate || '—'}</td>
                            <td className="px-4 py-3 font-medium text-blue-700">{adm.diagnosis}</td>
                            <td className="px-4 py-3 text-gray-600">{adm.department}</td>
                            <td className="px-4 py-3 text-gray-600">{adm.lengthOfStayDays} days</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                {adm.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Prescriptions & Lab Reports Dual Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Prescriptions */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Pill size={14} className="text-blue-500" /> Prescriptions ({report.prescriptions.length})
                    </h4>
                    {report.prescriptions.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                        No prescription records available for this patient.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500">
                            <tr>
                              <th className="px-3 py-2.5">Medicine</th>
                              <th className="px-3 py-2.5">Dosage</th>
                              <th className="px-3 py-2.5">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {report.prescriptions.map((p) => (
                              <tr key={p.id}>
                                <td className="px-3 py-2.5 font-medium text-gray-900">{p.medicine}</td>
                                <td className="px-3 py-2.5 text-gray-600">{p.dosage}</td>
                                <td className="px-3 py-2.5 text-gray-500">{p.prescriptionDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Lab Reports */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <FlaskConical size={14} className="text-teal-500" /> Lab Evaluations ({report.labReports.length})
                    </h4>
                    {report.labReports.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                        No laboratory evaluations recorded for this patient.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500">
                            <tr>
                              <th className="px-3 py-2.5">Test</th>
                              <th className="px-3 py-2.5">Result</th>
                              <th className="px-3 py-2.5">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {report.labReports.map((l) => (
                              <tr key={l.id}>
                                <td className="px-3 py-2.5 font-medium text-gray-900">{l.testName}</td>
                                <td className="px-3 py-2.5 font-semibold text-gray-800">{l.result}</td>
                                <td className="px-3 py-2.5 text-gray-500">{l.reportDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </article>

              {/* SECTION E: Dataset Limitations Callout */}
              <aside className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-sm">
                <div className="flex gap-3">
                  <Info size={20} className="shrink-0 text-amber-600" />
                  <div>
                    <h4 className="font-semibold text-amber-900">Clinical Data Provenance &amp; Transparency</h4>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      The records above originate from the Kaggle Healthcare Dataset and local normalized hospital schemas.
                      Fields such as longitudinal vitals tracking, granular nursing notes, and outpatient follow-ups are omitted by the source dataset.
                      All displayed metrics reflect verifiable database records without simulated diagnostic speculation.
                    </p>
                  </div>
                </div>
              </aside>
            </>
          )}
        </section>
      ) : (
        /* DIRECTORY VIEW: Patient Directory & Search */
        <section className="space-y-6">
          {/* Search Box Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient directory by name (e.g., Aaron, Smith, Patel)..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Search size={16} />
                Search Directory
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                    void loadPatients('', 1);
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Patient Directory Results */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="font-semibold text-gray-900">Patient Directory</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Showing {patients.length} of {totalPatients.toLocaleString()} registered patient records
                </p>
              </div>

              {/* Pagination Top */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loadingList}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loadingList}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {loadingList ? (
              <div className="p-12 text-center">
                <LoaderCircle className="mx-auto animate-spin text-blue-600" size={28} />
                <p className="mt-2 text-sm font-medium text-gray-600">Loading patients...</p>
              </div>
            ) : listError ? (
              <div className="p-8 text-center text-sm text-rose-600">{listError}</div>
            ) : patients.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                No patients found matching &quot;{search}&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Patient Name</th>
                      <th className="px-4 py-3">Age / Gender</th>
                      <th className="px-4 py-3">Blood</th>
                      <th className="px-4 py-3">Primary Condition</th>
                      <th className="px-4 py-3">Admissions</th>
                      <th className="px-4 py-3">Latest Stay</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {patients.map((p) => (
                      <tr key={p.patientId} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.city}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">
                          {p.age} yrs &bull; {p.gender}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-red-600">
                          {p.bloodGroup}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {p.primaryCondition}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-800">
                          {p.admissionCount}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {p.latestAdmissionDate || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => void handleSelectPatient(p.patientId)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <FileText size={14} />
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
