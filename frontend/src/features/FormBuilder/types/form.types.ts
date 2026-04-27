// ─── Form Builder Types ────────────────────────────────────────────────────────
// Ready to connect to a MERN stack (Node.js/MongoDB)

export type QuestionType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "rating"
  | "ai_sentiment"
  | "skill_matrix"
  | "date"
  | "file_upload"
  | "dropdown"

export type QuestionOption = {
  id: string
  label: string
}

export type CompetencyTag = {
  id: string
  name: string
  color: string
}

export type Question = {
  id: string
  type: QuestionType
  title: string
  description?: string
  options: QuestionOption[]
  isSelected: boolean
  isRequired: boolean
  ratingMax?: number
  competencyTags?: CompetencyTag[]
  allowMultiple?: boolean
}

export type FormMeta = {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export type FormBuilderState = {
  meta: FormMeta
  questions: Question[]
}

export type SaveFormPayload = {
  title: string
  description: string
  questions: Omit<Question, "isSelected">[]
}
