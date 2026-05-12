export type CycleStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface EvaluationCycle {
  id: string;
  name: string;
  description: string;
  formId: string;
  formName: string;
  targetDepartmentIds: string[];
  evaluatorRoles: string[];
  startDate: string;
  endDate: string;
  status: CycleStatus;
  participantsCount: number;
  completionRate: number;
  createdAt: string;
}

export interface CreateCyclePayload {
  name: string;
  description: string;
  formId: string;
  targetDepartmentIds: string[];
  evaluatorRoles: string[];
  startDate: string;
  endDate: string;
}
