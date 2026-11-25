import { ClipboardList, Database, FileText, LayoutDashboard, LogOut, Menu, Pill, ShieldCheck, Stethoscope, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ApplicationShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('Unable to sign out right now. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const closeMenu = () => setMenuOpen(false);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Database size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold leading-5 text-gray-900">Healthcare AI</p>
          <p className="text-xs text-gray-500">Database Assistant</p>
        </div>
      </div>

      <nav aria-label="Application navigation" className="mt-8 space-y-1">
        <NavLink to="/dashboard" onClick={closeMenu} className={navClass}>
          <LayoutDashboard size={17} />
          Assistant workspace
        </NavLink>
        {user?.role === 'DOCTOR' && (
          <NavLink to="/doctor/reports" onClick={closeMenu} className={navClass}>
            <FileText size={17} />
            Patient reports
          </NavLink>
        )}
        {user?.role === 'DOCTOR' && (
          <NavLink to="/doctor/prescriptions" onClick={closeMenu} className={navClass}>
            <Stethoscope size={17} />
            Prescriptions
          </NavLink>
        )}
        {user?.role === 'PHARMACY' && (
          <NavLink to="/pharmacy" onClick={closeMenu} className={navClass}>
            <Pill size={17} />
            Pharmacy
          </NavLink>
        )}
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin/audit" onClick={closeMenu} className={navClass}>
            <ClipboardList size={17} />
            AI query audit
          </NavLink>
        )}
      </nav>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-700">
        <div className="flex items-center gap-2 font-medium text-blue-800">
          <ShieldCheck size={16} className="text-blue-600" />
          Authenticated workspace
        </div>
        <p className="mt-1 text-xs leading-5 text-blue-600/80">Backend-controlled access</p>
      </div>

      <p className="mt-auto text-xs leading-5 text-gray-400">
        Advanced DBMS project
        <br />
        Healthcare data platform
      </p>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="fixed inset-y-0 left-0 hidden lg:block">
        {sidebar}
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <div className="relative z-10 h-full">
            {sidebar}
            <button
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
              className="absolute right-4 top-5 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="flex min-h-16 items-center justify-between border-b border-gray-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-900">Healthcare data workspace</p>
              <p className="text-xs text-gray-500">Secure backend session</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm text-gray-700">{user?.email}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{user?.role}</p>
            </div>
            <button
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60"
            >
              <LogOut size={16} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>

        {logoutError && (
          <p
            role="alert"
            className="mx-5 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 sm:mx-8"
          >
            {logoutError}
          </p>
        )}

        <main className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
