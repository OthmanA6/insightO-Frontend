import api from '@/shared/api/axiosInstance';
import type { EvaluationCycle } from '../types/cycle.types';

export interface CreateCyclePayload {
  name: string;
  description?: string;
  formId: string;
  targetDepartmentIds: string[];
  evaluatorRoles: string[];
  startDate: string;
  endDate: string;
}

export const createCycle = async (payload: CreateCyclePayload): Promise<EvaluationCycle> => {
  const response = await api.post<{ status: string; data: { cycle: EvaluationCycle } }>('/cycles', payload);
  return response.data.data.cycle;
};

export const getCycles = async (): Promise<EvaluationCycle[]> => {
  const response = await api.get<{ status: string; data: { cycles: EvaluationCycle[] } }>('/cycles');
  return response.data.data.cycles;
};

export const deleteCycle = async (id: string): Promise<void> => {
  await api.delete(`/cycles/${id}`);
};
