export const USER_ROLES = ['ADMIN', 'HEAD_OF_DEP', 'INSTRUCTOR', 'STUDENT'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  nationalId: string;
  role: UserRole;
  departmentId?: string;
  academicYear?: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiMessage {
  message: string;
}

export interface OtpStepResponse extends ApiMessage {
  email: string;
  status?: string;
}

export interface OtpFlowState {
  pendingEmail: string | null;
  flowType: 'register' | 'reset' | null;
}
