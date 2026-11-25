import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FullPageState } from './FullPageState';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, error, refresh } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageState loading title="Checking your session" message="Verifying your secure backend session." />;
  if (status === 'unavailable') return <FullPageState title="Backend unavailable" message={error ?? undefined} action={{ label: 'Try again', onClick: () => void refresh() }} />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
