import { AlertTriangle, LoaderCircle } from 'lucide-react';

type Props = {
  title: string;
  message?: string;
  loading?: boolean;
  action?: { label: string; onClick: () => void };
};

export function FullPageState({ title, message, loading = false, action }: Props) {
  const Icon = loading ? LoaderCircle : AlertTriangle;

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6 py-12 text-gray-900">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg shadow-gray-200/50">
        <div
          className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ${
            loading ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'
          }`}
        >
          <Icon className={loading ? 'animate-spin' : ''} size={28} />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h1>

        {message && (
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {message}
          </p>
        )}

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {action.label}
          </button>
        )}
      </section>
    </main>
  );
}
