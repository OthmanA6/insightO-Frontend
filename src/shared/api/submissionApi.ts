import api from './axiosInstance';

/**
 * ─── Submission API ────────────────────────────────────────────────────────
 * Aligned with Backend API Documentation v1.0
 * Base URL: http://localhost:5000/api
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnswerValue = string | number | string[] | { url: string; type: string; size: number };

export interface AnswerPayload {
  question_id: string;
  value: AnswerValue;
}

export interface CreateSubmissionPayload {
  /** The ID of the user being evaluated */
  subject_id: string;
  answers: AnswerPayload[];
}

export interface SubmissionQuestion {
  id: string;
  label: string;
  type: string;
}

export interface SubmissionAnswer {
  question_id: SubmissionQuestion;
  value: AnswerValue;
}

export interface Submission {
  id: string;
  form_id: {
    id: string;
    title: string;
    description?: string;
    questions: SubmissionQuestion[];
  };
  evaluator_id: string;
  subject_id: string;
  answers: SubmissionAnswer[];
  createdAt: string;
}

// ─── #19: POST /forms/:formId/submissions ────────────────────────────────────
export const createSubmission = async (
  formId: string,
  payload: CreateSubmissionPayload,
): Promise<Submission> => {
  const response = await api.post<{ status: string; data: Submission }>(
    `/forms/${formId}/submissions`,
    payload,
  );
  return response.data.data;
};

// ─── POST /forms/public/:formId/submissions ─────────────────────────────────
export const createPublicSubmission = async (
  formId: string,
  payload: CreateSubmissionPayload,
): Promise<Submission> => {
  const response = await api.post<{ status: string; data: Submission }>(
    `/forms/public/${formId}/submissions`,
    payload,
  );
  return response.data.data;
};

// ─── GET /forms/:formId/submissions ──────────────────────────────────────────
export const getFormSubmissions = async (formId: string): Promise<Submission[]> => {
  const response = await api.get<{ status: string; data: Submission[] }>(
    `/forms/${formId}/submissions`,
  );
  return response.data.data;
};
