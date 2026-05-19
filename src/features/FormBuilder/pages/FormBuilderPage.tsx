import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
  Rocket,
  X,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Info,
  Search,
  AlertCircle,
  ChevronDown,
  CircleDot
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { QRCodeCanvas } from "qrcode.react"

import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Input } from "@/shared/components/ui/input"
import { Modal } from "@/shared/components/ui/Modal"
import { toast } from "sonner"

import type { Question, QuestionType, FormRole } from "../types/form.types"
import { QuestionCard } from "../components/QuestionCard"
import * as formApi from "../api/formApi"
import * as departmentApi from "@/shared/api/departmentApi"
import * as courseApi from "@/shared/api/courseApi"
import * as userAdminApi from "@/shared/api/userAdminApi"
import { uploadFile } from "@/shared/api/utilityApi"
import type { Department } from "@/shared/api/departmentApi"
import type { Course } from "@/shared/api/courseApi"
import type { AdminUser } from "@/shared/api/userAdminApi"

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



const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[100] w-48 p-2 rounded-xl backdrop-blur-md bg-black/80 border border-white/10 text-[10px] font-bold text-slate-200 shadow-2xl pointer-events-none text-center"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



export default function FormBuilderPage() {
  const navigate = useNavigate()
  const { formId } = useParams<{ formId: string }>()
  const [isLoading, setIsLoading] = useState(!!formId)

  // ─── Form Settings State ───
  const [category, setCategory] = useState<"GENERAL" | "SPECIALIZED">("SPECIALIZED")
  const [formTitle, setFormTitle] = useState("New Evaluation Template")
  const [formDescription, setFormDescription] = useState("Provide feedback for the academic quarter.")
  const [evaluatorRoles, setEvaluatorRoles] = useState<FormRole[]>(["STUDENT"])
  const [subjectRole, setSubjectRole] = useState<FormRole>("INSTRUCTOR")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [departmentId, setDepartmentId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [instructorId, setInstructorId] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<AdminUser[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [activeId, setActiveId] = useState<string | null>("q1")

  const [isPublishing, setIsPublishing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved")

  // Modals State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPreviewMobile, setIsPreviewMobile] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [previewUploads, setPreviewUploads] = useState<Record<string, { name: string, url: string, loading: boolean }>>({})
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  
  // AI Generator state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  // Sidebar Tabs
  const [sidebarTab, setSidebarTab] = useState<'form' | 'field'>('form')
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiStep, setAiStep] = useState(0)

  const [generatedFormId, setGeneratedFormId] = useState<string | null>(null)

  // Derived share link
  const effectiveFormId = formId || generatedFormId;
  const shareUrl = effectiveFormId 
    ? (category === "GENERAL" 
        ? `${window.location.origin}/public/form/${effectiveFormId}`
        : `${window.location.origin}/dashboard/forms/${effectiveFormId}`)
    : `${window.location.origin}/form/preview`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, courseData, userData] = await Promise.all([
          departmentApi.getAllDepartments(),
          courseApi.getCourses(),
          userAdminApi.getAllUsers()
        ])
        setDepartments(deptData)
        setCourses(courseData)
        setInstructors(userData.filter(u => u.role === 'INSTRUCTOR'))

        if (formId) {
          const form = await formApi.getForm(formId)
          setFormTitle(form.title)
          setFormDescription(form.description || "")
          setCategory(form.category || "SPECIALIZED")
          setEvaluatorRoles(form.evaluator_roles)
          setSubjectRole(form.course_id ? "COURSE" : form.subject_role)
          setIsAnonymous(form.is_anonymous)
          setIsActive(form.is_active)
          setDepartmentId(form.department_id || "")
          setCourseId(form.course_id || "")
          setInstructorId(form.instructor_id || "")

          if (form.questions && form.questions.length > 0) {
            // Defensive mapping: Ensure questions have required fields for their type
            const sanitizedQuestions = form.questions.map((q: any) => ({
              ...q,
              options: (q.type === "multiple_choice" || q.type === "checkbox") ? (q.options?.length ? q.options : ["Option 1", "Option 2"]) : undefined,
              scale: q.type === "linear_scale" ? (q.scale || { min: 1, max: 5 }) : undefined,
              file_config: q.type === "file" ? (q.file_config || { allowed_types: ["application/pdf"], max_size: 5242880 }) : undefined,
            }))
            setQuestions(sanitizedQuestions)
            setActiveId(sanitizedQuestions[0]._id || sanitizedQuestions[0].id || null)
          }
        }
      } catch (err) {
        console.error("Failed to load data")
        toast.error("Failed to load form architecture")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [formId])

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
      options: (type === "multiple_choice" || type === "checkbox") ? ["Option 1", "Option 2"] : undefined,
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

    // Validation for specialized fields
    const errors: Record<string, boolean> = {}
    if (category === "SPECIALIZED") {
      if (!departmentId) errors.department = true
      if (subjectRole === "COURSE") {
        if (!courseId) errors.course = true
        if (!instructorId) errors.instructor = true
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setActiveId('title') // Focus on properties to show cues
      return
    }
    setValidationErrors({})
    if (questions.length === 0) {
      toast.error("Please add at least one question")
      return
    }

    // ─── Backend Compliance Validation ───
    const actualSubjectRole = subjectRole === "COURSE" ? "INSTRUCTOR" : subjectRole;
    if (evaluatorRoles.includes(actualSubjectRole)) {
      toast.error(`Conflict: Evaluator roles cannot include the Subject role (${actualSubjectRole}).`)
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const qNum = i + 1

      if (q.label.trim().length < 3) {
        toast.error(`Question ${qNum}: Label must be at least 3 characters.`)
        return
      }

      if (q.type === "multiple_choice" || q.type === "checkbox") {
        if (!q.options || q.options.length < 2) {
          toast.error(`Question ${qNum}: Multiple choice requires at least 2 options.`)
          return
        }
        if (q.options.some(opt => opt.trim().length === 0)) {
          toast.error(`Question ${qNum}: All options must have content.`)
          return
        }
      }
    }

    setIsPublishing(true)
    try {
      let form;
      if (formId) {
        // 1. Update existing Form Settings
        form = await formApi.updateFormSettings(formId, {
          title: formTitle,
          description: formDescription,
          category: category,
          is_active: isActive,
          is_anonymous: isAnonymous
        })
      } else {
        // 1. Create the Form
        form = await formApi.createForm({
          title: formTitle,
          description: formDescription,
          category: category,
          evaluator_roles: evaluatorRoles,
          subject_role: actualSubjectRole,
          is_anonymous: isAnonymous,
          is_active: isActive,
          department_id: category === "SPECIALIZED" && departmentId ? departmentId : undefined,
          course_id: category === "SPECIALIZED" && subjectRole === "COURSE" && courseId ? courseId : undefined,
          instructor_id: category === "SPECIALIZED" && subjectRole === "COURSE" && instructorId ? instructorId : undefined,
        })
      }

      const currentFormId = formId || form._id || form.id;

      // 2. Sync Questions
      for (const q of questions) {
        const payload: any = {
          label: q.label,
          type: q.type,
          required: q.required,
          order: q.order,
        }

        if (q.type === 'multiple_choice' || q.type === 'checkbox') payload.options = q.options
        if (q.type === 'linear_scale') payload.scale = q.scale
        if (q.type === 'file') payload.file_config = q.file_config

        // If it has a MongoDB ID, it's an existing question
        const qId = q._id || (q.id?.length === 24 ? q.id : null);

        if (qId) {
          await formApi.updateQuestion(qId, payload)
        } else {
          await formApi.addQuestion(currentFormId, payload)
        }
      }

      if (formId) {
        toast.success("Form Architecture Updated!")
        navigate("/dashboard/forms-surveys")
      } else {
        toast.success("Form Architecture Published!")
        setGeneratedFormId(currentFormId)
        setIsShareOpen(true)
      }
    } catch (err: any) {
      console.error("Publishing Error:", err)
      const backendMessage = err.response?.data?.message || err.response?.data?.error || "Failed to publish architecture"
      toast.error(backendMessage)
    } finally {
      setIsPublishing(false)
    }
  }

  const toggleRole = (role: FormRole) => {
    setEvaluatorRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleCategoryChange = (newCategory: "GENERAL" | "SPECIALIZED") => {
    if (newCategory === category) return
    setCategory(newCategory)

    // Clear irrelevant fields to keep payload clean
    if (newCategory === "GENERAL") {
      setDepartmentId("")
      setCourseId("")
      setInstructorId("")
      setEvaluatorRoles(["STUDENT"]) // Reset to default
      setSubjectRole("INSTRUCTOR")   // Reset to default
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    toast.success("Share link copied to clipboard")
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please describe what you want the AI to generate.");
      return;
    }

    setIsAIGenerating(true);
    setAiStep(0);

    const stepTexts = [
      "Analyzing layout requirements...",
      "Structuring cognitive evaluation metrics...",
      "Synthesizing customized academic questions...",
      "Enforcing structural type integrity...",
      "Finalizing dynamic builder components..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < stepTexts.length) {
        setAiStep(currentStep);
      } else {
        clearInterval(interval);
      }
    }, 900);

    try {
      const generated = await formApi.generateAIForm(aiPrompt);
      clearInterval(interval);

      const { title, description, questions: generatedQuestions } = generated;

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("No questions were generated by the AI.");
      }

      const mappedQuestions = generatedQuestions.map((q: any, idx: number) => ({
        id: `q-ai-${Math.random().toString(36).substr(2, 9)}`,
        type: q.type,
        label: q.label,
        required: !!q.required,
        order: idx + 1,
        options: (q.type === "multiple_choice" || q.type === "checkbox") ? (q.options?.length ? q.options : ["Option 1", "Option 2"]) : undefined,
        scale: q.type === "linear_scale" ? (q.scale || { min: 1, max: 5 }) : undefined,
        file_config: q.type === "file" ? { allowed_types: ["application/pdf"], max_size: 5242880 } : undefined
      }));

      setQuestions(mappedQuestions);
      setFormTitle(title || `${aiPrompt.substring(0, 30)} Assessment`);
      setFormDescription(description || `AI Generated survey based on: "${aiPrompt}"`);

      if (mappedQuestions.length > 0) {
        setActiveId(mappedQuestions[0].id!);
      }
      setIsAIModalOpen(false);
      setAiPrompt("");
      toast.success("AI form structure synthesized perfectly!");
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      const backendError = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to generate AI form architecture";
      toast.error(backendError);
    } finally {
      clearInterval(interval);
      setIsAIGenerating(false);
    }
  };

  const handlePreviewFileUpload = async (qId: string, file: File) => {
    setPreviewUploads(prev => ({ ...prev, [qId]: { name: file.name, url: "", loading: true } }))
    try {
      const res = await uploadFile(file)
      setPreviewUploads(prev => ({ ...prev, [qId]: { name: file.name, url: res.url, loading: false } }))
      toast.success(`File "${file.name}" provisioned successfully`)
    } catch (err) {
      toast.error("Failed to upload evidence package")
      setPreviewUploads(prev => {
        const next = { ...prev }
        delete next[qId]
        return next
      })
    }
  }

  const handleSimulatedSubmit = () => {
    toast.success("Survey Simulation Success: Data provisioned to local sandbox")
    setIsPreviewOpen(false)
    setPreviewAnswers({})
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-slate-100 overflow-hidden font-geist">
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
            onClick={() => setIsAIModalOpen(true)}
            className="h-10 flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 text-xs font-bold text-purple-400 transition-all hover:bg-purple-500 hover:text-white"
          >
            <Zap className="h-4 w-4" /> AI Generate
          </Button>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          {(formId || generatedFormId) && (
            <Button
              variant="ghost"
              onClick={() => setIsShareOpen(true)}
              className="h-10 px-4 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsPreviewOpen(true)}
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
                { type: 'multiple_choice', label: 'Multiple Choice', desc: 'Select from predefined options', icon: CircleDot },
                { type: 'checkbox', label: 'Checkbox', desc: 'Multiple selection', icon: CheckSquare },
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
                <div className="flex flex-col gap-6 relative">
                  <AnimatePresence>
                    {questions.map((question) => (
                      <motion.div key={question.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <QuestionCard
                          question={question}
                          isActive={activeId === question.id}
                          isSelected={false}
                          onSelect={() => { }}
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
                <span className="text-sm font-black uppercase tracking-widest">Append Data Node</span>
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

          {/* Tabs */}
          <div className="p-4 border-b border-white/5 bg-white/[0.01]">
            <div className="flex bg-[#0f111a] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setSidebarTab('form')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                  sidebarTab === 'form' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                ⚙️ Form Setup
              </button>
              <button
                onClick={() => setSidebarTab('field')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                  sidebarTab === 'field' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                🧩 Field Specs
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {sidebarTab === 'form' ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    {/* Category Selector */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Form Category</Label>
                      <div className="flex bg-[#0f111a] p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => handleCategoryChange("GENERAL")}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase transition-all",
                            category === "GENERAL" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          General
                        </button>
                        <button
                          onClick={() => handleCategoryChange("SPECIALIZED")}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase transition-all",
                            category === "SPECIALIZED" ? "bg-amber-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          Academic
                        </button>
                      </div>
                    </div>
                    {category === "GENERAL" ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-3">
                          <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Contextual Description</Label>
                          <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-medium rounded-xl p-3 outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none custom-scrollbar"
                            placeholder="Describe the purpose of this data collection..."
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <Label className={cn("text-[10px] uppercase font-black tracking-widest ml-1 transition-colors", validationErrors.department ? "text-red-400" : "text-slate-500")}>Academic Department</Label>
                          <select
                            value={departmentId}
                            onChange={(e) => {
                              setDepartmentId(e.target.value);
                              if (e.target.value) setValidationErrors(prev => ({ ...prev, department: false }));
                            }}
                            className={cn(
                              "w-full bg-[#0f111a] border text-white text-xs font-bold rounded-xl p-3 outline-none transition-all focus:border-indigo-500",
                              validationErrors.department ? "border-red-500/50" : "border-white/10"
                            )}
                          >
                            <option value="">Select Target Entity</option>
                            {departments.map(dept => (
                              <option key={dept._id || dept.id} value={dept._id || dept.id}>{dept.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Subject Entity</Label>
                          <select
                            value={subjectRole}
                            onChange={(e) => {
                              setSubjectRole(e.target.value as FormRole);
                              setCourseId("");
                              setInstructorId("");
                            }}
                            className="w-full bg-[#0f111a] border border-white/10 text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-indigo-500 transition-all"
                          >
                            <option value="INSTRUCTOR">Instructor</option>
                            <option value="COURSE">Course</option>
                            <option value="ADMIN">Administrator</option>
                            <option value="HOD">Head of Department</option>
                          </select>
                        </div>

                        {/* Cascading Logic: Select Course -> Select Instructor */}
                        <AnimatePresence>
                          {subjectRole === "COURSE" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-6 overflow-hidden"
                            >
                              <div className="space-y-3">
                                <Label className={cn("text-[10px] uppercase font-black tracking-widest ml-1 transition-colors", validationErrors.course ? "text-red-400" : "text-slate-500")}>Select Course</Label>
                                <div className="relative">
                                  <select 
                                    value={courseId}
                                    onChange={(e) => {
                                      const newCourseId = e.target.value;
                                      setCourseId(newCourseId);
                                      const selectedCourse = courses.find(c => (c._id || c.id) === newCourseId);
                                      const instId = selectedCourse?.instructorId 
                                        ? (typeof selectedCourse.instructorId === 'object' ? (selectedCourse.instructorId as any)._id || (selectedCourse.instructorId as any).id : selectedCourse.instructorId)
                                        : null;
                                        
                                      if (instId) {
                                        setInstructorId(instId);
                                        setValidationErrors(prev => ({ ...prev, course: false, instructor: false }));
                                      } else {
                                        setInstructorId("");
                                        if (newCourseId) setValidationErrors(prev => ({ ...prev, course: false }));
                                      }
                                    }}
                                    className={cn(
                                      "w-full bg-slate-800/80 text-white text-sm border rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all",
                                      validationErrors.course ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                                    )}
                                  >
                                    <option value="" disabled hidden>Choose Course...</option>
                                    {courses.filter(c => { 
                                      if(!departmentId) return true; 
                                      const raw = c.departmentId || (c as any).department_id; 
                                      const cId = typeof raw === 'object' && raw !== null ? raw._id || raw.id : raw; 
                                      return cId === departmentId; 
                                    }).map(course => (
                                      <option key={course._id || course.id} value={course._id || course.id}>{course.name}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                                </div>
                              </div>

                              <AnimatePresence>
                                {courseId && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden"
                                  >
                                    <Label className={cn("text-[10px] uppercase font-black tracking-widest ml-1 transition-colors", validationErrors.instructor ? "text-red-400" : "text-slate-500")}>Target Instructor</Label>
                                    <div className="relative">
                                      <select 
                                        value={instructorId}
                                        onChange={(e) => {
                                          setInstructorId(e.target.value);
                                          if (e.target.value) setValidationErrors(prev => ({ ...prev, instructor: false }));
                                        }}
                                        className={cn(
                                          "w-full bg-slate-800/80 text-white text-sm border rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all",
                                          validationErrors.instructor ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                                        )}
                                      >
                                        <option value="" disabled hidden>Select Instructor...</option>
                                        {(() => {
                                          const selectedCourse = courses.find(c => (c._id || c.id) === courseId);
                                          const instId = selectedCourse?.instructorId 
                                            ? (typeof selectedCourse.instructorId === 'object' ? (selectedCourse.instructorId as any)._id || (selectedCourse.instructorId as any).id : selectedCourse.instructorId)
                                            : null;
                                            
                                          const filteredInstructors = instId
                                            ? instructors.filter(inst => ((inst as any)._id || inst.id) === instId)
                                            : instructors;
                                            
                                          return filteredInstructors.map(inst => (
                                            <option key={(inst as any)._id || inst.id} value={(inst as any)._id || inst.id}>
                                              {inst.firstName} {inst.lastName}
                                            </option>
                                          ));
                                        })()}
                                      </select>
                                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-3">
                          <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Evaluator Audience</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["STUDENT", "INSTRUCTOR", "HOD"].map(role => (
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
                      </>
                    )}

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Anonymize Responses</span>
                          <Tooltip text="Hides respondent identity from the instructor and analytics dashboard.">
                            <Info className="h-3 w-3 text-slate-600 cursor-help hover:text-indigo-400 transition-colors" />
                          </Tooltip>
                        </div>
                        <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Availability Status</span>
                          <Tooltip text="Controls whether the form is currently open for submissions.">
                            <Info className="h-3 w-3 text-slate-600 cursor-help hover:text-indigo-400 transition-colors" />
                          </Tooltip>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : sidebarTab === 'field' ? (
              activeQuestion ? (
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

                  {(activeQuestion.type === "multiple_choice" || activeQuestion.type === "checkbox") && (
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Choice Options</Label>
                      <div className="space-y-2">
                        {activeQuestion.options?.map((opt, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const next = [...(activeQuestion.options || [])]
                                next[idx] = e.target.value
                                updateQuestion(activeQuestion.id!, { options: next })
                              }}
                              className="bg-[#0f111a] border-white/10 text-white h-9 rounded-lg text-xs"
                            />
                            <button
                              onClick={() => updateQuestion(activeQuestion.id!, { options: activeQuestion.options?.filter((_, i) => i !== idx) })}
                              className="p-2 text-slate-600 hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => updateQuestion(activeQuestion.id!, { options: [...(activeQuestion.options || []), `New Option`] })}
                          className="w-full text-[9px] uppercase font-black tracking-widest text-indigo-500 hover:bg-indigo-500/5"
                        >
                          + Add New Path
                        </Button>
                      </div>
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
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed">Select a question block on the canvas to inspect fields.</p>
                </div>
              )
            ) : null}
          </div>
        </aside>
      </main>

      {/* ── PREVIEW MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col overflow-hidden"
          >
            <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Preview Engine v1.0</span>
                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setIsPreviewMobile(false)}
                    className={cn("p-2 rounded-lg transition-all", !isPreviewMobile ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white")}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsPreviewMobile(true)}
                    className={cn("p-2 rounded-lg transition-all", isPreviewMobile ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-500 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-[#0f111a] p-8 md:p-20 custom-scrollbar">
              <div className={cn(
                "mx-auto transition-all duration-500 ease-in-out",
                isPreviewMobile ? "max-w-[375px] rounded-[3rem] border-[12px] border-[#1e1b2e] shadow-2xl h-[700px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#1e1b2e]" : "max-w-3xl"
              )}>
                <div className={cn("p-10 space-y-12", isPreviewMobile && "p-6")}>
                  <div className="space-y-4">
                    <h1 className={cn("font-black tracking-tight dark:text-white", isPreviewMobile ? "text-2xl" : "text-4xl")}>{formTitle}</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">{formDescription}</p>
                    <div className="h-1 w-20 bg-indigo-600 rounded-full"></div>
                  </div>

                  <div className="space-y-16">
                    {questions.map((q, i) => (
                      <div key={i} className="space-y-6">
                        <div className="flex items-start gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 text-sm font-black">{i + 1}</span>
                          <h3 className="text-lg font-bold dark:text-slate-100 leading-snug">{q.label}{q.required && <span className="text-red-500 ml-1">*</span>}</h3>
                        </div>

                        <div className="pl-12">
                          {q.type === 'short_text' && (
                            <Input
                              value={previewAnswers[q._id || q.id!] || ""}
                              onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [q._id || q.id!]: e.target.value }))}
                              placeholder="Short response text"
                              className="bg-transparent border-slate-300 dark:border-white/10"
                            />
                          )}
                          {q.type === 'long_text' && (
                            <textarea
                              value={previewAnswers[q._id || q.id!] || ""}
                              onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [q._id || q.id!]: e.target.value }))}
                              placeholder="Detailed narrative response"
                              className="w-full bg-transparent border border-slate-300 dark:border-white/10 rounded-xl p-4 min-h-[100px] text-sm focus:ring-indigo-500 outline-none transition-all"
                            />
                          )}
                          {q.type === 'multiple_choice' && (
                            <div className="space-y-3">
                              {q.options?.map((opt, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewAnswers(prev => ({ ...prev, [q._id || q.id!]: opt }))}
                                  className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                                    previewAnswers[q._id || q.id!] === opt
                                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                      : "border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] text-slate-500"
                                  )}
                                >
                                  <div className={cn(
                                    "h-4 w-4 rounded-full border-2 transition-all",
                                    previewAnswers[q._id || q.id!] === opt ? "border-indigo-500 bg-indigo-500" : "border-slate-400 dark:border-white/20"
                                  )}></div>
                                  <span className="text-sm font-medium">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'checkbox' && (
                            <div className="space-y-3">
                              {q.options?.map((opt, idx) => {
                                const qId = q._id || q.id!;
                                const selectedOpts = (previewAnswers[qId] as string[]) || [];
                                const isSelected = selectedOpts.includes(opt);
                                return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setPreviewAnswers(prev => {
                                      const current = (prev[qId] as string[]) || [];
                                      const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
                                      return { ...prev, [qId]: next };
                                    })
                                  }}
                                  className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                                    isSelected
                                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                      : "border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] text-slate-500"
                                  )}
                                >
                                  <div className={cn(
                                    "h-4 w-4 rounded-sm border-2 transition-all flex items-center justify-center",
                                    isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-400 dark:border-white/20"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <span className="text-sm font-medium">{opt}</span>
                                </div>
                              )})}
                            </div>
                          )}
                          {q.type === 'linear_scale' && (
                            <div className="flex flex-col gap-4">
                              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span>{q.scale?.min || 1} (Poor)</span>
                                <span>{q.scale?.max || 5} (Excellent)</span>
                              </div>
                              <div className="flex gap-2">
                                {Array.from({ length: (q.scale?.max || 5) }, (_, idx) => idx + 1).map(val => (
                                  <div
                                    key={val}
                                    onClick={() => setPreviewAnswers(prev => ({ ...prev, [q._id || q.id!]: val }))}
                                    className={cn(
                                      "h-12 flex-1 flex items-center justify-center rounded-xl border text-sm font-black transition-all cursor-pointer",
                                      previewAnswers[q._id || q.id!] === val
                                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                                        : "border-slate-200 dark:border-white/10 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-500"
                                    )}
                                  >
                                    {val}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {q.type === 'file' && (
                            <div className="space-y-4">
                              <label className={cn(
                                "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
                                previewUploads[q.id!]?.loading ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-300 dark:border-white/10 hover:border-indigo-500/30",
                                previewUploads[q.id!]?.url ? "border-emerald-500/30 bg-emerald-500/5" : ""
                              )}>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && handlePreviewFileUpload(q.id!, e.target.files[0])}
                                />
                                {previewUploads[q.id!]?.loading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                ) : previewUploads[q.id!]?.url ? (
                                  <Check className="h-8 w-8 text-emerald-500" />
                                ) : (
                                  <Upload className="h-8 w-8 opacity-20" />
                                )}
                                <div className="text-center">
                                  <span className="text-sm font-bold uppercase tracking-widest block dark:text-slate-200">
                                    {previewUploads[q.id!]?.loading ? "Uploading Evidence..." : previewUploads[q.id!]?.name || "Provision Evidence Package"}
                                  </span>
                                  {!previewUploads[q.id!]?.loading && (
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">
                                      {previewUploads[q.id!]?.url ? "File Ready for Submission" : "Click to select or drag & drop"}
                                    </span>
                                  )}
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 border-t border-slate-200 dark:border-white/5">
                    <Button
                      onClick={handleSimulatedSubmit}
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20"
                    >
                      Finalize Submission
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SHARE MODAL ──────────────────────────────────────────────────── */}
      <Modal
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Share2 className="h-4 w-4" />
            </div>
            <span className="font-black text-white uppercase tracking-widest">Distribute Architecture</span>
          </div>
        }
        size="sm"
      >
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="p-4 rounded-3xl bg-white shadow-2xl shadow-indigo-500/10">
              <QRCodeCanvas value={shareUrl} size={180} level="H" includeMargin />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Quantum Link Provisioned</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Any respondent with this encrypted link can participate in the data collection cycle.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Universal Resource Locator</Label>
            <div className="relative group">
              <Input
                readOnly
                value={shareUrl}
                className="bg-[#0f111a] border-white/10 text-indigo-400 h-12 pr-12 rounded-xl font-bold truncate focus:ring-indigo-500"
              />
              <button
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-500 font-bold leading-relaxed uppercase tracking-wider">
              Distributing this link will make the architecture accessible to anyone. Ensure target audience validation before broadcasting.
            </p>
          </div>
        </div>
      </Modal>

      {/* AI Generate Prompt Modal */}
      <Modal 
        open={isAIModalOpen} 
        onClose={() => !isAIGenerating && setIsAIModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 animate-pulse">
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <span className="font-black text-white uppercase tracking-widest">AI Form Synthesizer</span>
          </div>
        }
        size="md"
      >
        <div className="relative overflow-hidden font-geist py-2">
          {isAIGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border border-purple-500/20 flex items-center justify-center bg-purple-500/5">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                </div>
                <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-purple-500 text-white animate-bounce">
                  <Zap className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest animate-pulse">
                  Synthesizing Architecture...
                </h4>
                <p className="text-xs text-indigo-400 font-bold">
                  {[
                    "Analyzing layout requirements...",
                    "Structuring cognitive evaluation metrics...",
                    "Synthesizing customized academic questions...",
                    "Enforcing structural type integrity...",
                    "Finalizing dynamic builder components..."
                  ][aiStep]}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Generation Prompt</Label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full h-32 bg-[#0f111a] border border-white/10 text-white text-sm font-medium rounded-2xl p-4 outline-none focus:border-purple-500 transition-all resize-none custom-scrollbar shadow-inner"
                  placeholder="Describe what kind of evaluation or survey you want to generate. e.g., 'Generate an evaluation for a programming course with practical assignments, rating their instructor and code quality...'"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsAIModalOpen(false)}
                  className="h-12 px-6 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAIGenerate}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" /> Synthesize Survey
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

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
