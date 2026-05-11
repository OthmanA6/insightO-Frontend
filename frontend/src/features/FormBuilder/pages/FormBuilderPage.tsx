import React, { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { 
  Plus, 
  Trash2, 
  Settings, 
  Eye, 
  CheckSquare,
  ArrowLeft,
  Share2,
  Type,
  AlignLeft,
  Star,
  Upload,
  Zap,
  Lock,
  X,
  LayoutGrid,
  Download,
  ArrowRight,
  Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/shared/lib/utils"

import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Textarea } from "@/shared/components/ui/textarea"
import { Input } from "@/shared/components/ui/input"
import { toast } from "sonner"

import type { Question, QuestionType, FormRole } from "../types/form.types"
import { QuestionCard } from "../components/QuestionCard"

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "linear_scale",
    label: "How would you rate the manager's communication skills?",
    required: true,
    order: 1,
    scale: { min: 1, max: 5 }
  }
]

export default function FormBuilderPage() {
  const navigate = useNavigate()
  
  // ─── Form Settings State (Mirrors API) ───
  const [formTitle, setFormTitle] = useState("Q1 Manager 360 Review")
  const [formDescription, setFormDescription] = useState("Please provide honest feedback regarding your direct manager's performance this quarter.")
  const [evaluatorRoles, setEvaluatorRoles] = useState<FormRole[]>(["STUDENT"])
  const [subjectRole, setSubjectRole] = useState<FormRole>("INSTRUCTOR")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [departmentId, setDepartmentId] = useState("")

  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [activeId, setActiveId] = useState<string | null>("q1")
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved")

  const activeQuestion = useMemo(() => 
    questions.find(q => q.id === activeId) || null
  , [questions, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const moved = arrayMove(items, oldIndex, newIndex)
        // Sync orders
        return moved.map((q, idx) => ({ ...q, order: idx + 1 }))
      })
    }
  }

  const addQuestion = useCallback((type: QuestionType = "short_text") => {
    const newId = `q-${Math.random().toString(36).substr(2, 9)}`
    const newQuestion: Question = {
      id: newId,
      type,
      label: `New question label`,
      required: false,
      order: questions.length + 1,
      options: type === "multiple_choice" ? ["Option 1"] : undefined,
      scale: type === "linear_scale" ? { min: 1, max: 5 } : undefined,
      file_config: type === "file" ? { allowed_types: ["application/pdf"], max_size: 5242880 } : undefined
    }
    setQuestions(prev => [...prev, newQuestion])
    setActiveId(newId)
    
    setTimeout(() => {
        const el = document.getElementById(newId)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [questions.length])

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx + 1 })))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
    setSaveStatus("Saving...")
    setTimeout(() => setSaveStatus("Saved"), 1000)
  }, [])

  const handlePublish = () => {
    // Validation Mirroring
    if (formTitle.length < 5 || formTitle.length > 100) {
      toast.error("Form title must be between 5 and 100 characters")
      return
    }

    const invalidQuestions = questions.filter(q => q.label.length < 3 || q.label.length > 200)
    if (invalidQuestions.length > 0) {
      toast.error("All question labels must be between 3 and 200 characters")
      return
    }

    if (!departmentId) {
      toast.error("Department ID is required")
      return
    }

    setIsPublishModalOpen(true)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex h-14 w-full items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-4 lg:px-6 z-20 relative">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/forms-surveys")}
            className="h-8 w-8 rounded-lg hover:bg-[#2d2a42] text-slate-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-500" />
            <input 
              type="text" 
              value={formTitle} 
              onChange={(e) => setFormTitle(e.target.value)}
              className={cn(
                "bg-transparent text-sm font-bold text-white border-none focus:ring-0 w-48 md:w-64 p-0 focus:outline-none",
                (formTitle.length < 5 || formTitle.length > 100) && "text-red-500"
              )}
            />
            <span className="inline-flex items-center rounded bg-[#2d2a42] px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {saveStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsAIModalOpen(true)}
            className="h-8 flex items-center gap-2 rounded bg-purple-500/10 border border-purple-500/30 px-3 text-xs font-bold text-purple-400 transition-all hover:bg-purple-500 hover:text-white"
          >
            <Zap className="h-3.5 w-3.5" /> AI Sync
          </Button>
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          <Button 
            variant="ghost" 
            onClick={() => setIsShareModalOpen(true)}
            className="h-8 px-3 rounded hover:bg-[#2d2a42] text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          <Button 
            variant="ghost"
            onClick={() => setIsPreviewModalOpen(true)}
            className="h-8 px-3 rounded hover:bg-[#2d2a42] text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button 
            onClick={handlePublish}
            className="h-8 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
          >
            Publish Form
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Library */}
        <aside className="w-64 shrink-0 border-r border-white/5 bg-[#1e1b2e] flex flex-col hidden md:flex z-10">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field Library</h3>
            <p className="text-[10px] text-slate-500 mt-1">Mirrored with Backend API</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 mb-3">API Compliant Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'short_text', label: 'Short Text', icon: Type },
                  { type: 'long_text', label: 'Long Text', icon: AlignLeft },
                  { type: 'multiple_choice', label: 'Multi Choice', icon: CheckSquare },
                  { type: 'linear_scale', label: 'Linear Scale', icon: Star },
                  { type: 'file', label: 'File Upload', icon: Upload },
                ].map((field) => (
                  <button 
                    key={field.type}
                    onClick={() => addQuestion(field.type as QuestionType)}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/5 bg-[#0f111a] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-slate-300 group"
                  >
                    <field.icon className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                    <span className="text-[10px] font-medium text-center">{field.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <section className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar" id="canvas-container">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="w-full max-w-2xl mx-auto py-10 px-4 relative z-10 flex flex-col gap-4 pb-32">
            {/* Title Block */}
            <div 
              className={cn(
                "question-card rounded-2xl bg-[#1e1b2e] p-8 shadow-lg cursor-pointer transition-all duration-200 border-2",
                activeId === 'title' ? "border-indigo-600 shadow-indigo-600/10" : "border-white/5"
              )}
              onClick={() => setActiveId('title')}
            >
              <input 
                type="text" 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-transparent text-3xl font-bold text-white border-none focus:ring-0 p-0 mb-2 placeholder-slate-600 outline-none"
              />
              <textarea 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-400 border-none focus:ring-0 p-0 resize-none outline-none custom-scrollbar" 
                rows={2}
                placeholder="Describe the purpose of this evaluation..."
              />
            </div>

            {/* Questions Context */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={questions.map(q => q.id!)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {questions.map((question) => (
                      <motion.div
                        key={question.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <QuestionCard
                          question={question}
                          isActive={activeId === question.id}
                          isSelected={false}
                          onSelect={() => {}}
                          onActivate={setActiveId}
                          onDelete={deleteQuestion}
                          onUpdate={updateQuestion}
                          onOpenProperties={() => setActiveId(question.id!)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>

            {/* Add New Area */}
            <div 
              className="w-full py-2 group cursor-pointer mt-4" 
              onClick={() => addQuestion('short_text')}
            >
              <div className="flex items-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex-1 h-px bg-indigo-500/30"></div>
                <div className="w-8 h-8 rounded-full bg-[#1e1b2e] border border-indigo-500 text-indigo-500 flex items-center justify-center mx-3">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1 h-px bg-indigo-500/30"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 shrink-0 border-l border-white/5 bg-[#1e1b2e] flex flex-col hidden lg:flex z-10">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Sync Properties</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {activeId === 'title' ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">API Form Metadata</h4>
                  <p className="text-xs text-slate-400 mb-6">Required fields for /v1/form endpoint.</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">Department ID</Label>
                      <Input 
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        placeholder="e.g. 507f1f77..."
                        className="bg-[#0f111a] border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">Subject Role</Label>
                      <select 
                        value={subjectRole}
                        onChange={(e) => setSubjectRole(e.target.value as FormRole)}
                        className="w-full bg-[#0f111a] border border-white/10 text-white text-sm rounded-lg p-2"
                      >
                        <option value="INSTRUCTOR">Instructor</option>
                        <option value="HOD">HOD</option>
                        <option value="STUDENT">Student</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between bg-[#0f111a] p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-medium text-slate-300">Anonymous</span>
                      <Switch 
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#0f111a] p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-medium text-slate-300">Active Status</span>
                      <Switch 
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeQuestion ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">API Type</label>
                    <div className="bg-[#0f111a] border border-white/10 text-white text-sm rounded-lg py-2.5 px-3 flex items-center justify-between">
                      <span className="font-medium uppercase">{activeQuestion.type}</span>
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[#0f111a] p-3 rounded-lg border border-white/5 mt-4">
                    <span className="text-sm font-medium text-slate-300">Required Field</span>
                    <Switch 
                      checked={activeQuestion.required}
                      onCheckedChange={(val) => updateQuestion(activeQuestion.id!, { required: val })}
                    />
                  </div>
                  
                  {activeQuestion.type === "linear_scale" && (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">Scale Range (1-10)</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" min={1} max={10}
                          value={activeQuestion.scale?.max || 5}
                          onChange={(e) => updateQuestion(activeQuestion.id!, { scale: { min: 1, max: Number(e.target.value) } })}
                          className="bg-[#0f111a] border-white/10 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-white/5 my-6"></div>

                <Button 
                  variant="destructive"
                  onClick={() => deleteQuestion(activeQuestion.id!)}
                  className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Remove Field
                </Button>
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm mt-10">
                <Settings className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Select a block to sync properties.</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d2a42; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
      `}</style>
    </div>
  )
}
