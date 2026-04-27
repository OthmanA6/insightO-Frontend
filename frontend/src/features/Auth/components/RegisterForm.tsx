import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  IdCard,
  GraduationCap,
  Building2,
  ShieldCheck,
  ChevronDown,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MailCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  registerSchema,
  otpSchema,
  type RegisterFormData,
  type OtpFormData,
} from '../schemas/auth.schema';
import {
  clearError,
  setPendingOtpState,
  clearPendingOtpState,
  setAuthenticatedSession,
} from '../slices/authSlice';
import * as authService from '../api/authService';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { USER_ROLES, type RegisterPayload } from '../types';
import type { AxiosError } from 'axios';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  HEAD_OF_DEP: 'Head of Department',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
};

const OTP_COUNTDOWN = 60;

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

const buildRegisterPayload = (data: RegisterFormData): RegisterPayload => {
  const trimmedDepartmentId = data.departmentId?.trim();
  const parsedAcademicYear = Number(data.academicYear);

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    nationalId: data.nationalId,
    role: data.role,
    ...(data.role !== 'ADMIN' && trimmedDepartmentId ? { departmentId: trimmedDepartmentId } : {}),
    ...(data.role === 'STUDENT' && !Number.isNaN(parsedAcademicYear)
      ? { academicYear: parsedAcademicYear }
      : {}),
  };
};

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

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, isError, errorMessage, pendingEmail } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const timer = useCountdown(OTP_COUNTDOWN);

  // ── Step 1: Account form ──────────────────────────────────────────────────
  const step1Form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: undefined, departmentId: '', academicYear: '' },
  });
  const selectedRole = step1Form.watch('role');

  // ── Step 2: OTP form ──────────────────────────────────────────────────────
  const step2Form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (isError && errorMessage) {
      toast.error(errorMessage);
      dispatch(clearError());
    }
  }, [isError, errorMessage, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearPendingOtpState());
    };
  }, [dispatch]);

  // ── Step 1 submit → send OTP ──────────────────────────────────────────────
  const onStep1Submit = async (data: RegisterFormData) => {
    setIsSendingOtp(true);
    try {
      const payload = buildRegisterPayload(data);
      const response = await authService.registerStep1(payload);
      const normalizedEmail = (response.email || data.email).trim().toLowerCase();
      setFormData(data);
      setOtpEmail(normalizedEmail);
      dispatch(setPendingOtpState({ email: normalizedEmail, flowType: 'register' }));
      setStep(2);
      timer.start();
      toast.success('OTP sent to your email');
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      const message = error.response?.data?.message;
      const details = error.response?.data?.error;
      const duplicateNationalId = details?.includes('nationalId_1');
      const duplicateEmail = details?.includes('email_1');
      toast.error(
        duplicateNationalId
          ? 'This national ID is already registered'
          : duplicateEmail
            ? 'This email is already registered'
            : message === 'Server error during registration' && details
          ? details
          : message || 'Failed to register',
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!formData || timer.seconds > 0) return;
    setIsSendingOtp(true);
    try {
      await authService.forgotPasswordSendOtp(otpEmail || formData.email.trim().toLowerCase());
      timer.start();
      step2Form.reset();
      toast.success('New code sent');
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to resend code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Step 2 submit → verify OTP → register ────────────────────────────────
  const onStep2Submit = async (data: OtpFormData) => {
    if (!formData) return;
    setIsVerifying(true);
    try {
      const normalizedOtp = data.otp.trim().replace(/\s+/g, '');
      const response = await authService.verifyRegisterOtp(
        (pendingEmail || otpEmail || formData.email).trim().toLowerCase(),
        normalizedOtp,
      );
      dispatch(setAuthenticatedSession(response));
      dispatch(clearPendingOtpState());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-3.5 pl-12 pr-4 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm';

  const busy = isSendingOtp || isVerifying || isLoading;

  return (
    <>
      {/* ── Stepper ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm border-2 border-primary transition-all">
              1
            </div>
            <span className="text-[10px] font-bold mt-2 text-primary uppercase tracking-wider">
              Account
            </span>
          </div>

          <div className="flex-1 h-1 mx-3 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: step >= 2 ? '100%' : '0%' }}
            />
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                step >= 2
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-100 dark:bg-surface-dark text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              2
            </div>
            <span
              className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-all ${
                step >= 2 ? 'text-primary' : 'text-slate-400'
              }`}
            >
              Verify
            </span>
          </div>
        </div>
      </div>

      {/* ── Step 1: Account Info ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Fill in your details to join the platform.
            </p>
          </div>

          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  First Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input type="text" placeholder="John" className={inputClass} {...step1Form.register('firstName')} />
                </div>
                {step1Form.formState.errors.firstName && (
                  <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Last Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input type="text" placeholder="Doe" className={inputClass} {...step1Form.register('lastName')} />
                </div>
                {step1Form.formState.errors.lastName && (
                  <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Work Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input type="email" placeholder="name@company.com" autoComplete="email" className={inputClass} {...step1Form.register('email')} />
              </div>
              {step1Form.formState.errors.email && (
                <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.email.message}</p>
              )}
            </div>

            {/* National ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                National ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <IdCard className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input type="text" inputMode="numeric" placeholder="Enter your national ID number" className={inputClass} {...step1Form.register('nationalId')} />
              </div>
              {step1Form.formState.errors.nationalId && (
                <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.nationalId.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Role
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select className={`${inputClass} appearance-none cursor-pointer`} defaultValue="" {...step1Form.register('role')}>
                  <option value="" disabled>Select your role</option>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="size-5 text-slate-400" />
                </div>
              </div>
              {step1Form.formState.errors.role && (
                <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.role.message}</p>
              )}
            </div>

            {/* Department (conditional) */}
            {selectedRole && selectedRole !== 'ADMIN' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Department</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input type="text" placeholder="Enter department ID" className={inputClass} {...step1Form.register('departmentId')} />
                </div>
                {step1Form.formState.errors.departmentId && (
                  <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.departmentId.message}</p>
                )}
              </div>
            )}

            {/* Academic Year (conditional) */}
            {selectedRole === 'STUDENT' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Academic Year</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input type="number" min={1} max={6} placeholder="e.g. 3" className={inputClass} {...step1Form.register('academicYear')} />
                </div>
                {step1Form.formState.errors.academicYear && (
                  <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.academicYear.message}</p>
                )}
              </div>
            )}

            {/* Password Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input type="password" placeholder="••••••••" autoComplete="new-password" className={inputClass} {...step1Form.register('password')} />
                </div>
                {step1Form.formState.errors.password && (
                  <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input type="password" placeholder="••••••••" autoComplete="new-password" className={inputClass} {...step1Form.register('confirmPassword')} />
                </div>
                {step1Form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 ml-1">{step1Form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSendingOtp ? (
                <><Loader2 className="size-5 animate-spin" /> Sending verification code…</>
              ) : (
                <><span>Continue to Verification</span><ArrowRight className="size-5" /></>
              )}
            </button>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      )}

      {/* ── Step 2: OTP Verification ─────────────────────────────────── */}
      {step === 2 && formData && (
        <div className="animate-fade-in">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <MailCheck className="size-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Check your inbox
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We&apos;ve sent a 6-digit secure code to{' '}
              <strong className="text-slate-900 dark:text-white">{formData.email}</strong>.
            </p>
          </div>

          <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Security Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="------"
                className="w-full bg-slate-50 dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 focus:border-primary dark:focus:border-primary rounded-lg py-4 px-4 text-2xl font-bold outline-none transition-all text-slate-900 dark:text-white shadow-sm text-center tracking-[0.5em]"
                {...step2Form.register('otp')}
              />
              {step2Form.formState.errors.otp && (
                <p className="text-xs text-red-500 ml-1">{step2Form.formState.errors.otp.message}</p>
              )}
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between px-1">
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="size-4" />
                Code expires in{' '}
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {timer.formatted}
                </span>
              </div>
              <button
                type="button"
                disabled={timer.seconds > 0 || isSendingOtp}
                onClick={handleResend}
                className={`text-sm font-bold transition-colors ${
                  timer.seconds > 0 || isSendingOtp
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-primary hover:text-primary-hover cursor-pointer'
                }`}
              >
                {isSendingOtp ? 'Sending…' : 'Resend Code'}
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  dispatch(clearPendingOtpState());
                  setStep(1);
                }}
                disabled={busy}
                className="px-6 py-4 bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isVerifying || isLoading ? (
                  <><Loader2 className="size-5 animate-spin" /> Verifying…</>
                ) : (
                  'Verify & Register'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
