import { useCallback, useState } from 'react';
import type { AssistantResponse } from '../types/assistant';

export const MAX_SESSION_QUERY_HISTORY = 20;

export type SessionQuery = {
  id: string;
  response: AssistantResponse;
};

export function createSessionQuery(response: AssistantResponse): SessionQuery {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    response
  };
}

export function addSessionQuery(history: SessionQuery[], entry: SessionQuery) {
  return [...history, entry].slice(-MAX_SESSION_QUERY_HISTORY);
}

export function useSessionQueryHistory() {
  const [history, setHistory] = useState<SessionQuery[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const add = useCallback((response: AssistantResponse) => {
    const entry = createSessionQuery(response);
    setHistory((current) => addSessionQuery(current, entry));
    setSelectedId(entry.id);
  }, []);
  const clear = useCallback(() => {
    setHistory([]);
    setSelectedId(null);
  }, []);
  const selected = history.find((entry) => entry.id === selectedId) ?? null;

  return { history, selected, selectedId, add, select: setSelectedId, clear };
}
