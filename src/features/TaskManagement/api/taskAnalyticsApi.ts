// features/TaskManagement/api/taskAnalyticsApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// Typed API client for the task analytics endpoint.
// Does NOT modify the existing taskApi.ts file.
// ─────────────────────────────────────────────────────────────────────────────

import api from '@/shared/api/axiosInstance';

// ── Response Types ────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalTasks: number;
  submittedCount: number;
  notSubmittedCount: number;
  submissionRate: number;
}

export interface PieSlice {
  name: string;
  value: number;
}

export interface StudentSubmissionStat {
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedCount: number;
}

export interface DailySubmissionStat {
  date: string;
  count: number;
}

export interface SubmissionTableRow {
  submissionId: string;
  taskId: string;
  courseId?: string;
  departmentId?: string;
  studentName: string;
  taskTitle: string;
  status: string;
  submissionDate: string | null;
  finalGrade: number | null;
}

export interface TaskAnalyticsData {
  summary: AnalyticsSummary;
  charts: {
    submittedVsNotSubmitted: PieSlice[];
    submissionsPerStudent: StudentSubmissionStat[];
    submissionsOverTime: DailySubmissionStat[];
  };
  table: SubmissionTableRow[];
}

// ── API call ──────────────────────────────────────────────────────────────────

export const getTaskAnalytics = async (params?: { departmentId?: string; courseId?: string; taskId?: string }): Promise<TaskAnalyticsData> => {
  const queryParams = new URLSearchParams();
  if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.taskId) queryParams.append('taskId', params.taskId);

  const url = queryParams.toString() ? `/tasks/analytics?${queryParams.toString()}` : '/tasks/analytics';

  const response = await api.get<{ status: string; data: TaskAnalyticsData }>(url);
  return response.data.data;
};
