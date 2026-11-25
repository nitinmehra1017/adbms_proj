import { Database, LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';

export function LoginPage() {
  const { user, status, error: serviceError, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    if (user?.role === 'PHARMACY') {
      return <Navigate to="/pharmacy" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const loggedIn = await login(normalizedEmail, password);
      if (from === '/' && loggedIn.role === 'PHARMACY') {
        navigate('/pharmacy', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.isNetworkError
          ? 'The backend is unavailable. Check the API and try again.'
          : 'Unable to sign in. Check your email and password.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const DEMO_ACCOUNTS = [
    { label: 'Admin', email: 'admin@hospital.test', color: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100' },
    { label: 'Doctor', email: 'doctor@hospital.test', color: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { label: 'Pharmacy', email: 'pharmacy@hospital.test', color: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100' },
    { label: 'Staff', email: 'staff@hospital.test', color: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  ];


  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50/40 px-5 py-8 text-gray-900 sm:grid sm:place-items-center sm:p-8">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-900/5 lg:grid-cols-[1.08fr_0.92fr]">
        {/* Left Panel: Healthcare Workspace Branding */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-teal-700 p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white shadow-sm backdrop-blur-sm">
              <Database size={21} />
            </span>
            <span className="font-semibold tracking-wide text-white">Healthcare AI Database Assistant</span>
          </div>

          <div className="my-auto max-w-md py-12">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100 backdrop-blur-sm">
              Secure Data Workspace
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white leading-tight">
              Healthcare data, responsibly accessible.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-blue-100/90">
              Ask questions about clinical workflows, patient analytics, and healthcare data using natural language.
              Access is authenticated through the secure backend before any protected workspace is shown.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-blue-100/90">
            <ShieldCheck size={18} className="text-teal-300" />
            <span>Secure cookie-based session</span>
          </div>
        </div>

        {/* Right Panel: Sign In Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 text-blue-600">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Database size={20} />
              </span>
              <span className="font-semibold text-gray-900">Healthcare AI Database Assistant</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Secure access to your healthcare data workspace.
            </p>
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Sign In</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Welcome to your healthcare workspace</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Sign in with your authorized hospital credentials.
            </p>
          </div>

          {(error || serviceError) && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error ?? serviceError}
            </div>
          )}

          {/* Quick-fill Demo Account Pills */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
            <p className="text-xs font-semibold text-gray-500 mb-2">Quick Sign-in (Demo Accounts):</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Demo@123');
                    setError(null);
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition text-center shadow-sm ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="name@hospital.test"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter your password"
              />
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={17} />
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
            <LockKeyhole size={14} className="shrink-0 text-gray-400" />
            <span>Your browser session is secured by the backend.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
