import api from '@/shared/api/axiosInstance';
import type { AxiosError } from 'axios';
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  ApiMessage,
  OtpStepResponse,
  User,
  PendingUser,
  ApprovePendingUserPayload,
  ChangePasswordPayload,
} from '../types';

export const login = async (
  credentials: LoginPayload,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/login', credentials);
  return response.data;
};

export const registerStep1 = async (
  userData: RegisterPayload,
): Promise<OtpStepResponse> => {
  const response = await api.post<OtpStepResponse>('/register', userData);
  return response.data;
};

export const verifyRegisterOtp = async (
  email: string,
  otp: string,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/register/verify', { email, otp });
    return response.data;
  } catch (err) {
    const error = err as AxiosError<{ error?: string; message?: string }>;
    const serverMessage = error.response?.data?.error || error.response?.data?.message || '';
    const isRouteMissing = error.response?.status === 404 || /route not found/i.test(serverMessage);

    if (!isRouteMissing) {
      throw err;
    }

    const legacyResponse = await api.post<AuthResponse>('/verifyOTP', { email, otp });
    return legacyResponse.data;
  }
};

export const forgotPasswordSendOtp = async (
  email: string,
): Promise<OtpStepResponse> => {
  const response = await api.post<OtpStepResponse>('/forgotPassword', { email });
  return response.data;
};

export const resetPasswordWithOtp = async (payload: {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}): Promise<ApiMessage> => {
  const response = await api.patch<ApiMessage>('/resetPassword', payload);
  return response.data;
};

// ── Endpoint: GET /profile ────────────────────────────────────────────────────
export const getProfile = async (): Promise<User> => {
  const response = await api.get<{ status: string; user: User }>('/profile');
  return response.data.user;
};

// ── Endpoint: PUT /profile  (JSON update — name, email) ──────────────────────
export const updateMe = async (payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<User> => {
  const response = await api.put<{ status: string; user: User }>('/profile', payload);
  return response.data.user;
};

// ── Endpoint: PUT /profile  (FormData — avatar upload) ───────────────────────
export const uploadAvatar = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('profileImage', file);

  const response = await api.put<{ status: string; user: User }>(
    '/profile',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.user;
};

// ── Endpoint: PATCH /profile/password ─────────────────────────────────────────
export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<ApiMessage> => {
  const response = await api.patch<ApiMessage>('/profile/password', payload);
  return response.data;
};

// ── Endpoint: GET /admin/pending-users ─────────────────────────────────────
export const getPendingUsers = async (): Promise<PendingUser[]> => {
  const response = await api.get<{ status: string; results: number; data: PendingUser[] }>(
    '/admin/pending-users',
  );
  return response.data.data;
};

// ── Endpoint: POST /admin/pending/:pendingUserId/approve ───────────────────
export const approvePendingUser = async (
  pendingUserId: string,
  payload: ApprovePendingUserPayload,
): Promise<User> => {
  const response = await api.post<{ status: string; data: { user: User } }>(
    `/admin/pending/${pendingUserId}/approve`,
    payload,
  );
  return response.data.data.user;
};
