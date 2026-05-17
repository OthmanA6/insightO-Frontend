import api from '@/shared/api/axiosInstance';

export interface Task {
  id: string;
  _id?: string;
  title: string;
  description: string;
  creator_id: any;
  target: {
    department_id?: string;
    course_id?: string;
    specific_users?: string[];
  };
  attachments?: {
    url: string;
    fileName?: string;
    size?: number;
  }[];
  ai_grading_rubric?: string;
  deadline: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  target: {
    department_id?: string;
    course_id?: string;
    specific_users?: string[];
  };
  attachments?: {
    url: string;
    fileName?: string;
    size?: number;
  }[];
  ai_grading_rubric?: string;
  deadline: string;
  status?: 'ACTIVE' | 'CLOSED';
}

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const response = await api.post<{ status: string; data: { task: Task } }>('/tasks', payload);
  return response.data.data.task;
};

export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get<{ status: string; data: { tasks: Task[] } }>('/tasks');
  return response.data.data.tasks;
};

export const getTaskById = async (id: string): Promise<Task> => {
  const response = await api.get<{ status: string; data: { task: Task } }>(`/tasks/${id}`);
  return response.data.data.task;
};

export const updateTask = async (id: string, payload: Partial<CreateTaskPayload>): Promise<Task> => {
  const response = await api.patch<{ status: string; data: { task: Task } }>(`/tasks/${id}`, payload);
  return response.data.data.task;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};
