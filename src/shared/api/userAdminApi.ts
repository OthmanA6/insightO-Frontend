import api from './axiosInstance';
import type { UserRole } from '@/features/auth/types';

/**
 * ─── User Administration API ───────────────────────────────────────────────
 * Aligned with Backend API Documentation v1.0 — Endpoints #25–#28
 * All endpoints require ADMIN role.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  departmentId?: string;
  academicYear?: number;
  profile?: {
    enrollmentNumber?: string;
    cgpa?: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  academicYear?: number;
  departmentId?: string;
}

export const getAllUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get<{ status: string; count: number; data: AdminUser[] }>(
    '/admin/users/',
  );
  return response.data.data;
};

// ─── #25 Direct: POST /admin/users/ ───────────────────────────────────────────
export const createAdminUser = async (payload: any): Promise<AdminUser> => {
  const response = await api.post<{ status: string; data: AdminUser }>('/admin/users/', payload);
  return response.data.data;
};

// ─── #26: GET /admin/users/:id ───────────────────────────────────────────────
export const getUser = async (userId: string): Promise<AdminUser> => {
  const response = await api.get<{ status: string; data: AdminUser }>(`/admin/users/${userId}`);
  return response.data.data;
};

// ─── #27: PATCH /admin/users/:id ─────────────────────────────────────────────
export const updateUser = async (
  userId: string,
  payload: UpdateUserPayload,
): Promise<AdminUser> => {
  const response = await api.patch<{ status: string; data: AdminUser }>(
    `/admin/users/${userId}`,
    payload,
  );
  return response.data.data;
};

// ─── #28: DELETE /admin/users/:id ────────────────────────────────────────────
export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/admin/users/${userId}`);
};
