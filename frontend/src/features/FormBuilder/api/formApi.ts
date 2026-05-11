import api from '@/shared/api/axiosInstance';
import type { 
  Form, 
  CreateFormPayload, 
  CreateQuestionPayload,
  Question 
} from '../types/form.types';

/**
 * ─── Form API ────────────────────────────────────────────────────────
 * Perfectly aligned with Backend API Documentation v1.0
 */

// 1. Create a new form (Step 1: Meta only)
export const createForm = async (payload: CreateFormPayload): Promise<Form> => {
  const response = await api.post<Form>('/v1/form/', payload);
  return response.data;
};

// 2. Add a question to a form
export const addQuestion = async (
  formId: string, 
  payload: CreateQuestionPayload
): Promise<Question> => {
  const response = await api.post<Question>(`/v1/questions/${formId}/questions`, payload);
  return response.data;
};

// 3. Get form details (includes questions)
export const getForm = async (formId: string): Promise<Form> => {
  const response = await api.get<Form>(`/v1/form/${formId}`);
  return response.data;
};

// 4. Delete a form
export const deleteForm = async (formId: string): Promise<void> => {
  await api.delete(`/v1/form/${formId}`);
};
