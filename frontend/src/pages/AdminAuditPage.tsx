import { AlertTriangle, ChevronDown, ChevronUp, ClipboardList, LoaderCircle, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { getAiQueryAuditLogs } from '../services/audit';
import type { AiQueryAuditRecord, AiQueryAuditStatus } from '../types/audit';

const statusStyles: Record<AiQueryAuditStatus, string> = {
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  VALIDATION_REJECTED: 'border-amber-200 bg-amber-50 text-amber-700',
  GEMINI_UNAVAILABLE: 'border-purple-200 bg-purple-50 text-purple-700',
  EXECUTION_FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  SYSTEM_ERROR: 'border-rose-200 bg-rose-50 text-rose-700'
};

export function AdminAuditPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AiQueryAuditRecord[]>([]);
  const [status, setStatus] = useState<AiQueryAuditStatus | 'ALL'>('ALL');
  const [user, setUser] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAiQueryAuditLogs();
      setRecords(response.auditLogs);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await refresh();
        navigate('/login', { replace: true });
        return;
      }
      if (requestError instanceof ApiError && requestError.status === 403) {
        setError('Your account is not authorized to view AI query audit records.');
        return;
      }
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the AI query audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAuditRecords();
  }, []);

  const users = useMemo(() => Array.from(new Set(records.map((record) => record.email))).sort(), [records]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter(
      (record) =>
        (status === 'ALL' || record.executionStatus === status) &&
        (user === 'ALL' || record.email === user) &&
        (!term || record.question.toLowerCase().includes(term) || record.generatedSql?.toLowerCase().includes(term))
    );
  }, [records, search, status, user]);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.18em] text-blue-600 uppercase">Security &amp; Auditability</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">AI Query Audit</h1>
          <p className="mt-2 text-base leading-7 text-gray-500">
            Review authenticated assistant-query attempts, their safe execution status, and the resulting read-only database activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAuditRecords()}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={19} />
          <div>
            <p className="font-medium text-blue-900">Administrator-only security record</p>
            <p className="mt-1 leading-6 text-blue-700">
              Entries are created by the backend after authenticated AI query processing. This page is read-only.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <label className="relative block md:col-span-2 xl:col-span-1">
            <span className="sr-only">Search audit records</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Search question or generated SQL"
              className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AiQueryAuditStatus | 'ALL')}
              className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All statuses</option>
              {Object.keys(statusStyles).map((value) => (
                <option key={value} value={value}>
                  {formatStatus(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            User
            <select
              value={user}
              onChange={(event) => setUser(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All users</option>
              {users.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!loading && !error && (
          <p className="mt-4 text-sm text-gray-500">
            Showing {filteredRecords.length} of {records.length} record{records.length === 1 ? '' : 's'}.
          </p>
        )}
      </section>

      {loading && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <LoaderCircle className="mx-auto animate-spin text-blue-500" size={27} />
          <p className="mt-3 font-medium text-gray-900">Loading AI query audit records</p>
          <p className="mt-1 text-sm text-gray-500">Retrieving the backend security audit trail.</p>
        </section>
      )}

      {error && (
        <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-rose-500" size={19} />
            <div>
              <h2 className="font-semibold text-rose-900">Unable to load audit records</h2>
              <p className="mt-1 text-sm leading-6 text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => void loadAuditRecords()}
                className="mt-4 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50"
              >
                Try again
              </button>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && filteredRecords.length === 0 && (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <ClipboardList className="mx-auto text-gray-400" size={28} />
          <h2 className="mt-3 font-medium text-gray-900">No matching audit records</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Adjust the filters or search terms to review other authenticated AI queries.
          </p>
        </section>
      )}

      {!loading && !error && filteredRecords.length > 0 && (
        <section className="space-y-3">
          {filteredRecords.map((record) => (
            <AuditRecord
              key={record.id}
              record={record}
              expanded={expanded === record.id}
              onToggle={() => setExpanded((current) => (current === record.id ? null : record.id))}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function AuditRecord({
  record,
  expanded,
  onToggle
}: {
  record: AiQueryAuditRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles[record.executionStatus]}`}>
              {formatStatus(record.executionStatus)}
            </span>
            {record.queryType && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                {record.queryType}
              </span>
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-gray-900">{record.email}</p>
          <p className="mt-1 text-xs text-gray-500">{formatTimestamp(record.createdAt)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <Metric label="Rows" value={record.rowCount ?? '—'} />
          <Metric label="Execution" value={record.executionTimeMs === null ? '—' : `${record.executionTimeMs} ms`} />
          <Metric label="Record" value={`#${record.id}`} />
        </dl>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Question</p>
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800 ${expanded ? '' : 'line-clamp-2'}`}>
          {record.question}
        </p>

        {record.generatedSql && (
          <>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-gray-500">Generated SQL</p>
            <pre
              className={`mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-6 text-gray-800 ${
                expanded ? '' : 'max-h-24 overflow-y-hidden'
              }`}
            >
              <code>{record.generatedSql}</code>
            </pre>
          </>
        )}

        {!record.generatedSql && (
          <p className="mt-4 text-sm italic text-gray-400">No SQL was generated before this attempt ended.</p>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Show less' : 'View details'}
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
}
