import api from '@/shared/api/axiosInstance';
import type {
  Form,
  CreateFormPayload,
  UpdateFormSettingsPayload,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  Question,
  ReorderItem,
} from '../types/form.types';

/**
 * ─── Form & Question API ──────────────────────────────────────────────────────
 * Aligned with Backend API Documentation v1.0 — Endpoints #9–#18
 *
 * NOTE: axios returns { data: <server_body> }, so we always access response.data
 * to get the server response, then .data again to unwrap the API envelope.
 */

// ── #9: POST /v1/form/ ────────────────────────────────────────────────────────
export const createForm = async (payload: CreateFormPayload): Promise<Form> => {
  const response = await api.post<{ status: string; data: Form }>('/v1/form/', payload);
  return response.data.data;
};

// ── #10: GET /v1/form/ ────────────────────────────────────────────────────────
export const getAllForms = async (): Promise<Form[]> => {
  const response = await api.get<{ status: string; count: number; data: Form[] }>('/v1/form/');
  return response.data.data;
};

// ── #11: GET /v1/form/:id ─────────────────────────────────────────────────────
export const getForm = async (formId: string): Promise<Form> => {
  const response = await api.get<{ status: string; data: Form }>(`/v1/form/${formId}`);
  return response.data.data;
};

// ── #12: DELETE /v1/form/:id ──────────────────────────────────────────────────
export const deleteForm = async (formId: string): Promise<void> => {
  await api.delete(`/v1/form/${formId}`);
};

// ── #13: PATCH /v1/form/:id/settings ─────────────────────────────────────────
export const updateFormSettings = async (
  formId: string,
  payload: UpdateFormSettingsPayload,
): Promise<Form> => {
  const response = await api.patch<{ status: string; data: Form }>(
    `/v1/form/${formId}/settings`,
    payload,
  );
  return response.data.data;
};

// =============================================================================
// ─── Question API ─────────────────────────────────────────────────────────────
// =============================================================================

// ── #14: POST /v1/questions/:formId/questions ─────────────────────────────────
export const addQuestion = async (
  formId: string,
  payload: CreateQuestionPayload,
): Promise<Question> => {
  const response = await api.post<{ status: string; data: Question }>(
    `/v1/questions/${formId}/questions`,
    payload,
  );
  return response.data.data;
};

// ── #15: GET /v1/questions/:formId/questions ──────────────────────────────────
export const getQuestions = async (formId: string): Promise<Question[]> => {
  const response = await api.get<{ status: string; data: Question[] }>(
    `/v1/questions/${formId}/questions`,
  );
  return response.data.data;
};

// ── #16: PATCH /v1/questions/:id ─────────────────────────────────────────────
export const updateQuestion = async (
  questionId: string,
  payload: UpdateQuestionPayload,
): Promise<Question> => {
  const response = await api.patch<{ status: string; data: Question }>(
    `/v1/questions/${questionId}`,
    payload,
  );
  return response.data.data;
};

// ── #17: DELETE /v1/questions/:id ────────────────────────────────────────────
export const deleteQuestion = async (questionId: string): Promise<void> => {
  await api.delete(`/v1/questions/${questionId}`);
};

// ── #18: PATCH /v1/questions/:formId/questions/reorder ───────────────────────
export const reorderQuestions = async (
  formId: string,
  items: ReorderItem[],
): Promise<void> => {
  await api.patch(`/v1/questions/${formId}/questions/reorder`, items);
};
