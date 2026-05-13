export const USER_ROLES = ['ADMIN', 'HOD', 'INSTRUCTOR', 'STUDENT'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  nationalId: string;
  departmentId?: any; // Populated object or ID string
  academicYear?: number;
  createdAt: string;
  isActive: boolean;
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

// ── Admin Types ───────────────────────────────────────────────────────────────────
export interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  nationalId: string;
  /** Must be PENDING APPROVAL to appear in the Pending Approval tab */
  status?: string;
  departmentId?: string;
  otpVerified: boolean;
  createdAt: string;
}

export interface ApprovePendingUserPayload {
  role: UserRole;
  departmentId: string;
  academicYear?: number; // Required only for STUDENT role
}
