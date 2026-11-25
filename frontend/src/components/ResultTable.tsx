import type { AssistantQueryResult } from '../types/assistant';

export function ResultTable({ result }: { result: AssistantQueryResult }) {
  if (result.rowCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        The query completed successfully but returned no rows.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
          <tr>
            {result.columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="transition-colors hover:bg-gray-50">
              {result.columns.map((column) => (
                <td key={column} className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
