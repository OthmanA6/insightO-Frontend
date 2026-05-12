import api from './axiosInstance';

/**
 * ─── Utility API ───────────────────────────────────────────────────────────
 * Aligned with Backend API Documentation v1.0
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResponse {
  status: string;
  url: string;
  fileName: string;
  size: number;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

// ─── #29: POST /upload ────────────────────────────────────────────────────────
// No auth required. Sends multipart/form-data with a 'file' field.
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ─── #30: GET /health ─────────────────────────────────────────────────────────
// No auth required. Used to check server availability before API calls.
export const healthCheck = async (): Promise<HealthCheckResponse> => {
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};
