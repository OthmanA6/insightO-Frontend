import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  GripVertical, 
  Type,
  AlignLeft,
  CheckSquare,
  Star,
  Upload,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
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

const typeConfig: Record<QuestionType, { label: string; icon: any }> = {
  short_text: { label: "Short Text", icon: Type },
  long_text: { label: "Long Text", icon: AlignLeft },
  multiple_choice: { label: "Multi Choice", icon: CheckSquare },
  linear_scale: { label: "Linear Scale", icon: Star },
  file: { label: "File Upload", icon: Upload },
}

export function QuestionCard({
  question,
  isActive,
  onActivate,
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

  const renderPreview = () => {
    switch (question.type) {
      case "short_text":
      case "long_text":
        return (
          <div className="bg-[#0f111a] rounded-xl p-4 border border-white/5">
            <p className="text-sm text-slate-600 italic">Respondent answer goes here...</p>
          </div>
        )
      case "multiple_choice":
        return (
          <div className="bg-[#0f111a] rounded-xl p-4 border border-white/5 space-y-2">
            {(question.options || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
                <Input 
                  value={opt} 
                  onChange={(e) => {
                    const newOpts = [...(question.options || [])]
                    newOpts[idx] = e.target.value
                    onUpdate(question.id!, { options: newOpts })
                  }}
                  className="bg-transparent border-none p-0 h-6 text-sm text-white focus-visible:ring-0"
                />
              </div>
            ))}
            <div 
              className="text-sm text-indigo-500 cursor-pointer mt-2 pl-7 hover:text-indigo-400 font-medium"
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
          <div className="bg-[#0f111a] rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3 uppercase font-bold tracking-wider">
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
                      : "border-white/10 bg-[#1e1b2e] text-slate-400"
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
          <div className="bg-[#0f111a] rounded-xl p-8 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 gap-2">
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
        isDragging && "opacity-50 z-50 py-4 scale-[1.02]"
      )}
      onClick={() => onActivate(question.id || "")}
      id={question.id}
    >
      {/* Drag Handle - Left Side */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-10 top-1/2 -translate-y-1/2 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-white cursor-grab active:cursor-grabbing transition-all p-2"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div
        className={cn(
          "question-card rounded-2xl bg-[#1e1b2e] p-6 shadow-lg cursor-pointer relative group transition-all duration-300 border-2",
          isActive ? "border-indigo-600 shadow-indigo-600/10" : "border-white/5 hover:border-white/10",
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input 
                type="text"
                value={question.label}
                onChange={(e) => onUpdate(question.id!, { label: e.target.value })}
                className="w-full bg-[#2d2a42]/30 text-base font-semibold text-white border border-transparent focus:border-indigo-500 rounded-lg px-3 py-2 outline-none transition-all placeholder:text-white/10"
                placeholder={`New ${Config.label}`}
              />
            </div>
            <div className="flex items-center gap-2 bg-[#0f111a] border border-white/10 rounded-lg px-3 py-2 shrink-0 pointer-events-none">
              <Config.icon className={cn("h-4 w-4", "text-slate-400")} />
              <span className="text-xs font-bold text-slate-300 hidden sm:block uppercase tracking-wider">{Config.label}</span>
            </div>
          </div>

          <div className="mt-2">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  )
}
