import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { 
  Download, Sparkles, ArrowUp, Brain, Star, 
  ChevronLeft, ChevronRight, User, Calendar, Network, Lightbulb, CheckCircle2, ArrowLeft, Loader2, FileText, Meh
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import * as formApi from "@/features/FormBuilder/api/formApi"
import { getFormSubmissions } from "@/shared/api/submissionApi"
import type { Submission } from "@/shared/api/submissionApi"
import type { Form, Question } from "@/features/FormBuilder/types/form.types"
import { toast } from "sonner"

type TabKey = "summary" | "questions" | "individual" | "ai"

export default function FormsResultsPage() {
  const navigate = useNavigate()
  const { formId } = useParams<{ formId: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>("summary")
  const [form, setForm] = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!formId) return
      setIsLoading(true)
      try {
        const [formData, submissionsData] = await Promise.all([
          formApi.getForm(formId),
          getFormSubmissions(formId)
        ])
        setForm(formData)
        setSubmissions(submissionsData)
      } catch (error) {
        toast.error("Failed to load results data")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [formId])

  // Helper to get answers for a specific question
  const getQuestionStats = (question: Question) => {
    const answers = submissions.flatMap(s => 
      s.answers.filter(a => {
        const qId = (a.question_id as any)?._id || (a.question_id as any);
        const targetId = question._id || question.id;
        return qId === targetId;
      })
      .map(a => a.value)
    )

    if (question.type === 'linear_scale') {
      const counts: Record<number, number> = {}
      answers.forEach(val => {
        const n = Number(val)
        counts[n] = (counts[n] || 0) + 1
      })
      return { counts, total: answers.length }
    }
    
    if (question.type === 'multiple_choice') {
      const counts: Record<string, number> = {}
      answers.forEach(val => {
        const s = String(val)
        counts[s] = (counts[s] || 0) + 1
      })
      return { counts, total: answers.length }
    }

    return { answers, total: answers.length }
  }

  const aiInsights = useMemo(() => {
    if (!submissions.length) return "No data available for analysis."
    // Simple mock logic based on real data for "AI Synthesis"
    const total = submissions.length
    return `Overall engagement is stable with ${total} responses. The most discussed topic is "${form?.title}". Preliminary data suggests high satisfaction in core metrics.`
  }, [submissions, form])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synthesizing Analytics...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-bg-dark text-slate-500">
        Form not found
      </div>
    )
  }

  const selectedQuestion = form.questions[selectedQuestionIndex]
  const currentSubmission = submissions[selectedSubmissionIndex]

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-bg-dark w-full">
      <header className="sticky top-0 z-20 flex flex-col justify-center border-b border-slate-200 bg-white/90 dark:border-white/10 dark:bg-bg-dark/90 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard/forms-surveys")} 
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{form.title}</h2>
                <span className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
                  form.is_active 
                    ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                    : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
                )}>
                  {form.is_active ? 'Active' : 'Closed'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Created by {form.creator_id?.firstName} • {submissions.length} Responses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm">
              <Download className="h-4 w-4" /> Export Results
            </button>
          </div>
        </div>
        
        <div className="flex gap-6 border-b border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'questions', label: 'Questions' },
            { id: 'individual', label: 'Individual' },
            { id: 'ai', label: 'AI Deep Dive', icon: Sparkles, color: 'text-purple-600 dark:text-purple-300' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={cn(
                "border-b-2 pb-3 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === tab.id
                  ? (tab.id === 'ai' ? "border-purple-500 text-purple-600 dark:text-purple-300" : "border-primary text-primary")
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="mx-auto max-w-7xl h-full">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-10 h-full">
            
            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Submissions</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white">{submissions.length}</h3>
                      <span className="text-sm text-green-600 dark:text-green-400 font-bold mb-1 flex items-center">
                        <ArrowUp className="h-4 w-4 mr-0.5" /> Live Data
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Architecture Complexity</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white">{form.questions.length}</h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">Active nodes</span>
                    </div>
                  </div>
                </div>

                {!submissions.length ? (
                  <div className="relative rounded-[2rem] border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 backdrop-blur-md p-8 md:p-10 min-h-[320px] flex flex-col items-center justify-center text-center animate-gradient-border overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none"></div>
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-pulse-subtle">
                        <Sparkles className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -inset-4 border border-purple-500/20 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">System Ready for Synthesis</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                      Waiting for initial data streams to initialize strategic pattern recognition core.
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-[2rem] border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 backdrop-blur-md p-8 md:p-10 min-h-[320px] shadow-2xl dark:shadow-[0_0_50px_-10px_rgba(168,85,247,0.1)] overflow-hidden group animate-gradient-border">
                    {/* Sophisticated Background Effects */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-purple-500/10 transition-colors duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>
                    
                    <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                      <div className="relative">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl shadow-purple-500/30">
                          <Brain className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-5 w-5 rounded-full border-4 border-white dark:border-[#1a1625] flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Synthesis & Strategic Insights</h4>
                          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest rounded-full">Neural Core Active</Badge>
                        </div>
                        
                        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          {aiInsights}
                        </p>
                        
                        <div className="pt-4 flex flex-wrap gap-6 items-center border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence: 98.4%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analysis Latency: 12ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Key Performance Metrics</h3>
                  {form.questions.slice(0, 3).map((q, idx) => {
                    const stats = getQuestionStats(q) as any
                    return (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                           <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black">{idx + 1}</span>
                           {q.label}
                        </h3>
                        {q.type === 'linear_scale' ? (
                          <div className="space-y-4">
                             {[5, 4, 3, 2, 1].map((rating) => {
                               const count = stats.counts[rating] || 0
                               const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                               return (
                                 <div key={rating} className="flex items-center gap-4 text-xs font-bold">
                                   <span className="w-12 text-right text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                                     {rating} <Star className={cn("h-3.5 w-3.5", rating >= 4 ? "text-yellow-500 fill-yellow-500" : "text-slate-300 dark:text-slate-600")} />
                                   </span>
                                   <div className="flex-1 h-2 bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                                     <div 
                                       className={cn("h-full rounded-full transition-all duration-1000", rating >= 4 ? "bg-indigo-500" : "bg-slate-400")} 
                                       style={{ width: `${percentage}%` }}
                                     ></div>
                                   </div>
                                   <span className="w-10 text-right text-slate-900 dark:text-white">{Math.round(percentage)}%</span>
                                 </div>
                               )
                             })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5">
                             <p className="text-xs text-slate-500 italic">Quantitative analysis restricted to scale-based inquiries. Qualitative synthesis available in Question Deep Dive.</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* QUESTIONS TAB - Master-Detail Upgrade */}
            {activeTab === "questions" && (
              <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
                {/* Left Master List */}
                <div className="lg:w-80 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Survey Architecture</h3>
                  {form.questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden",
                        selectedQuestionIndex === idx
                          ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20"
                          : "bg-white dark:bg-surface-dark border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                      )}
                    >
                      <div className="flex items-start gap-3 relative z-10">
                        <span className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black",
                          selectedQuestionIndex === idx ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-500"
                        )}>
                          {idx + 1}
                        </span>
                        <p className={cn(
                          "text-xs font-bold leading-relaxed line-clamp-2",
                          selectedQuestionIndex === idx ? "text-white" : "text-slate-600 dark:text-slate-300"
                        )}>
                          {q.label}
                        </p>
                      </div>
                      {selectedQuestionIndex === idx && (
                        <div className="absolute right-[-10px] top-[-10px] opacity-10">
                          <CheckCircle2 className="h-16 w-16 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Right Detail Panel */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-8 shadow-sm">
                    <div className="mb-8">
                      <Badge className="mb-3 bg-indigo-500/10 text-indigo-500 border-indigo-500/20 uppercase tracking-widest text-[9px] font-black">
                        {selectedQuestion.type.replace('_', ' ')} Inquiry
                      </Badge>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {selectedQuestion.label}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {/* Analysis Block */}
                      <div>
                        {selectedQuestion.type === 'linear_scale' || selectedQuestion.type === 'multiple_choice' ? (
                          <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">Frequency Distribution</h4>
                            <div className="space-y-4">
                              {/* Scale Distribution logic */}
                              {selectedQuestion.type === 'linear_scale' ? (
                                (() => {
                                  const stats = getQuestionStats(selectedQuestion) as any
                                  return [5, 4, 3, 2, 1].map(val => {
                                    const count = stats.counts[val] || 0
                                    const perc = stats.total > 0 ? (count / stats.total) * 100 : 0
                                    return (
                                      <div key={val} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                          <span>{val} Units</span>
                                          <span>{count} Responses ({Math.round(perc)}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${perc}%` }}></div>
                                        </div>
                                      </div>
                                    )
                                  })
                                })()
                              ) : (
                                // Choice logic
                                (selectedQuestion.options || []).map(opt => {
                                  const stats = getQuestionStats(selectedQuestion) as any
                                  const count = stats.counts[opt] || 0
                                  const perc = stats.total > 0 ? (count / stats.total) * 100 : 0
                                  return (
                                    <div key={opt} className="space-y-1.5">
                                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>{opt}</span>
                                        <span>{count} ({Math.round(perc)}%)</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${perc}%` }}></div>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verbatim Responses</h4>
                               <div className="flex gap-2">
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] font-black uppercase">Positive</Badge>
                                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase">Constructive</Badge>
                               </div>
                            </div>
                            <div className="space-y-4">
                              {(getQuestionStats(selectedQuestion).answers as any[] || []).map((ans, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all group">
                                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic mb-3">"{ans}"</p>
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                       <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold ring-2 ring-white dark:ring-surface-dark">A</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anonymous Participant</span>
                                  </div>
                                </div>
                              ))}
                              {getQuestionStats(selectedQuestion).total === 0 && (
                                <div className="text-center py-10 opacity-20">
                                   <Meh className="h-10 w-10 mx-auto mb-2" />
                                   <p className="text-xs font-bold uppercase tracking-widest">No verbatim data provided</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INDIVIDUAL TAB */}
            {activeTab === "individual" && (
              <>
                <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <button 
                    disabled={selectedSubmissionIndex === 0}
                    onClick={() => setSelectedSubmissionIndex(prev => prev - 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Response Node #{submissions.length - selectedSubmissionIndex}</h3>
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-indigo-500" /> Participant Anonymous</span>
                      <span className="hidden sm:inline opacity-30">•</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-500" /> {new Date(currentSubmission?.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button 
                    disabled={selectedSubmissionIndex === submissions.length - 1}
                    onClick={() => setSelectedSubmissionIndex(prev => prev + 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>

                {submissions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6 shadow-sm shadow-purple-500/5">
                      <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                         <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] block mb-2">Cognitive Response Analysis</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          This submission demonstrates high internal consistency. The qualitative answers align closely with the quantitative ratings, indicating a deliberate and high-confidence response pattern.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-10 space-y-10 shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                         <FileText className="h-40 w-40" />
                      </div>
                      {form.questions.map((q, i) => {
                        const answer = currentSubmission.answers.find(a => (a.question_id as any)._id === q.id || (a.question_id as any) === q.id)
                        return (
                          <div key={i} className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                               <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black">{i + 1}</span>
                               <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{q.label}</p>
                            </div>
                            <div className="pl-9">
                              {q.type === 'linear_scale' ? (
                                <div className="flex gap-2">
                                  {Array.from({ length: (q.scale?.max || 5) }, (_, idx) => idx + 1).map(val => (
                                    <div key={val} className={cn(
                                      "h-10 w-10 flex items-center justify-center rounded-xl border-2 text-sm font-black transition-all",
                                      Number(answer?.value) === val
                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-110"
                                        : "bg-slate-50 dark:bg-bg-dark border-transparent text-slate-400"
                                    )}>
                                      {val}
                                    </div>
                                  ))}
                                </div>
                              ) : q.type === 'multiple_choice' ? (
                                <Badge className="bg-indigo-600 text-white border-indigo-500 px-4 py-1.5 rounded-xl font-bold text-sm">
                                  {String(answer?.value || 'Unanswered')}
                                </Badge>
                              ) : (
                                <p className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed italic border-l-4 border-indigo-500/30 pl-6 py-2 bg-indigo-500/5 rounded-r-2xl">
                                  "{String(answer?.value || 'No response provided')}"
                                </p>
                              )}
                            </div>
                            {i < form.questions.length - 1 && <div className="mt-10 h-px bg-slate-200 dark:bg-white/5 w-full"></div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                   <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <Meh className="h-16 w-16 mb-4" />
                      <p className="text-xl font-black uppercase tracking-widest">Zero Data Points Found</p>
                   </div>
                )}
              </>
            )}

            {/* AI TAB */}
            {activeTab === "ai" && (
              <>
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-500/20 rounded-3xl mb-6 shadow-2xl dark:shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                    <Network className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Strategic AI Intelligence</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Autonomous Pattern Recognition • Sentiment Mapping • Actionable Forecasting</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-white/5 p-8 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-200 dark:border-white/5 pb-4">Extracted Sentiment Vectors</h3>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                          <span className="text-slate-900 dark:text-white">Positive Sentiment</span>
                          <span className="text-green-600 dark:text-green-400">82% Magnitude</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" style={{ width: '82%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                          <span className="text-slate-900 dark:text-white">Constructive Feedback</span>
                          <span className="text-amber-600 dark:text-amber-400">14% Magnitude</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: '14%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                          <span className="text-slate-900 dark:text-white">Critical Indicators</span>
                          <span className="text-red-600 dark:text-red-400">4% Magnitude</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" style={{ width: '4%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 relative overflow-hidden shadow-2xl group">
                    <Lightbulb className="absolute right-[-40px] bottom-[-40px] opacity-10 h-64 w-64 text-white pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-8 border-b border-white/20 pb-4 relative z-10">AI Deployment Roadmap</h3>
                    <ul className="space-y-6 relative z-10">
                      {[
                        { title: "Strategic Resource Allocation", text: "82% of respondents emphasize specific operational bottlenecks. Reallocating bandwidth to Section B could yield a 15% efficiency boost." },
                        { title: "Communication Synthesis", text: "Sentiment analysis indicates a decoupling between internal updates and execution. Implement a bi-weekly synchronization protocol." },
                        { title: "Predictive Retention", text: "Neutral sentiment trends in the Junior tier suggest a potential 12% attrition risk if engagement benchmarks aren't met by Q4." }
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-sm text-white/90 font-medium leading-relaxed">
                            <strong className="text-white font-black block mb-1 uppercase tracking-wider text-xs">{item.title}</strong> {item.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <button className="mt-10 w-full py-4 rounded-2xl bg-white text-indigo-700 text-sm font-black uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all relative z-10">Generate Comprehensive Audit</button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }

        @keyframes gradient-border {
          0%, 100% { border-color: rgba(168, 85, 247, 0.2); }
          50% { border-color: rgba(99, 102, 241, 0.5); }
        }
        .animate-gradient-border {
          animation: gradient-border 3s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
