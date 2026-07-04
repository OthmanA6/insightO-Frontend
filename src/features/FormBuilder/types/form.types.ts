// ─── Form Builder Types ────────────────────────────────────────────────────────
// Mirrored with Backend API Documentation v1.0

export type QuestionType =
  | "short_text"
  | "long_text"
  | "linear_scale"
  | "multiple_choice"
  | "checkbox"
  | "file";

export type QuestionOption = string; // API expects array of strings for multiple_choice

export type Question = {
  id?: string;
  _id?: string;
  label: string; // API uses 'label'
  type: QuestionType;
  required: boolean; // API uses 'required'
  order: number;
  options?: QuestionOption[]; // For multiple_choice
  scale?: { min: number; max: number }; // For linear_scale
  file_config?: { allowed_types: string[]; max_size: number }; // For file
  text_validation?: { type: "text" | "email" | "phone" | "number" | "url" }; // For short_text
  ai_tag?: string; // Optional utility
};

export type FormRole = "ADMIN" | "HOD" | "INSTRUCTOR" | "STUDENT" | "COURSE" | "DEPARTMENT" | "FACILITY" | "GENERAL";

export type FormSettings = {
  title: string;
  description: string;
  category: "GENERAL" | "SPECIALIZED" | "QUIZ";
  evaluator_roles?: FormRole[];
  subject_role?: FormRole;
  is_anonymous: boolean;
  is_active: boolean;
  department_id?: string;
  course_id?: string;
  instructor_id?: string;
  facility_id?: string;
};

export type Form = FormSettings & {
  id: string;
  _id?: string;
  questions: Question[];
  creator_id?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type CreateFormPayload = FormSettings;
export type CreateQuestionPayload = Omit<Question, 'id'>;

// Partial update payload for PATCH /v1/form/:id/settings
export type UpdateFormSettingsPayload = Partial<Pick<FormSettings,
  'title' | 'description' | 'is_active' | 'is_anonymous' | 'category'
>>;

// Partial update payload for PATCH /v1/questions/:id
export type UpdateQuestionPayload = Partial<Pick<Question,
  'label' | 'required' | 'order' | 'options' | 'scale' | 'file_config' | 'text_validation' | 'ai_tag'
>>;

// Payload item for PATCH /v1/questions/:formId/questions/reorder
export type ReorderItem = {
  id: string;
  order: number;
};

