import api from './axiosInstance';

/**
 * ─── Course API ────────────────────────────────────────────────────────────
 * Aligned with InsightO Backend Postman Collection
 * Base: /api/courses
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  _id?: string;
  name: string;
  courseCode: string;
  description?: string;
  departmentId: string;
  instructorId?: string;
  instructor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  credits?: number;
  isActive?: boolean;
  enrolledStudents?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCoursePayload {
  name: string;
  courseCode: string;
  description?: string;
  departmentId: string;
  instructorId?: string;
  credits?: number;
  isActive?: boolean;
  studentIds?: string[];
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

// ─── GET /api/courses ─────────────────────────────────────────────────────────
export const getCourses = async (): Promise<Course[]> => {
  const response = await api.get<{ status: string; data: { courses: Course[] } }>('/courses');
  return response.data.data.courses;
};

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────
export const getCourseById = async (id: string): Promise<Course> => {
  const response = await api.get<{ status: string; data: { course: Course } }>(`/courses/${id}`);
  return response.data.data.course;
};

// ─── POST /api/courses ────────────────────────────────────────────────────────
export const createCourse = async (payload: CreateCoursePayload): Promise<Course> => {
  const response = await api.post<{ status: string; data: { course: Course } }>('/courses', payload);
  return response.data.data.course;
};

// ─── PATCH /api/courses/:id ───────────────────────────────────────────────────
export const updateCourse = async (id: string, payload: UpdateCoursePayload): Promise<Course> => {
  const response = await api.patch<{ status: string; data: Course }>(`/courses/${id}`, payload);
  return response.data.data;
};

// ─── DELETE /api/courses/:id ──────────────────────────────────────────────────
export const deleteCourse = async (id: string): Promise<void> => {
  await api.delete(`/courses/${id}`);
};

// ─── GET /api/courses/:id/insights ────────────────────────────────────────────
export interface CourseInsightsResponse {
  chartData: any[];
  aiInsights: any;
  ai_status: string;
}

export const getCourseInsights = async (id: string, forceAI: boolean = false): Promise<CourseInsightsResponse> => {
  const response = await api.get<{ status: string; data: CourseInsightsResponse }>(
    `/courses/${id}/insights${forceAI ? '?forceAI=true' : ''}`
  );
  return response.data.data;
};
