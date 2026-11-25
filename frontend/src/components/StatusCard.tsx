import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react';

type Props = { label: string; loading: boolean; connected: boolean; message?: string };

export function StatusCard({ label, loading, connected, message }: Props) {
  const Icon = loading ? LoaderCircle : connected ? CheckCircle2 : XCircle;
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon
          className={
            loading
              ? 'animate-spin text-blue-500'
              : connected
                ? 'text-emerald-600'
                : 'text-rose-600'
          }
          size={22}
        />
        <div>
          <h2 className="font-semibold text-gray-900">
            {label}: {loading ? 'Checking…' : connected ? 'Connected ✓' : 'Unavailable'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Contacting the live service.' : message}
          </p>
        </div>
      </div>
    </article>
  );
}
