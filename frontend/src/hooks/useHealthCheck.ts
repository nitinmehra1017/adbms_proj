import { useEffect, useState } from 'react';
import type { HealthResponse } from '../services/health';

type HealthState = { loading: boolean; data?: HealthResponse; error?: string };

export function useHealthCheck(check: () => Promise<HealthResponse>) {
  const [state, setState] = useState<HealthState>({ loading: true });
  useEffect(() => {
    let active = true;
    check()
      .then((data) => active && setState({ loading: false, data }))
      .catch((error: Error) => active && setState({ loading: false, error: error.message }));
    return () => { active = false; };
  }, [check]);
  return state;
}
