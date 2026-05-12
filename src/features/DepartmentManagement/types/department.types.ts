export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  hodId?: string; // Head of Department ID
  hodName?: string;
  createdAt: string;
  stats?: {
    studentCount: number;
    instructorCount: number;
    activeSurveys: number;
  };
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
  hodId?: string;
}

export interface UpdateDepartmentPayload extends Partial<CreateDepartmentPayload> {}
