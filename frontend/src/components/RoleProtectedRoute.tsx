import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type Props = {
  role: string;
  children: ReactNode;
};

/**
 * This is a UX guard only. The API independently enforces ADMIN access.
 */
export function RoleProtectedRoute({ role, children }: Props) {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace state={{ accessDenied: true }} />;
  }

  return <>{children}</>;
}
