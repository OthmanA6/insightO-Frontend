import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { loginUser, clearError } from '../slices/authSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, isError, errorMessage } = useAppSelector(
    (s) => s.auth,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isError && errorMessage) {
      toast.error(errorMessage);
      dispatch(clearError());
    }
  }, [isError, errorMessage, dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Sign in to your dashboard
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Enter your details to access your enterprise account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Email ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            Work Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 pl-12 pr-4 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>
          )}
        </div>

        {/* ── Password ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 pl-12 pr-4 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 ml-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* ── Remember me / Forgot password ──────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark accent-primary cursor-pointer"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-bold text-primary hover:text-primary-hover hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* ── Submit ──────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign In
              <LogIn className="size-5" />
            </>
          )}
        </button>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-bg-dark px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Or continue with
            </span>
          </div>
        </div>

        {/* ── SSO Button ─────────────────────────────────────────── */}
        <button
          type="button"
          className="w-full py-3.5 bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.7 17.58V20.34H19.27C21.36 18.42 22.56 15.6 22.56 12.25Z"
              fill="#4285F4"
            />
            <path
              d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.7 17.58C14.72 18.24 13.46 18.66 12 18.66C9.18 18.66 6.78 16.75 5.91 14.19H2.22V17.06C4.02 20.62 7.73 23 12 23Z"
              fill="#34A853"
            />
            <path
              d="M5.91 14.19C5.69 13.52 5.56 12.78 5.56 12C5.56 11.22 5.69 10.48 5.91 9.81V6.94H2.22C1.48 8.42 1.05 10.15 1.05 12C1.05 13.85 1.48 15.58 2.22 17.06L5.91 14.19Z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.34C13.62 5.34 15.07 5.89 16.21 6.98L19.34 3.85C17.45 2.09 14.97 1 12 1C7.73 1 4.02 3.38 2.22 6.94L5.91 9.81C6.78 7.25 9.18 5.34 12 5.34Z"
              fill="#EA4335"
            />
          </svg>
          Single Sign-On (SSO)
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
          Don&apos;t have an enterprise account?{' '}
          <Link
            to="/register"
            className="text-primary font-bold hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </form>
    </>
  );
}
