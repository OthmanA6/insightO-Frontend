import api from '@/shared/api/axiosApi';
import type { AxiosError } from 'axios';
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  ApiMessage,
  OtpStepResponse,
} from '../types';

export const loginUser = async (
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
