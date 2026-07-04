import axiosApi from './axiosInstance';

export interface ConceptMastery {
  concept: string;
  average_mastery: number;
}

export interface TaskHistoryItem {
  _id: string;
  task_id: { _id: string; title: string; task_type: string; course_id?: string };
  status: string;
  final_grade?: number;
  ai_suggested_grade?: number;
  updatedAt: string;
}

export interface ProfileAnalyticsResponse {
  user: { _id: string; firstName: string; lastName: string; email: string; role: string; };
  profile?: {
    academicYear?: number;
    departmentId?: { name: string } | string;
    teachingCourses?: any[];
    enrolledCourses?: any[];
  };
  aggregated_metrics: {
    total_submissions: number;
    average_suggested_grade: number;
    average_confidence_score: number;
    concept_mastery: ConceptMastery[];
  };
  task_history: TaskHistoryItem[];
  ai_synthesis?: {
    overall_summary: string;
    core_strengths: string[];
    persistent_weaknesses: string[];
    action_plan: string[];
  };
}

export const getProfileAnalytics = async (userId: string): Promise<ProfileAnalyticsResponse> => {
  const response = await axiosApi.get<{ status: string; data: ProfileAnalyticsResponse }>(`/users/${userId}/profile-analytics`);
  return response.data.data;
};
