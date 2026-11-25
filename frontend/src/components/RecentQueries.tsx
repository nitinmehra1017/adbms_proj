import { Clock3, Trash2 } from 'lucide-react';
import type { SessionQuery } from '../hooks/useSessionQueryHistory';

type Props = {
  history: SessionQuery[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
};

export function RecentQueries({ history, selectedId, onSelect, onClear }: Props) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 size={17} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900">Recent queries</h2>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-rose-500"
          >
            <Trash2 size={14} />
            Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-5 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">No queries yet</p>
          <p className="mt-1 leading-5 text-gray-500">Your successful AI queries will appear here.</p>
        </div>
      ) : (
        <div className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-1">
          {[...history].reverse().map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                entry.id === selectedId
                  ? 'bg-blue-50 font-medium text-blue-700 ring-1 ring-blue-300'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="line-clamp-2 leading-5">{entry.response.question}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
