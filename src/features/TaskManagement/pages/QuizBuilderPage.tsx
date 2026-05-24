import { useState, useCallback, useMemo, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
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
  ArrowLeft, Type, AlignLeft, Star, Zap, LayoutGrid, Loader2, Save, Rocket,
  CircleDot, CheckSquare, Settings, Target, BookOpen, Building2, Users, Search, X, Plus
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Modal } from "@/shared/components/ui/Modal"
import { toast } from "sonner"

import type { Question, QuestionType } from "@/features/FormBuilder/types/form.types"
import { QuestionCard } from "@/features/FormBuilder/components/QuestionCard"
import * as formApi from "@/features/FormBuilder/api/formApi"
import * as taskApi from "@/features/TaskManagement/api/taskApi"
import * as departmentApi from "@/shared/api/departmentApi"
import * as courseApi from "@/shared/api/courseApi"
import * as userAdminApi from "@/shared/api/userAdminApi"
import type { Department } from "@/shared/api/departmentApi"
import type { AdminUser } from "@/shared/api/userAdminApi"

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "multiple_choice",
    label: "Sample Question?",
    required: true,
    order: 1,
    options: ["Option 1", "Option 2"]
  }
]

export default function QuizBuilderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contextCourseId = searchParams.get('courseId')
  const contextDepartmentId = searchParams.get('departmentId')

  // Task Metadata State
  const [title, setTitle] = useState("New Quiz Assignment")
  const [description, setDescription] = useState("")
  const [rubric, setRubric] = useState("")
  const [deadline, setDeadline] = useState("")

  // Target Selection State
  const [targetType, setTargetType] = useState<'COURSE' | 'DEPARTMENT' | 'SPECIFIC'>(
    contextCourseId ? 'COURSE' : contextDepartmentId ? 'DEPARTMENT' : 'COURSE'
  )
  const [deptId, setDeptId] = useState(contextDepartmentId || '')
  const [departments, setDepartments] = useState<Department[]>([])
  const [allStudents, setAllStudents] = useState<AdminUser[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [contextCourseName, setContextCourseName] = useState<string>('')
  const isDeptLocked = !!contextDepartmentId

  // Questions State
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [activeId, setActiveId] = useState<string | null>("q1")

  const [isPublishing, setIsPublishing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved")

  // AI Generator state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiStep, setAiStep] = useState(0)

  useEffect(() => {
    if (contextCourseId) {
      courseApi.getCourseById(contextCourseId)
        .then(c => setContextCourseName(c.name))
        .catch(() => console.error('Failed to fetch context course'))
    }
  }, [contextCourseId])

  useEffect(() => {
    departmentApi.getAllDepartments()
      .then(setDepartments)
      .catch(() => console.error('Failed to fetch departments'))
  }, [])

  useEffect(() => {
    if (targetType === 'SPECIFIC' && allStudents.length === 0) {
      setIsLoadingUsers(true)
      userAdminApi.getAllUsers()
        .then(users => setAllStudents(users.filter(u => u.role === 'STUDENT')))
        .catch(() => toast.error('Failed to load student directory'))
        .finally(() => setIsLoadingUsers(false))
    }
  }, [targetType, allStudents.length])

  const filteredStudents = allStudents.filter(s =>
    s.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const toggleStudent = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id])
  }

  const activeQuestion = useMemo(() => questions.find(q => q.id === activeId) || null, [questions, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
      required: true,
      order: questions.length + 1,
      options: (type === "multiple_choice" || type === "checkbox") ? ["Option 1", "Option 2"] : undefined,
      scale: type === "linear_scale" ? { min: 1, max: 5 } : undefined,
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
    // 1. Validate Task Inputs
    if (!title.trim() || !description.trim() || !deadline || !rubric.trim()) {
      toast.error("Please fill in all task fields: Title, Description, Deadline, and AI Rubric.")
      return
    }
    if (targetType === 'DEPARTMENT' && !contextDepartmentId && !deptId) {
      toast.error("Please select a target department.")
      return
    }
    if (targetType === 'SPECIFIC' && selectedUserIds.length === 0) {
      toast.error("Please select at least one student.")
      return
    }

    // 2. Validate Questions
    if (questions.length === 0) {
      toast.error("Please add at least one question to the quiz.")
      return
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (q.label.trim().length < 3) {
        toast.error(`Question ${i + 1}: Label must be at least 3 characters.`)
        return
      }
      if ((q.type === "multiple_choice" || q.type === "checkbox") && (!q.options || q.options.length < 2)) {
        toast.error(`Question ${i + 1}: Requires at least 2 options.`)
        return
      }
    }

    setIsPublishing(true)
    try {
      const form = await formApi.createForm({
        title,
        description,
        category: 'QUIZ',
        // evaluator_roles: ['STUDENT'],
        // subject_role: 'INSTRUCTOR',
        is_anonymous: false,
        is_active: true,
        course_id: contextCourseId || undefined,
        department_id: contextDepartmentId || deptId || undefined
      })

      const currentFormId = form._id || form.id

      // 4. Save Questions to the created form
      for (const q of questions) {
        const payload: any = { label: q.label, type: q.type, required: q.required, order: q.order }
        if (q.type === 'multiple_choice' || q.type === 'checkbox') payload.options = q.options
        if (q.type === 'linear_scale') payload.scale = q.scale
        await formApi.addQuestion(currentFormId, payload)
      }

      // 5. Create the Task utilizing the new form_id
      const targetPayload: any = {}
      if (targetType === 'COURSE') targetPayload.course_id = contextCourseId
      else if (targetType === 'DEPARTMENT') targetPayload.department_id = contextDepartmentId || deptId
      else if (targetType === 'SPECIFIC') targetPayload.specific_users = selectedUserIds

      await taskApi.createTask({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        ai_grading_rubric: rubric,
        task_type: 'QUIZ',
        target: targetPayload,
        status: 'ACTIVE',
        form_id: currentFormId
      })

      toast.success("Quiz Task created successfully!")
      navigate("/dashboard/tasks") // Assuming /tasks resolves correctly for instructor contexts
    } catch (err: any) {
      console.error("Publishing Error:", err)
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to publish Quiz Task")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please describe what you want the AI to generate.")
      return
    }
    setIsAIGenerating(true)
    setAiStep(0)
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep < 5) setAiStep(currentStep)
      else clearInterval(interval)
    }, 900)

    try {
      const generated = await formApi.generateAIForm(aiPrompt)
      clearInterval(interval)
      const mappedQuestions = generated.questions.map((q: any, idx: number) => ({
        id: `q-ai-${Math.random().toString(36).substr(2, 9)}`,
        type: q.type,
        label: q.label,
        required: !!q.required,
        order: idx + 1,
        options: (q.type === "multiple_choice" || q.type === "checkbox") ? (q.options?.length ? q.options : ["Option 1", "Option 2"]) : undefined,
        scale: q.type === "linear_scale" ? (q.scale || { min: 1, max: 5 }) : undefined,
      }))
      setQuestions(mappedQuestions)
      if (mappedQuestions.length > 0) setActiveId(mappedQuestions[0].id)
      setIsAIModalOpen(false)
      setAiPrompt("")
      toast.success("AI quiz synthesized perfectly!")
    } catch (err: any) {
      clearInterval(interval)
      toast.error("Failed to generate AI quiz structure")
    } finally {
      setIsAIGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-slate-100 overflow-hidden font-geist">
      <header className="shrink-0 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#0a0a0f] px-6 z-20 relative">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl hover:bg-white/5 text-slate-400">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-indigo-500" />
            <div className="flex flex-col">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent text-sm font-black text-white border-none focus:ring-0 w-64 p-0 focus:outline-none" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                {saveStatus === 'Saving...' ? <Loader2 className="h-2 w-2 animate-spin" /> : <Save className="h-2 w-2" />}
                Draft Sync: {saveStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAIModalOpen(true)} className="h-10 flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 text-xs font-bold text-purple-400 hover:bg-purple-500 hover:text-white">
            <Zap className="h-4 w-4" /> AI Synthesize Survey
          </Button>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <Button onClick={handlePublish} disabled={isPublishing} className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-500/20">
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publish Quiz Task
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Component Library Sidebar */}
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
                { type: 'multiple_choice', label: 'Multiple Choice', desc: 'Select from predefined options', icon: CircleDot },
                { type: 'checkbox', label: 'Checkbox', desc: 'Multiple selection', icon: CheckSquare },
                { type: 'linear_scale', label: 'Linear Scale', desc: 'Numerical rating (1-10)', icon: Star }
              ].map((field) => (
                <button
                  key={field.type}
                  onClick={() => addQuestion(field.type as QuestionType)}
                  className="group flex flex-col items-start p-4 rounded-2xl bg-[#0f111a] border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3 w-full mb-2">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <field.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-indigo-300">{field.label}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 leading-relaxed">{field.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 bg-[#0a0a0f] overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0a0a0f] to-[#0a0a0f] pointer-events-none" />
          <div className="max-w-3xl mx-auto py-12 px-6 relative z-10 space-y-8">

            {/* Task Metadata UI Block */}
            <div className="p-8 rounded-3xl bg-[#13151f] border border-indigo-500/20 shadow-2xl space-y-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-indigo-400" /> Task Specification
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Task Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Context / Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-[#0f111a] border-white/10 text-white rounded-xl" />
                </div>

                {/* Delivery Target Tabs UI (Migrated from TaskModal) */}
                <div className="flex flex-col gap-4 mt-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Delivery Target</Label>
                  <Tabs value={targetType} onValueChange={(v) => setTargetType(v as any)} className="w-full">
                    <TabsList className={`grid w-full bg-[#0f111a] p-1 rounded-xl h-12 border border-white/5 ${contextCourseId ? 'grid-cols-1' : contextDepartmentId ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {(!contextDepartmentId || contextCourseId) && (
                        <TabsTrigger value="COURSE" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 font-bold text-xs flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5" /> Course
                        </TabsTrigger>
                      )}
                      {!contextCourseId && (
                        <TabsTrigger value="DEPARTMENT" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 font-bold text-xs flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" /> Dept
                        </TabsTrigger>
                      )}
                      {!contextCourseId && (
                        <TabsTrigger value="SPECIFIC" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 font-bold text-xs flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" /> Specific
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {targetType === 'COURSE' && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/80">
                      <BookOpen className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Course Bound Delivery</span>
                        <span className="text-sm font-bold text-slate-200">
                          Target: {contextCourseId ? (contextCourseName || 'Loading...') : 'Inherited from View Context'}
                        </span>
                      </div>
                    </div>
                  )}
                  {targetType === 'DEPARTMENT' && (
                    <div className="flex flex-col gap-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Department</Label>
                      <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none z-10" />
                        <select
                          value={deptId}
                          onChange={(e) => setDeptId(e.target.value)}
                          disabled={isDeptLocked}
                          className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#0f111a] border border-white/10 text-white text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="">-- Choose Department --</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {targetType === 'SPECIFIC' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <Input
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search student directory..."
                            className="bg-[#0f111a] border-white/10 text-white h-11 pl-11 rounded-xl"
                          />
                        </div>
                        {selectedUserIds.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds([])} className="text-xs text-red-400 hover:bg-red-400/10">Clear {selectedUserIds.length}</Button>
                        )}
                      </div>
                      <ScrollArea className="max-h-60 rounded-xl border border-white/5 bg-[#0f111a]/50 p-2">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center gap-3 py-10"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {filteredStudents.map((s) => (
                              <div
                                key={s.id}
                                onClick={() => toggleStudent(s.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedUserIds.includes(s.id) ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-transparent border-white/5'}`}
                              >
                                <Checkbox checked={selectedUserIds.includes(s.id)} className="data-[state=checked]:bg-indigo-600" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-white truncate">{s.firstName} {s.lastName}</span>
                                  <span className="text-[9px] font-medium text-slate-500 truncate">{s.email}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Submission Deadline</Label>
                    <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} onClick={(e) => (e.currentTarget as any).showPicker?.()} className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500" required />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">AI Grading Rubric <span className="text-red-400">*</span></Label>
                  <Textarea value={rubric} onChange={(e) => setRubric(e.target.value)} placeholder="Provide specific instructions for the AI evaluator (e.g., 'Check for logical consistency, award points if...')" rows={4} className="bg-[#0f111a] border-white/10 text-white rounded-xl resize-none focus:ring-indigo-500" required />
                </div>
              </div>
            </div>

            {/* Questions Canvas */}
            <div className="p-8 rounded-3xl bg-[#13151f] border border-white/5 space-y-8">
              <h2 className="text-lg font-black text-white mb-6 uppercase tracking-wider border-b border-white/10 pb-4">Quiz Questions</h2>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map((q) => q.id!)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {questions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        isActive={activeId === q.id}
                        isSelected={false}
                        onSelect={() => { }}
                        onActivate={setActiveId}
                        onDelete={deleteQuestion}
                        onUpdate={updateQuestion}
                        onOpenProperties={() => setActiveId(q.id!)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {questions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                    <CircleDot className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Architect Your Assignment</h3>
                  <p className="text-sm font-medium text-slate-400 text-center max-w-sm">Select a component from the left library to inject your first evaluation point.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Field Specs */}
        <aside className="w-80 shrink-0 border-l border-white/5 bg-[#1e1b2e] flex flex-col hidden xl:flex z-10">
          <div className="flex border-b border-white/5 p-2 bg-[#13151f]">
            <div className="flex-1 rounded-lg bg-[#2a2d3d] text-white flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all shadow-sm">
              <Settings className="h-4 w-4" /> Field Specs
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {!activeQuestion ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                <Settings className="h-8 w-8 mb-4" />
                <p className="text-xs font-bold text-center">Focus a component<br />to access properties</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Component Constraints</h4>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#13151f] border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">Required Field</span>
                      <span className="text-[10px] text-slate-400 font-medium">Mandatory response</span>
                    </div>
                    <Checkbox
                      checked={activeQuestion.required}
                      onCheckedChange={(checked) => updateQuestion(activeQuestion.id!, { required: !!checked })}
                      className="border-white/20 data-[state=checked]:bg-indigo-600"
                    />
                  </div>
                </div>

                {(activeQuestion.type === "multiple_choice" || activeQuestion.type === "checkbox") && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Option Topology</h4>
                    <div className="space-y-3">
                      {activeQuestion.options?.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(activeQuestion.options || [])]
                              newOpts[i] = e.target.value
                              updateQuestion(activeQuestion.id!, { options: newOpts })
                            }}
                            className="bg-[#13151f] border-white/10 text-white h-10 rounded-xl"
                            placeholder={`Option ${i + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newOpts = activeQuestion.options?.filter((_, idx) => idx !== i)
                              updateQuestion(activeQuestion.id!, { options: newOpts })
                            }}
                            className="h-10 w-10 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newOpts = [...(activeQuestion.options || []), `Option ${(activeQuestion.options?.length || 0) + 1}`]
                          updateQuestion(activeQuestion.id!, { options: newOpts })
                        }}
                        className="w-full h-10 rounded-xl border-dashed border-white/20 bg-transparent hover:bg-white/5 text-slate-300 font-bold text-xs"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Inject Option
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* AI Generate Modal */}
      <Modal open={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="" size="lg" className="bg-[#0a0a0f] border-white/10">
        <div className="p-2 border-b border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20"><Zap className="h-5 w-5 text-purple-400" /></div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">AI Quiz Synthesis</h2>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-0.5">Automated Architecture Generation</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {!isAIGenerating ? (
            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-300">Synthesis Prompt</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., Design a 5-question quiz evaluating student understanding of React Hooks..."
                className="min-h-[120px] bg-[#13151f] border-white/10 text-white rounded-2xl resize-none p-4 placeholder:text-slate-600 focus:ring-purple-500"
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsAIModalOpen(false)} className="text-slate-400 hover:text-white rounded-xl">Cancel</Button>
                <Button onClick={handleAIGenerate} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 px-6 font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Synthesize
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-[30px] opacity-20 rounded-full animate-pulse" />
                <div className="h-20 w-20 bg-[#13151f] border border-purple-500/30 rounded-2xl flex items-center justify-center relative z-10">
                  <Zap className="h-8 w-8 text-purple-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-lg font-black text-white">Synthesizing Architecture</h3>
                <div className="h-4 overflow-hidden relative w-64 text-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={aiStep}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="absolute inset-0 text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >
                      {["Initializing AI Engine...", "Formulating Questions...", "Structuring Topologies...", "Finalizing Quiz..."][aiStep] || "Completing..."}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
