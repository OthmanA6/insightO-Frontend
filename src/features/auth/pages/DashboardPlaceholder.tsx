import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '../store/authSlice';

export default function DashboardPlaceholder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/logo.svg" alt="InsightO Logo" className="h-12 w-12 object-contain drop-shadow-md" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-content tracking-tight">
            insightO
          </h1>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 text-green-500 flex items-center justify-center">
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-content">
            Welcome, {user.firstName}!
          </h2>
          <p className="text-content-muted dark:text-content-muted text-sm">
            You are signed in as{' '}
            <span className="font-semibold text-primary">{user.role}</span>.
            <br />
            Dashboard coming soon.
          </p>

          <button
            onClick={handleLogout}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-panel-hover hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-content-muted font-bold rounded-xl transition-all"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
