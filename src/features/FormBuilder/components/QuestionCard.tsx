import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  GripVertical, 
  Type,
  AlignLeft,
  CheckSquare,
  CircleDot,
  Star,
  Upload,
  ChevronDown,
  Trash2,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import type { Question, QuestionType } from "../types/form.types"

interface QuestionCardProps {
  question: Question
  isActive: boolean
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
  onActivate: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Question>) => void
  onOpenProperties: (question: Question) => void
}

const TYPE_OPTIONS: { type: QuestionType; label: string; icon: any }[] = [
  { type: "short_text",      label: "Short Text",    icon: Type },
  { type: "long_text",       label: "Long Text",     icon: AlignLeft },
  { type: "multiple_choice", label: "Multi Choice",  icon: CircleDot },
  { type: "checkbox",        label: "Checkbox",      icon: CheckSquare },
  { type: "linear_scale",    label: "Linear Scale",  icon: Star },
  { type: "file",            label: "File Upload",   icon: Upload },
]

const typeConfig: Record<QuestionType, { label: string; icon: any }> = {
  short_text:      { label: "Short Text",   icon: Type },
  long_text:       { label: "Long Text",    icon: AlignLeft },
  multiple_choice: { label: "Multi Choice", icon: CircleDot },
  checkbox:        { label: "Checkbox",     icon: CheckSquare },
  linear_scale:    { label: "Linear Scale", icon: Star },
  file:            { label: "File Upload",  icon: Upload },
}

// Default values when switching types
function getTypeDefaults(type: QuestionType): Partial<Question> {
  switch (type) {
    case "multiple_choice": 
    case "checkbox":        return { options: ["Option 1", "Option 2"], scale: undefined, file_config: undefined }
    case "linear_scale":    return { scale: { min: 1, max: 5 }, options: undefined, file_config: undefined }
    case "file":            return { file_config: { allowed_types: ["application/pdf"], max_size: 5242880 }, options: undefined, scale: undefined }
    default:                return { options: undefined, scale: undefined, file_config: undefined }
  }
}

export function QuestionCard({
  question,
  isActive,
  onActivate,
  onDelete,
  onUpdate,
}: QuestionCardProps) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id || "" })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  }

  const Config = typeConfig[question.type]

  const handleTypeChange = (type: QuestionType) => {
    if (type === question.type) return
    onUpdate(question.id!, { type, label: question.label, ...getTypeDefaults(type) })
  }

  const renderPreview = () => {
    switch (question.type) {
      case "short_text":
      case "long_text":
        return (
          <div className="bg-app rounded-xl p-4 border border-panel">
            <p className="text-sm text-slate-600 italic">Respondent answer goes here...</p>
          </div>
        )
      case "multiple_choice":
      case "checkbox":
        return (
          <div className="bg-app rounded-xl p-4 border border-panel space-y-2">
            {(question.options || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={cn("w-4 h-4 border-2 border-slate-600", question.type === "checkbox" ? "rounded-sm" : "rounded-full")}></div>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...(question.options || [])]
                    newOpts[idx] = e.target.value
                    onUpdate(question.id!, { options: newOpts })
                  }}
                  className="bg-transparent border-none p-0 h-6 text-sm text-content focus-visible:ring-0"
                />
              </div>
            ))}
            <div
              className="text-sm text-indigo-500 cursor-pointer mt-2 ps-7 hover:text-indigo-400 font-medium"
              onClick={(e) => {
                e.stopPropagation()
                const newOpts = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]
                onUpdate(question.id!, { options: newOpts })
              }}
            >
              + Add option
            </div>
          </div>
        )
      case "linear_scale":
        return (
          <div className="bg-app rounded-xl p-4 border border-panel">
            <div className="flex items-center justify-between text-[10px] text-content-muted mb-3 uppercase font-bold tracking-wider">
              <span>{question.scale?.min || 1} (Poor)</span>
              <span>{question.scale?.max || 5} (Excellent)</span>
            </div>
            <div className="flex justify-between gap-2 overflow-x-auto pb-2">
              {Array.from({ length: (question.scale?.max || 5) - (question.scale?.min || 1) + 1 }, (_, i) => (question.scale?.min || 1) + i).map((val) => (
                <div
                  key={val}
                  className={cn(
                    "h-10 flex-1 min-w-[36px] rounded-lg border flex items-center justify-center text-sm font-medium transition-all",
                    val === (question.scale?.max || 5)
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 font-bold"
                      : "border-panel-hover bg-panel text-content-muted"
                  )}
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        )
      case "file":
        return (
          <div className="bg-app rounded-xl p-8 border-2 border-dashed border-panel-hover flex flex-col items-center justify-center text-content-muted gap-2">
            <Upload className="h-8 w-8 opacity-20" />
            <span className="text-sm font-medium">Click or drag file to upload</span>
            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
              Allowed: {question.file_config?.allowed_types.join(', ') || 'PDF, PNG'}
            </span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative mt-4", 
        isDragging && "opacity-50 z-[100] py-4 scale-[1.02]",
        isActive && "z-50"
      )}
      onClick={() => onActivate(question.id || question._id || "")}
      id={question.id || question._id}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -start-10 top-1/2 -translate-y-1/2 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-content cursor-grab active:cursor-grabbing transition-all p-2"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div
        className={cn(
          "question-card rounded-2xl bg-panel p-6 shadow-lg cursor-pointer relative group transition-all duration-300 border-2 overflow-visible",
          isActive ? "border-indigo-600 shadow-indigo-600/10" : "border-panel hover:border-panel-hover",
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            {/* Label input */}
            <div className="flex-1">
              <input
                type="text"
                value={question.label}
                onChange={(e) => onUpdate(question.id!, { label: e.target.value })}
                className="w-full bg-panel-hover/30 text-base font-semibold text-content border border-transparent focus:border-indigo-500 rounded-lg px-3 py-2 outline-none transition-all placeholder:text-content/10"
                placeholder={`New ${Config.label}`}
              />
            </div>

            {/* ── Inline Type Dropdown (Portal Based) ─────────────────────────── */}
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 bg-app border border-panel-hover hover:border-indigo-500/50 rounded-lg px-3 py-2 transition-all group/type"
                  >
                    <Config.icon className="h-4 w-4 text-content-muted group-hover/type:text-indigo-400 transition-colors" />
                    <span className="text-xs font-bold text-content-muted hidden sm:block uppercase tracking-wider">{Config.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-content-muted transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-panel border-panel-hover text-content-muted z-[101]"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.type}
                      onSelect={() => handleTypeChange(opt.type)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer outline-none",
                        question.type === opt.type
                          ? "bg-indigo-600/20 text-indigo-400"
                          : "hover:bg-panel-hover hover:text-content focus:bg-panel-hover focus:text-content"
                      )}
                    >
                      <opt.icon className="h-4 w-4 shrink-0" />
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Inline Text Validation Dropdown (for short_text) ─────────────────────────── */}
            {question.type === 'short_text' && (
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <select
                  value={question.text_validation?.type || "text"}
                  onChange={(e) => onUpdate(question.id!, { text_validation: { type: e.target.value as any } })}
                  className="bg-app border border-panel-hover hover:border-indigo-500/50 rounded-lg pl-3 pr-7 py-2.5 text-[10px] uppercase font-bold tracking-wider text-content-muted transition-all appearance-none outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  <option value="text">Free Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="phone">Phone</option>
                  <option value="url">URL</option>
                </select>
                <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted pointer-events-none" />
              </div>
            )}

            {/* Delete button — visible on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(question.id!) }}
              className="shrink-0 p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  )
}
