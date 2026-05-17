import api from './axiosInstance';

/**
 * ─── Task Submission API ──────────────────────────────────────────────────
 * Aligned with InsightO Backend Postman Collection
 * Base: /api/task-submissions
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskSubmissionAttachment {
  url: string;
  fileName?: string;
  size?: number;
}

export interface TaskSubmission {
  id: string;
  _id?: string;
  task_id: string;
  submitter_id: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  content: string;
  attachments?: TaskSubmissionAttachment[];
  ai_evaluation?: {
    suggested_grade?: number;
    feedback?: string;
  };
  final_grade?: number;
  instructor_feedback?: string;
  status: 'SUBMITTED' | 'AI_GRADED' | 'FINALIZED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskSubmissionPayload {
  content: string;
  attachments?: TaskSubmissionAttachment[];
}

export interface FinalizeGradePayload {
  final_grade: number;
  instructor_feedback?: string;
}

// ─── GET /api/task-submissions/task/:taskId ────────────────────────────────────
export const getTaskSubmissions = async (taskId: string): Promise<TaskSubmission[]> => {
  const response = await api.get<{ status: string; data: { submissions: TaskSubmission[] } }>(
    `/task-submissions/task/${taskId}`,
  );
  return response.data.data.submissions;
};

// ─── POST /api/task-submissions/task/:taskId ──────────────────────────────────
export const submitTask = async (
  taskId: string,
  payload: CreateTaskSubmissionPayload,
): Promise<TaskSubmission> => {
  const response = await api.post<{ status: string; data: TaskSubmission }>(
    `/task-submissions/task/${taskId}`,
    payload,
  );
  return response.data.data;
};

// ─── PATCH /api/task-submissions/:submissionId/grade ──────────────────────────
export const finalizeGrade = async (
  submissionId: string,
  payload: FinalizeGradePayload,
): Promise<TaskSubmission> => {
  const response = await api.patch<{ status: string; data: TaskSubmission }>(
    `/task-submissions/${submissionId}/grade`,
    payload,
  );
  return response.data.data;
};

// ─── GET /api/task-submissions/my-submissions ─────────────────────────────────
export const getMySubmissions = async (): Promise<TaskSubmission[]> => {
  const response = await api.get<{ status: string; data: { submissions: TaskSubmission[] } }>(
    `/task-submissions/my-submissions`,
  );
  return response.data.data.submissions;
};
