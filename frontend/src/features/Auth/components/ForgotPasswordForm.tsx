import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft, Clock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from '../schemas/auth.schema';
import * as authService from '../api/authService';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearPendingOtpState, setPendingOtpState } from '../slices/authSlice';

const OTP_COUNTDOWN = 60;

function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const start = useCallback(() => {
    setSeconds(initial);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initial]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, formatted, start };
}

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { pendingEmail } = useAppSelector((s) => s.auth);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const timer = useCountdown(OTP_COUNTDOWN);

  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    return () => {
      dispatch(clearPendingOtpState());
    };
  }, [dispatch]);

  const onSendOtp = async (data: ForgotPasswordFormData) => {
    setIsSending(true);
    try {
      const response = await authService.forgotPasswordSendOtp(data.email);
      const resolvedEmail = response.email || data.email;
      setEmail(resolvedEmail);
      dispatch(setPendingOtpState({ email: resolvedEmail, flowType: 'reset' }));
      setStep(2);
      timer.start();
      toast.success('OTP sent to your email');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  const onResend = async () => {
    if (timer.seconds > 0 || !email) return;
    setIsSending(true);
    try {
      await authService.forgotPasswordSendOtp(email);
      timer.start();
      resetForm.setValue('otp', '');
      toast.success('New OTP sent');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsSending(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    setIsResetting(true);
    try {
      await authService.resetPasswordWithOtp({
        email: pendingEmail || email,
        otp: data.otp,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      dispatch(clearPendingOtpState());
      toast.success('Password reset successful. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {step === 1 && (
        <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="space-y-5">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your email and we&apos;ll send a 6-digit OTP.
            </p>
          </div>

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
                autoComplete="email"
                placeholder="name@company.com"
                className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 pl-12 pr-4 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                {...emailForm.register('email')}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="text-xs text-red-500 ml-1">{emailForm.formState.errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter the OTP sent to <strong>{pendingEmail || email}</strong> and set your new password.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">OTP Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="------"
              className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-4 px-4 text-2xl font-bold outline-none transition-all text-slate-900 dark:text-white shadow-sm text-center tracking-[0.5em]"
              {...resetForm.register('otp')}
            />
            {resetForm.formState.errors.otp && (
              <p className="text-xs text-red-500 ml-1">{resetForm.formState.errors.otp.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="size-4" />
              Code expires in <span className="font-bold font-mono">{timer.formatted}</span>
            </div>
            <button
              type="button"
              onClick={onResend}
              disabled={timer.seconds > 0 || isSending}
              className={`text-sm font-bold transition-colors ${
                timer.seconds > 0 || isSending
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'text-primary hover:text-primary-hover cursor-pointer'
              }`}
            >
              {isSending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 pl-12 pr-4 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                {...resetForm.register('password')}
              />
            </div>
            {resetForm.formState.errors.password && (
              <p className="text-xs text-red-500 ml-1">{resetForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 pl-12 pr-4 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                {...resetForm.register('confirmPassword')}
              />
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 ml-1">{resetForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                dispatch(clearPendingOtpState());
                setStep(1);
              }}
              className="px-6 py-4 bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={isResetting}
              className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {isResetting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
