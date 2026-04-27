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
  ChevronDown,
  Calendar,
  Zap,
  Lock,
  X,
  Copy,
  LayoutGrid,
  Bot
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Separator } from "@/shared/components/ui/separator"
import { Badge } from "@/shared/components/ui/badge"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Textarea } from "@/shared/components/ui/textarea"
import { Input } from "@/shared/components/ui/input"


import type { Question, QuestionType } from "../types/form.types"
import { QuestionCard } from "../components/QuestionCard"

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "rating",
    title: "How would you rate the manager's communication skills?",
    options: [],
    isSelected: false,
    isRequired: true,
  }
]

export default function FormBuilderPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [activeId, setActiveId] = useState<string | null>("q1")
  const [formTitle, setFormTitle] = useState("Q1 Manager 360 Review")
  const [formDescription, setFormDescription] = useState("Please provide honest feedback regarding your direct manager's performance this quarter. Your responses are strictly anonymous.")
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
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addQuestion = useCallback((type: QuestionType = "short_text") => {
    const newId = `q-${Math.random().toString(36).substr(2, 9)}`
    const newQuestion: Question = {
      id: newId,
      type,
      title: `New ${type.replace("_", " ")}`,
      options: type === "multiple_choice" ? [
        { id: "o1", label: "Option 1" }
      ] : [],
      isSelected: false,
      isRequired: false,
    }
    setQuestions(prev => [...prev, newQuestion])
    setActiveId(newId)
    
    setTimeout(() => {
        const el = document.getElementById(newId)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
    setSaveStatus("Saving...")
    setTimeout(() => setSaveStatus("Saved"), 1000)
  }, [])

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
              className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 w-48 md:w-64 p-0 focus:outline-none"
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
            <Zap className="h-3.5 w-3.5" /> Generate via AI
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
            onClick={() => setIsPublishModalOpen(true)}
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Form Library</h3>
            <p className="text-[10px] text-slate-500 mt-1">Click to add to canvas</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 mb-3">Standard Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'short_text', label: 'Short Text', icon: Type },
                  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
                  { type: 'multiple_choice', label: 'Multi Choice', icon: CheckSquare },
                  { type: 'rating', label: 'Rating Scale', icon: Star },
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

            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 mb-3">Advanced Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'file_upload', label: 'File Upload', icon: Upload },
                  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
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
                <button 
                  onClick={() => addQuestion('date')}
                  className="col-span-2 flex flex-row items-center justify-center gap-2 p-3 rounded-xl border border-white/5 bg-[#0f111a] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-slate-300 group"
                >
                  <Calendar className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                  <span className="text-[10px] font-medium text-center">Date Picker</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-purple-400 mb-3 flex items-center gap-1">
                <Bot className="h-3.5 w-3.5" /> AI-Powered Blocks
              </h4>
              <div className="space-y-2">
                {[
                  { type: 'ai_sentiment', label: 'AI Sentiment Input', desc: 'Auto-analyzes tone & mood', icon: Bot },
                  { type: 'skill_matrix', label: 'Skill Matrix', desc: 'Multi-dimensional rating', icon: LayoutGrid },
                ].map((field) => (
                  <button 
                    key={field.type}
                    onClick={() => addQuestion(field.type as QuestionType)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-left group"
                  >
                    <field.icon className="h-5 w-5 text-purple-400 group-hover:animate-pulse" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-200">{field.label}</p>
                      <p className="text-[9px] text-slate-500">{field.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <section className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar" id="canvas-container">
          {/* Grid Background */}
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
                items={questions.map(q => q.id)}
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
                          isSelected={false} // Selection removed for copy-UI focus
                          onSelect={() => {}}
                          onActivate={setActiveId}
                          onDelete={deleteQuestion}
                          onUpdate={updateQuestion}
                          onOpenProperties={() => setActiveId(question.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>

            {/* Add New Hover Area */}
            <div 
              className="w-full py-2 group cursor-pointer mt-4" 
              onClick={() => addQuestion('short_text')}
            >
              <div className="flex items-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex-1 h-px bg-indigo-500/30"></div>
                <div className="w-8 h-8 rounded-full bg-[#1e1b2e] border border-indigo-500 text-indigo-500 flex items-center justify-center mx-3 shadow-[0_0_15px_rgba(79,70,229,0.3)] transform group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1 h-px bg-indigo-500/30"></div>
              </div>
              <p className="text-center text-[10px] font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">Click to add default question</p>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 shrink-0 border-l border-white/5 bg-[#1e1b2e] flex flex-col hidden lg:flex z-10">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Properties Panel</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {activeId === 'title' ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Form Settings</h4>
                  <p className="text-xs text-slate-400 mb-6">Global settings for this evaluation.</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#0f111a] p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-medium text-slate-300">Collect Emails</span>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between bg-[#0f111a] p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-medium text-slate-300">Anonymous Responses</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeQuestion ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Block Type</label>
                    <div className="bg-[#0f111a] border border-white/10 text-white text-sm rounded-lg py-2.5 px-3 flex items-center justify-between">
                      <span className="font-medium capitalize">{activeQuestion.type.replace('_', ' ')}</span>
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[#0f111a] p-3 rounded-lg border border-white/5 mt-4">
                    <span className="text-sm font-medium text-slate-300">Required Field</span>
                    <Switch 
                      checked={activeQuestion.isRequired}
                      onCheckedChange={(val) => updateQuestion(activeQuestion.id, { isRequired: val })}
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-white/5 my-6"></div>

                {(activeQuestion.type.startsWith('ai_') || activeQuestion.type === 'skill_matrix' || activeQuestion.type === 'rating') && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-purple-400" />
                        <label className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">AI Analysis Targeting</label>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Competency Tag</label>
                        <Input 
                          className="h-9 bg-[#0f111a] border-white/10 text-white text-sm"
                          placeholder="General"
                        />
                      </div>
                    </div>
                    <div className="h-px w-full bg-white/5 my-6"></div>
                  </>
                )}

                <Button 
                  variant="destructive"
                  onClick={() => deleteQuestion(activeQuestion.id)}
                  className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete Question
                </Button>
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm mt-10">
                <Settings className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Select a block in the canvas to view and edit its properties here.</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Modals - Simplified for now to focus on UI */}
      <AnimatePresence>
        {isAIModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#1e172e] to-[#171324] p-8 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsAIModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Generate Form with AI</h3>
                  <p className="text-xs text-slate-400">Describe your goal, and AI will structure the perfect evaluation.</p>
                </div>
              </div>
              
              <Textarea 
                className="w-full bg-black/30 border border-purple-500/30 focus:border-purple-400 rounded-xl p-4 text-sm text-white placeholder-slate-500 resize-none mb-4 min-h-[120px]"
                placeholder="e.g. Create a 360-degree performance review for software engineers focusing on code quality, teamwork, and leadership..."
              />
              
              <div className="flex flex-wrap gap-2 mb-6">
                {['+ Productivity Focus', '+ Anonymous', '+ Dept: Sales'].map(tag => (
                  <span key={tag} className="text-[11px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-slate-300 cursor-pointer hover:bg-white/10 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setIsAIModalOpen(false)} className="text-slate-300 hover:text-white">Cancel</Button>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold px-6">
                  <Zap className="h-4 w-4" /> Generate Form
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d2a42; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
      `}</style>
    </div>
  )
}
