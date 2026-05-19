import api from "@/shared/api/axiosInstance";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagAnalysisResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  strengths: string[];
  weaknesses: string[];
  action_items: string[];
  score?: number;
}

export interface GlobalAnalysisResult {
  overall_summary: string;
  key_problems: string[];
  recommendations: string[];
  overall?: {
    score: number;
    summary: string;
  };
}

export interface FormAnalysisPayload {
  tags: Record<string, TagAnalysisResult>;
}

export interface FormDeepAnalysisPayload {
  tags: Record<string, TagAnalysisResult>;
  global: GlobalAnalysisResult;
}

export interface TokenLimitError {
  error: "Token limit exceeded";
  limit: number;
  message: string;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /api/ai/analyze-form/:formId
 * Basic per-tag analysis.
 */
export const analyzeForm = async (
  formId: string
): Promise<FormAnalysisPayload> => {
  const response = await api.get<{ status: string; data: FormAnalysisPayload }>(
    `/ai/analyze-form/${formId}`
  );
  console.log("[formAiApi] analyzeForm response:", response.data);
  return response.data.data;
};

/**
 * GET /api/ai/analyze-form/:formId/deep
 * Deep cross-category + global analysis.
 */
export const analyzeFormDeep = async (
  formId: string
): Promise<FormDeepAnalysisPayload> => {
  const response = await api.get<{
    status: string;
    data: FormDeepAnalysisPayload;
  }>(`/ai/analyze-form/${formId}/deep`);
  console.log("[formAiApi] analyzeFormDeep response:", response.data);
  return response.data.data;
};
