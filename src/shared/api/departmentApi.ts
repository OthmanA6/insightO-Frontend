import api from './axiosInstance';

/**
 * ─── Department API ────────────────────────────────────────────────────────
 * Aligned with Backend API Documentation v1.0 — Endpoints #20–#24
 * All endpoints require ADMIN role.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  _id?: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
  hodId?: string;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

// ─── #20: POST /admin/departments/ ───────────────────────────────────────────
export const createDepartment = async (
  payload: CreateDepartmentPayload,
): Promise<Department> => {
  const response = await api.post<{ status: string; data: Department }>(
    '/admin/departments/',
    payload,
  );
  return response.data.data;
};

// ─── #21: GET /admin/departments/ ────────────────────────────────────────────
export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await api.get<{ status: string; count: number; data: Department[] }>(
    '/admin/departments/',
  );
  return response.data.data;
};

// ─── #22: GET /admin/departments/:id ─────────────────────────────────────────
export const getDepartment = async (departmentId: string): Promise<Department> => {
  const response = await api.get<{ status: string; data: Department }>(
    `/admin/departments/${departmentId}`,
  );
  return response.data.data;
};

// ─── #23: PATCH /admin/departments/:id ───────────────────────────────────────
export const updateDepartment = async (
  departmentId: string,
  payload: UpdateDepartmentPayload,
): Promise<Department> => {
  const response = await api.patch<{ status: string; data: Department }>(
    `/admin/departments/${departmentId}`,
    payload,
  );
  return response.data.data;
};

// ─── #24: DELETE /admin/departments/:id ──────────────────────────────────────
export const deleteDepartment = async (departmentId: string): Promise<void> => {
  await api.delete(`/admin/departments/${departmentId}`);
};

// ─── Global Analytics ────────────────────────────────────────────────────────
export interface GlobalDepartmentAnalytics {
  kpis: {
    totalDepartments: number;
    totalCourses: number;
    totalStudents: number;
    totalInstructors: number;
  };
  comparisons: {
    departmentId: string;
    departmentName: string;
    enrollmentCount: number;
    courseCount: number;
    completionRate: number;
    submissionCount: number;
  }[];
}

let cachedAnalyticsPromise: Promise<GlobalDepartmentAnalytics> | null = null;

export const getGlobalAnalytics = async (): Promise<GlobalDepartmentAnalytics> => {
  if (!cachedAnalyticsPromise) {
    cachedAnalyticsPromise = api.get<{ status: string; data: GlobalDepartmentAnalytics }>(
      '/admin/departments/analytics/global',
    ).then(res => res.data.data).catch(err => {
      cachedAnalyticsPromise = null;
      throw err;
    });
  }
  return cachedAnalyticsPromise;
};

// ─── Department Specific Analytics ─────────────────────────────────────────────
export interface DepartmentSpecificAnalyticsResult {
  kpis: {
    totalEnrolled: number;
    totalCourses: number;
    totalTasks: number;
    completionRate: number;
    averageGrade: number;
  };
  students: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    tasksCompleted: number;
    averageGrade: number;
  }[];
}

export const getDepartmentAnalytics = async (departmentId: string): Promise<DepartmentSpecificAnalyticsResult> => {
  const response = await api.get<{ status: string; data: DepartmentSpecificAnalyticsResult }>(
    `/admin/departments/${departmentId}/analytics`,
  );
  return response.data.data;
};
