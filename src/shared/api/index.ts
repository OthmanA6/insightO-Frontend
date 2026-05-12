/**
 * ─── Shared API Layer ────────────────────────────────────────────────────────
 * Central barrel export for all API service modules.
 * Covers all 30 endpoints defined in API_DOCUMENTATION.md v1.0
 *
 * Usage:
 *   import { getAllDepartments, uploadFile } from '@/shared/api';
 */

export * as departmentApi from './departmentApi';
export * as submissionApi from './submissionApi';
export * as userAdminApi from './userAdminApi';
export * as utilityApi from './utilityApi';

export type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from './departmentApi';
export type {
  Submission,
  CreateSubmissionPayload,
  AnswerPayload,
  AnswerValue,
} from './submissionApi';
export type { AdminUser, UpdateUserPayload } from './userAdminApi';
export type { UploadResponse, HealthCheckResponse } from './utilityApi';
