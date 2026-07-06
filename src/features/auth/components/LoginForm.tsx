import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { loginUser, clearError } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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
        <h2 className="text-3xl font-bold text-slate-900 dark:text-content mb-2">
          Sign in to your dashboard
        </h2>
        <p className="text-content-muted dark:text-content-muted">
          Enter your details to access your enterprise account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Email ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-content-muted ms-1">
            Work Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
              <Mail className="size-5 text-content-muted group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 ps-12 pe-4 outline-none transition-all text-slate-900 dark:text-content placeholder:text-content-muted shadow-sm"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 ms-1">{errors.email.message}</p>
          )}
        </div>

        {/* ── Password ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ms-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-content-muted">
              Password
            </label>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
              <Lock className="size-5 text-content-muted group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 ps-12 pe-12 outline-none transition-all text-slate-900 dark:text-content placeholder:text-content-muted shadow-sm"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-4 flex items-center text-content-muted hover:text-slate-600 dark:hover:text-content transition-colors"
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 ms-1">
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
            <span className="text-sm text-slate-600 dark:text-content-muted group-hover:text-slate-900 dark:group-hover:text-content transition-colors">
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
          className="w-full py-4 bg-primary hover:bg-primary-hover text-content font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
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


        <p className="text-center text-sm text-slate-600 dark:text-content-muted pt-2">
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
