import { Database, Server } from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { getBackendHealth, getDatabaseHealth } from '../services/health';

export function HomePage() {
  const backend = useHealthCheck(getBackendHealth);
  const database = useHealthCheck(getDatabaseHealth);

  return (
    <>
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm md:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-600">
          Project Foundation
        </p>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Generative AI Healthcare Database Assistant
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-gray-600">
          The application foundation is running. These statuses are fetched live from the Express API
          and its MySQL connection check.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
          Live connection status
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatusCard
            label="Backend"
            loading={backend.loading}
            connected={backend.data?.status === 'ok'}
            message={backend.data?.message ?? backend.error}
          />
          <StatusCard
            label="Database"
            loading={database.loading}
            connected={database.data?.status === 'ok'}
            message={database.data?.message ?? database.error}
          />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-sm shadow-sm text-gray-600">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Server size={18} className="text-blue-600" />
          What is active
        </div>
        <p className="mt-2">
          Express health endpoint and MySQL reachability check only. No application features or
          sample data are displayed at this stage.
        </p>
      </section>
    </>
  );
}
