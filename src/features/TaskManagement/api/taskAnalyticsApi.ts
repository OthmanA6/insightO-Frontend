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

export const getTaskAnalytics = async (): Promise<TaskAnalyticsData> => {
  const response = await api.get<{ status: string; data: TaskAnalyticsData }>(
    '/tasks/analytics',
  );
  return response.data.data;
};
