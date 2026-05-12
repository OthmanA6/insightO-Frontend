import { useState, useCallback, useMemo, useEffect } from "react"
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
  LayoutGrid,
  Loader2,
  AlertTriangle,
  Save,
  Rocket
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/shared/lib/utils"

import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Input } from "@/shared/components/ui/input"
import { toast } from "sonner"

import type { Question, QuestionType, FormRole } from "../types/form.types"
import { QuestionCard } from "../components/QuestionCard"
import * as formApi from "../api/formApi"
import * as departmentApi from "@/shared/api/departmentApi"
import type { Department } from "@/shared/api/departmentApi"

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "linear_scale",
    label: "How would you rate the overall performance of the subject?",
    required: true,
    order: 1,
    scale: { min: 1, max: 5 }
  }
]

export default function FormBuilderPage() {
  const navigate = useNavigate()
  
  // ─── Form Settings State (Mirrors API) ───
  const [formTitle, setFormTitle] = useState("New Evaluation Template")
  const [formDescription, setFormDescription] = useState("Provide feedback for the academic quarter.")
  const [evaluatorRoles, setEvaluatorRoles] = useState<FormRole[]>(["STUDENT"])
  const [subjectRole, setSubjectRole] = useState<FormRole>("INSTRUCTOR")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [departmentId, setDepartmentId] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])

  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [activeId, setActiveId] = useState<string | null>("q1")
  
  const [isPublishing, setIsPublishing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved")

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getAllDepartments()
        setDepartments(data)
      } catch (err) {
        console.error("Failed to load departments")
      }
    }
    fetchDepts()
  }, [])

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
        return moved.map((q, idx) => ({ ...q, order: idx + 1 }))
      })
    }
  }

  const addQuestion = useCallback((type: QuestionType = "short_text") => {
    const newId = `q-${Math.random().toString(36).substr(2, 9)}`
    const newQuestion: Question = {
      id: newId,
      type,
      label: `Untitled ${type.replace('_', ' ')}`,
      required: false,
      order: questions.length + 1,
      options: type === "multiple_choice" ? ["Option 1"] : undefined,
      scale: type === "linear_scale" ? { min: 1, max: 5 } : undefined,
      file_config: type === "file" ? { allowed_types: ["application/pdf"], max_size: 5242880 } : undefined
    }
    setQuestions(prev => [...prev, newQuestion])
    setActiveId(newId)
  }, [questions.length])

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx + 1 })))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
    setSaveStatus("Saving...")
    setTimeout(() => setSaveStatus("Saved"), 500)
  }, [])

  const handlePublish = async () => {
    if (formTitle.length < 5) {
      toast.error("Form title is too short (min 5 characters)")
      return
    }
    if (!departmentId) {
      toast.error("Please select a target Department")
      return
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question")
      return
    }

    setIsPublishing(true)
    try {
      // 1. Create the Form
      const newForm = await formApi.createForm({
        title: formTitle,
        description: formDescription,
        evaluator_roles: evaluatorRoles,
        subject_role: subjectRole,
        is_anonymous: isAnonymous,
        is_active: isActive,
        department_id: departmentId
      })

      // 2. Add Questions
      await Promise.all(questions.map(q => 
        formApi.addQuestion(newForm.id, {
          label: q.label,
          type: q.type,
          required: q.required,
          order: q.order,
          options: q.options,
          scale: q.scale,
          file_config: q.file_config
        })
      ))

      toast.success("Form published successfully!")
      navigate("/dashboard/forms-surveys")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to publish form")
    } finally {
      setIsPublishing(false)
    }
  }

  const toggleRole = (role: FormRole) => {
    setEvaluatorRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6 z-20 relative">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/forms-surveys")}
            className="h-10 w-10 rounded-xl hover:bg-white/5 text-slate-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-indigo-500" />
            <div className="flex flex-col">
              <input 
                type="text" 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-transparent text-sm font-black text-white border-none focus:ring-0 w-64 p-0 focus:outline-none"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                {saveStatus === 'Saving...' ? <Loader2 className="h-2 w-2 animate-spin" /> : <Save className="h-2 w-2" />} 
                Draft Sync: {saveStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            className="h-10 flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 text-xs font-bold text-purple-400 transition-all hover:bg-purple-500 hover:text-white"
          >
            <Zap className="h-4 w-4" /> AI Generate
          </Button>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <Button 
            variant="ghost" 
            className="h-10 px-4 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button 
            variant="ghost"
            className="h-10 px-4 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Publish Architecture
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Library */}
        <aside className="w-72 shrink-0 border-r border-white/5 bg-[#1e1b2e] flex flex-col hidden md:flex z-10">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Acquisition</h3>
            <p className="text-xs text-slate-300 mt-1 font-bold">Field Component Library</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: 'short_text', label: 'Short Text', desc: 'Brief alphanumeric responses', icon: Type },
                { type: 'long_text', label: 'Extended Text', desc: 'Detailed narrative feedback', icon: AlignLeft },
                { type: 'multiple_choice', label: 'Multiple Choice', desc: 'Select from predefined options', icon: CheckSquare },
                { type: 'linear_scale', label: 'Linear Scale', desc: 'Numerical rating (1-10)', icon: Star },
                { type: 'file', label: 'File Provisioning', desc: 'Evidence & document upload', icon: Upload },
              ].map((field) => (
                <button 
                  key={field.type}
                  onClick={() => addQuestion(field.type as QuestionType)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#0f111a] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left group"
                >
                  <div className="p-3 rounded-xl bg-white/5 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                    <field.icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-200 group-hover:text-white">{field.label}</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-0.5">{field.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <section className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#0f111a]" id="canvas-container">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="w-full max-w-3xl mx-auto py-16 px-6 relative z-10 flex flex-col gap-6 pb-40">
            {/* Title Block */}
            <div 
              className={cn(
                "rounded-3xl bg-[#1e1b2e] p-10 shadow-2xl cursor-pointer transition-all duration-300 border-2",
                activeId === 'title' ? "border-indigo-600 shadow-indigo-600/10" : "border-white/5 hover:border-white/10"
              )}
              onClick={() => setActiveId('title')}
            >
              <input 
                type="text" 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-transparent text-4xl font-black text-white border-none focus:ring-0 p-0 mb-4 placeholder-slate-800 outline-none tracking-tight"
                placeholder="Form Title"
              />
              <textarea 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-400 border-none focus:ring-0 p-0 resize-none outline-none custom-scrollbar min-h-[60px]" 
                placeholder="Elaborate on the purpose and context of this evaluation..."
              />
            </div>

            {/* Questions List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map(q => q.id!)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-6">
                  <AnimatePresence>
                    {questions.map((question) => (
                      <motion.div key={question.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
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

            {/* Visual Placeholder for New Field */}
            <div className="w-full h-24 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center group hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all cursor-pointer" onClick={() => addQuestion('short_text')}>
               <div className="flex items-center gap-3 text-slate-600 group-hover:text-indigo-400 transition-colors">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm font-black uppercase tracking-widest">Append Data Point</span>
               </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 shrink-0 border-l border-white/5 bg-[#1e1b2e] flex flex-col hidden lg:flex z-10">
          <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
            <Settings className="h-4 w-4 text-indigo-500" />
            <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Property Inspector</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeId === 'title' ? (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Academic Department</Label>
                    <select 
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">Select Target Entity</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Subject Entity</Label>
                    <select 
                      value={subjectRole}
                      onChange={(e) => setSubjectRole(e.target.value as FormRole)}
                      className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-bold rounded-xl p-3 outline-none"
                    >
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="HOD">Head of Dept</option>
                      <option value="STUDENT">Student Body</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Evaluator Audience</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["STUDENT", "INSTRUCTOR", "HOD", "ADMIN"].map(role => (
                        <button
                          key={role}
                          onClick={() => toggleRole(role as FormRole)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all border",
                            evaluatorRoles.includes(role as FormRole)
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-[#0f111a] border-white/5 text-slate-500 hover:text-slate-300"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Anonymize Responses</span>
                      <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Availability Status</span>
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeQuestion ? (
              <div className="space-y-8 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-[#0f111a] border border-white/5 flex flex-col gap-2">
                   <span className="text-[9px] font-black text-slate-600 uppercase">Field Classification</span>
                   <div className="flex items-center gap-3">
                      <Lock className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">{activeQuestion.type.replace('_', ' ')}</span>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-200">Mandatory Data</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Require field completion</span>
                    </div>
                    <Switch checked={activeQuestion.required} onCheckedChange={(val) => updateQuestion(activeQuestion.id!, { required: val })} />
                  </div>
                  
                  {activeQuestion.type === "linear_scale" && (
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Scale Amplitude (1-10)</Label>
                      <Input 
                        type="number" min={1} max={10}
                        value={activeQuestion.scale?.max || 5}
                        onChange={(e) => updateQuestion(activeQuestion.id!, { scale: { min: 1, max: Number(e.target.value) } })}
                        className="bg-[#0f111a] border-white/10 text-white h-11 rounded-xl font-black text-center"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-white/5">
                  <Button 
                    variant="ghost"
                    onClick={() => deleteQuestion(activeId!)}
                    className="w-full py-6 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 text-xs font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                  >
                    <Trash2 className="h-4 w-4" /> Purge Data Point
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-20">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 leading-relaxed">Select a data node to inspect internal properties.</p>
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
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  )
}
