import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import {
  Download, Sparkles, ArrowUp, Brain, Star,
  ChevronLeft, ChevronRight, User, Calendar, Network, Lightbulb, CheckCircle2, ArrowLeft, Loader2, FileText, Meh,
  AlertTriangle, TrendingUp, TrendingDown, Zap, RefreshCw
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import * as formApi from "@/features/FormBuilder/api/formApi"
import { getFormSubmissions } from "@/shared/api/submissionApi"
import type { Submission } from "@/shared/api/submissionApi"
import type { Form, Question } from "@/features/FormBuilder/types/form.types"
import { toast } from "sonner"
import { analyzeFormDeep, analyzeForm } from "@/features/Forms/api/formAiApi"
import type { FormDeepAnalysisPayload, FormAnalysisPayload } from "@/features/Forms/api/formAiApi"

type TabKey = "summary" | "questions" | "individual" | "ai"

const renderAiListItem = (item: any) => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    if (item.title && item.description) return <span className="block"><strong>{item.title}</strong>: {item.description}</span>;
    if (item.step && item.action) return <span className="block"><strong>Step {item.step}</strong>: {item.action}</span>;
    
    // Dynamic fallback for any other object shape (like {step, rationale, metrics})
    return (
      <div className="flex flex-col gap-1.5 mt-2 bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-panel w-full shadow-sm">
        {Object.entries(item).map(([key, value]) => (
          <span key={key} className="block text-sm text-slate-700 dark:text-content-muted leading-relaxed">
            <strong className="capitalize text-slate-900 dark:text-content">{String(key).replace(/_/g, ' ')}:</strong> {String(value)}
          </span>
        ))}
      </div>
    );
  }
  return String(item);
}

export default function FormsResultsPage() {
  const navigate = useNavigate()
  const { formId } = useParams<{ formId: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>("summary")
  const [form, setForm] = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState(0)
  // AI analysis state
  const [aiData, setAiData] = useState<FormDeepAnalysisPayload | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiTokenError, setAiTokenError] = useState(false)
  // Summary card AI state
  const [summaryAiData, setSummaryAiData] = useState<FormAnalysisPayload | null>(null)
  const [summaryAiLoading, setSummaryAiLoading] = useState(false)

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

    if (question.type === 'multiple_choice' || question.type === 'checkbox') {
      const counts: Record<string, number> = {}
      answers.forEach(val => {
        if (Array.isArray(val)) {
          val.forEach(v => {
            const s = String(v)
            counts[s] = (counts[s] || 0) + 1
          })
        } else {
          const s = String(val)
          counts[s] = (counts[s] || 0) + 1
        }
      })
      return { counts, total: answers.length }
    }

    return { answers, total: answers.length }
  }

  const handleGenerateSummaryAi = async () => {
    if (!formId) return
    if (submissions.length === 0) {
      toast.error("There is No responses to analyze please wait until the form goes Viral xD")
      return
    }
    setSummaryAiLoading(true)
    try {
      const result = await analyzeForm(formId)
      setSummaryAiData(result)
    } catch (err: any) {
      console.log("Summary AI error:", err)
      const errMsg = err?.response?.data?.message || err?.message || "Failed to generate summary"
      toast.error(errMsg)
    } finally {
      setSummaryAiLoading(false)
    }
  }

  const handleGenerateAudit = async () => {
    if (!formId) return
    if (submissions.length === 0) {
      toast.error("There is No responses to analyze please wait until the form goes Viral xD")
      return
    }
    setIsAiLoading(true)
    setAiTokenError(false)
    setAiData(null)
    try {
      const result = await analyzeFormDeep(formId)
      setAiData(result)
      toast.success("AI audit generated successfully!")
    } catch (err: any) {
      const status = err?.response?.status
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Please try again."
      if (status === 429) {
        setAiTokenError(true)
        toast.error(`Token limit exceeded: ${errMsg}`)
      } else {
        toast.error(`Failed to generate AI audit: ${errMsg}`)
      }
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!form || submissions.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Headers
    const headers = ["Timestamp"];
    if (!form.is_anonymous) {
      headers.push("Evaluator");
    }
    form.questions.forEach((q) => headers.push(q.label || "Untitled Question"));

    // Rows
    const rows = submissions.map((sub) => {
      const row = [`"${new Date(sub.createdAt).toLocaleString()}"`];
      
      if (!form.is_anonymous) {
        const evaluator = sub.evaluator_id as any;
        const name = evaluator && evaluator.firstName ? `${evaluator.firstName} ${evaluator.lastName}` : 'Anonymous';
        row.push(`"${name.replace(/"/g, '""')}"`);
      }

      form.questions.forEach((q) => {
        const qId = q._id || q.id;
        const answer = sub.answers.find((a: any) => {
          const aId = a.question_id?._id || a.question_id;
          return aId === qId;
        });
        let val = answer?.value;
        if (Array.isArray(val)) val = val.join(" | ");
        if (typeof val === 'object' && val !== null) {
          val = (val as any).fileName || (val as any).url || JSON.stringify(val);
        }
        if (val === undefined || val === null) val = "";
        
        // Escape quotes and wrap in quotes to handle commas in text
        row.push(`"${String(val).replace(/"/g, '""')}"`);
      });
      return row;
    });

    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    // Add BOM for UTF-8 (Excel Arabic support)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm font-bold text-content-muted uppercase tracking-widest">Synthesizing Analytics...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-bg-dark text-content-muted">
        Form not found
      </div>
    )
  }

  const selectedQuestion = form.questions[selectedQuestionIndex]
  const currentSubmission = submissions[selectedSubmissionIndex]

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-bg-dark w-full">
      <header className="sticky top-0 z-20 flex flex-col justify-center border-b border-slate-200 bg-white/90 dark:border-panel-hover dark:bg-bg-dark/90 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/forms-surveys")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-panel-hover text-content-muted hover:text-slate-900 dark:text-content-muted dark:hover:text-content transition-all border border-transparent hover:border-slate-200 dark:hover:border-panel-hover"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-content">{form.title}</h2>
                <span className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
                  form.is_active
                    ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                    : "bg-slate-100 dark:bg-panel-hover text-content-muted dark:text-content-muted border-slate-200 dark:border-panel-hover"
                )}>
                  {form.is_active ? 'Active' : 'Closed'}
                </span>
              </div>
              <p className="text-sm text-content-muted dark:text-content-muted mt-1">
                Created by {form.creator_id?.firstName} • {submissions.length} Responses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="flex gap-6 border-b border-slate-200 dark:border-panel-hover overflow-x-auto no-scrollbar">
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
                  : "border-transparent text-content-muted hover:text-slate-900 dark:text-content-muted dark:hover:text-content"
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="mx-auto max-w-7xl">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-10">

            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-panel-hover dark:bg-surface-dark p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-content-muted dark:text-content-muted uppercase tracking-widest mb-1">Total Submissions</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-content">{submissions.length}</h3>
                      <span className="text-sm text-green-600 dark:text-green-400 font-bold mb-1 flex items-center">
                        <ArrowUp className="h-4 w-4 me-0.5" /> Live Data
                      </span>
                    </div>
                  </div>
                </div>

                {!submissions.length && (
                  <div className="relative rounded-[2rem] border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 backdrop-blur-md p-8 md:p-10 min-h-[320px] flex flex-col items-center justify-center text-center animate-gradient-border overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none"></div>
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-pulse-subtle">
                        <Sparkles className="h-10 w-10 text-content" />
                      </div>
                      <div className="absolute -inset-4 border border-purple-500/20 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-content uppercase tracking-tight mb-2">System Ready for Synthesis</h3>
                    <p className="text-sm text-content-muted dark:text-content-muted font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                      There is No responses to analyze please wait until the form goes Viral xD
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-content-muted uppercase tracking-widest ms-1">Key Performance Metrics</h3>
                  {form.questions.filter(q => q.type !== 'short_text' && q.type !== 'long_text' && q.type !== 'file').slice(0, 3).map((q, idx) => {
                    const stats = getQuestionStats(q) as any
                    if (q.type === 'short_text' || q.type === 'long_text' || q.type === 'file') return null

                    return (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-white dark:border-panel-hover dark:bg-surface-dark p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-content mb-6 flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black">{idx + 1}</span>
                          {q.label}
                        </h3>
                        {q.type === 'linear_scale' && (
                          <div className="space-y-4">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = stats.counts[rating] || 0
                              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                              return (
                                <div key={rating} className="flex items-center gap-4 text-xs font-bold">
                                  <span className="w-12 text-end text-content-muted dark:text-content-muted flex items-center justify-end gap-1">
                                    {rating} <Star className={cn("h-3.5 w-3.5", rating >= 4 ? "text-yellow-500 fill-yellow-500" : "text-content-muted dark:text-slate-600")} />
                                  </span>
                                  <div className="flex-1 h-2 bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full transition-all duration-1000", rating >= 4 ? "bg-indigo-500" : "bg-slate-400")}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="w-10 text-end text-slate-900 dark:text-content">{Math.round(percentage)}%</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                          <div className="h-64 w-full mt-4 flex justify-center">
                            {Object.keys(stats.counts || {}).length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={Object.entries(stats.counts).map(([name, value]) => ({ name, value }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                  >
                                    {Object.keys(stats.counts).map((_, index) => {
                                      const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    })}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full w-full opacity-50">
                                <p className="text-xs font-bold uppercase tracking-widest text-content-muted">No data points</p>
                              </div>
                            )}
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
                <div className="lg:w-80 flex flex-col gap-3 overflow-y-auto pe-2 custom-scrollbar">
                  <h3 className="text-[10px] font-black text-content-muted uppercase tracking-widest mb-1 ms-1">Survey Architecture</h3>
                  {form.questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-start transition-all duration-200 group relative overflow-hidden",
                        selectedQuestionIndex === idx
                          ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20"
                          : "bg-white dark:bg-surface-dark border-slate-200 dark:border-panel hover:border-slate-300 dark:hover:border-panel-hover"
                      )}
                    >
                      <div className="flex items-start gap-3 relative z-10">
                        <span className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black",
                          selectedQuestionIndex === idx ? "bg-white/20 text-content" : "bg-indigo-500/10 text-indigo-500"
                        )}>
                          {idx + 1}
                        </span>
                        <p className={cn(
                          "text-xs font-bold leading-relaxed line-clamp-2",
                          selectedQuestionIndex === idx ? "text-content" : "text-slate-600 dark:text-content-muted"
                        )}>
                          {q.label}
                        </p>
                      </div>
                      {selectedQuestionIndex === idx && (
                        <div className="absolute right-[-10px] top-[-10px] opacity-10">
                          <CheckCircle2 className="h-16 w-16 text-content" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Right Detail Panel */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pe-2">
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-panel-hover dark:bg-surface-dark p-8 shadow-sm">
                    <div className="mb-8">
                      <Badge className="mb-3 bg-indigo-500/10 text-indigo-500 border-indigo-500/20 uppercase tracking-widest text-[9px] font-black">
                        {selectedQuestion.type.replace('_', ' ')} Inquiry
                      </Badge>
                      <h3 className="text-xl font-black text-slate-900 dark:text-content leading-tight">
                        {selectedQuestion.label}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {/* Analysis Block */}
                      <div>
                        {selectedQuestion.type === 'linear_scale' || selectedQuestion.type === 'multiple_choice' ? (
                          <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-content-muted uppercase tracking-widest border-b border-slate-200 dark:border-panel pb-2">Frequency Distribution</h4>
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
                                        <div className="flex justify-between text-[10px] font-black text-content-muted uppercase tracking-widest">
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
                                      <div className="flex justify-between text-[10px] font-black text-content-muted uppercase tracking-widest">
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
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-panel pb-4 mb-4">
                              <h4 className="text-[10px] font-black text-content-muted uppercase tracking-widest">Verbatim Responses</h4>
                            </div>
                            <div className="space-y-4">
                              {(getQuestionStats(selectedQuestion).answers as any[] || []).map((ans, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-panel hover:border-indigo-500/30 transition-all group">
                                  <p className="text-sm text-slate-700 dark:text-content-muted font-medium leading-relaxed italic mb-3">"{ans}"</p>
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                      <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-content font-bold ring-2 ring-white dark:ring-surface-dark">
                                        {form.is_anonymous ? 'A' : (submissions.find(s => s.answers.some(a => a.value === ans))?.evaluator_id as any)?.firstName?.charAt(0) || 'A'}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                                      {form.is_anonymous ? 'Anonymous Participant' : (() => {
                                        const sub = submissions.find(s => s.answers.some(a => a.value === ans));
                                        const evaluator = sub?.evaluator_id as any;
                                        return evaluator && evaluator.firstName ? `${evaluator.firstName} ${evaluator.lastName}` : 'Anonymous Participant';
                                      })()}
                                    </span>
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
                <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-panel shadow-sm">
                  <button
                    disabled={selectedSubmissionIndex === 0}
                    onClick={() => setSelectedSubmissionIndex(prev => prev - 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-panel text-content-muted dark:text-content-muted hover:text-indigo-500 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 dark:text-content mb-1 uppercase tracking-tight">Response Node #{submissions.length - selectedSubmissionIndex}</h3>
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs font-bold text-content-muted dark:text-content-muted uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-indigo-500" /> {
                        form.is_anonymous 
                          ? 'Participant Anonymous' 
                          : ((currentSubmission?.evaluator_id as any)?.firstName ? `${(currentSubmission.evaluator_id as any).firstName} ${(currentSubmission.evaluator_id as any).lastName}` : 'Participant Anonymous')
                      }</span>
                      <span className="hidden sm:inline opacity-30">•</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-500" /> {new Date(currentSubmission?.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    disabled={selectedSubmissionIndex === submissions.length - 1}
                    onClick={() => setSelectedSubmissionIndex(prev => prev + 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-panel text-content-muted dark:text-content-muted hover:text-indigo-500 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>

                {submissions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-panel-hover rounded-3xl p-8 md:p-10 space-y-10 shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 end-0 p-8 opacity-[0.02] pointer-events-none">
                        <FileText className="h-40 w-40" />
                      </div>
                      {form.questions.map((q, i) => {
                        const answer = currentSubmission.answers.find(a => (a.question_id as any)._id === q.id || (a.question_id as any) === q.id)
                        return (
                          <div key={i} className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black">{i + 1}</span>
                              <p className="text-xs font-black text-content-muted uppercase tracking-widest">{q.label}</p>
                            </div>
                            <div className="ps-9">
                              {q.type === 'linear_scale' ? (
                                <div className="flex gap-2">
                                  {Array.from({ length: (q.scale?.max || 5) }, (_, idx) => idx + 1).map(val => (
                                    <div key={val} className={cn(
                                      "h-10 w-10 flex items-center justify-center rounded-xl border-2 text-sm font-black transition-all",
                                      Number(answer?.value) === val
                                        ? "bg-indigo-600 border-indigo-500 text-content shadow-lg shadow-indigo-500/20 scale-110"
                                        : "bg-slate-50 dark:bg-bg-dark border-transparent text-content-muted"
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
                                <p className="text-lg font-bold text-slate-900 dark:text-content leading-relaxed italic border-s-4 border-indigo-500/30 ps-6 py-2 bg-indigo-500/5 rounded-e-2xl">
                                  "{String(answer?.value || 'No response provided')}"
                                </p>
                              )}
                            </div>
                            {i < form.questions.length - 1 && <div className="mt-10 h-px bg-slate-200 dark:bg-panel-hover w-full"></div>}
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
              <div className="pt-4">
                {/* Token limit error banner */}
                {aiTokenError && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-eed-500/30 text-red-600 dark:text-red-400 mb-4">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-bold">AI analysis unavailable due to token limit. The dataset is too large. Please reduce the number of submissions or response length.</p>
                  </div>
                )}

                {/* AI STATE: INITIAL / NO DATA */}
                {!aiData && !isAiLoading && (
                  <div className="max-w-4xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden shadow-2xl group border border-purple-500/30 text-center">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      <Lightbulb className="absolute -end-20 -bottom-20 opacity-10 h-96 w-96 text-content pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-0 start-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

                      <div className="relative z-10 space-y-8 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl mb-2">
                          <Brain className="h-10 w-10 text-content" />
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Generate Deep AI Insights
                          </h3>
                          <p className="text-indigo-100/90 font-medium leading-relaxed max-w-2xl mx-auto text-lg">
                            {submissions.length === 0
                              ? "There is No responses to analyze please wait until the form goes Viral xD"
                              : "Activate our advanced neural engine to synthesize qualitative responses, extract sentiment vectors, and reveal actionable operational intelligence from your survey data."}
                          </p>
                        </div>

                        <div className="pt-8 w-full max-w-md mx-auto">
                          <button
                            onClick={handleGenerateAudit}
                            disabled={!submissions.length}
                            className="w-full py-5 rounded-2xl bg-white text-indigo-700 text-base font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 relative overflow-hidden"
                          >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></span>
                            <Sparkles className="h-6 w-6" /> Generate Comprehensive Audit
                          </button>
                        </div>

                        {!submissions.length && (
                          <p className="text-content/60 text-xs font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full inline-flex mt-4 backdrop-blur-sm border border-panel-hover">
                            Insufficient data: Waiting for submissions
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI STATE: LOADING */}
                {isAiLoading && (
                  <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-8 animate-in fade-in duration-500">
                    <div className="relative">
                      <div className="h-32 w-32 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 z-10 relative">
                        <Brain className="h-14 w-14 text-content animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping opacity-75"></div>
                      <div className="absolute -inset-4 rounded-full border-2 border-indigo-500/20 animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
                      <div className="absolute -inset-8 rounded-full border border-purple-500/10 animate-ping opacity-25" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-content uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                        Synthesizing Intelligence
                      </h3>
                      <p className="text-sm text-content-muted dark:text-content-muted font-bold uppercase tracking-widest">
                        Processing {submissions.length} response vectors...
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Real AI Results ── */}
                {aiData && !isAiLoading && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={handleGenerateAudit}
                        disabled={isAiLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-widest hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-all"
                      >
                        <RefreshCw className="h-4 w-4" /> Re-run Audit
                      </button>
                    </div>

                    {/* Global Summary Banner */}
                    {aiData.global && (
                      <div className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/10 to-indigo-600/5 p-7 overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20 shrink-0">
                              <Brain className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-2">Global Strategic Summary</p>
                              <p className="text-sm text-slate-700 dark:text-content-muted font-medium leading-relaxed">{aiData.global.overall_summary}</p>
                            </div>
                          </div>
                          {aiData.global.overall?.score !== undefined && (
                            <div className="flex flex-col items-end shrink-0 bg-white dark:bg-panel-hover border border-purple-500/20 rounded-2xl p-4 shadow-sm">
                              <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Overall Performance</span>
                              <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">{aiData.global.overall.score}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Global Key Problems & Recommendations */}
                    {aiData.global && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-eed-500/20 p-6 shadow-sm">
                          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-5 border-b border-eed-500/10 pb-3 flex items-center gap-2">
                            <TrendingDown className="h-3.5 w-3.5" /> Key Systemic Problems
                          </h4>
                          <ul className="space-y-3">
                            {aiData.global.key_problems.length ? aiData.global.key_problems.map((p, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-content-muted">
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                {renderAiListItem(p)}
                              </li>
                            )) : <li className="text-xs text-content-muted italic">No major systemic issues identified.</li>}
                          </ul>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-emerald-500/20 p-6 shadow-sm">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-5 border-b border-emerald-500/10 pb-3 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5" /> Strategic Recommendations
                          </h4>
                          <ul className="space-y-3">
                            {aiData.global.recommendations.length ? aiData.global.recommendations.map((r, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-content-muted">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                                {renderAiListItem(r)}
                              </li>
                            )) : <li className="text-xs text-content-muted italic">No recommendations at this time.</li>}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Per-Tag Analysis Cards */}
                    {Object.entries(aiData.tags || {}).map(([tag, result]) => (
                      <div key={tag} className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-panel p-7 shadow-sm space-y-6">
                        {/* Tag header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500">{tag}</span>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase border-none px-2.5 rounded-full",
                              result.sentiment === "positive" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                                result.sentiment === "negative" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                  "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            )}>
                              {result.sentiment}
                            </Badge>
                            {result.score !== undefined && (
                              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase border-none px-2.5 rounded-full">
                                Score: {result.score}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-slate-700 dark:text-content-muted font-medium leading-relaxed border-s-4 border-indigo-500/30 ps-4">{result.summary}</p>

                        {/* Strengths / Weaknesses / Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="rounded-xl bg-green-500/5 border border-green-500/15 p-4">
                            <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3" /> Strengths
                            </p>
                            <ul className="space-y-2">
                              {result.strengths.length ? result.strengths.map((s, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-content-muted flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />{renderAiListItem(s)}
                                </li>
                              )) : <li className="text-xs text-content-muted italic">None identified</li>}
                            </ul>
                          </div>
                          <div className="rounded-xl bg-red-500/5 border border-eed-500/15 p-4">
                            <p className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <TrendingDown className="h-3 w-3" /> Weaknesses
                            </p>
                            <ul className="space-y-2">
                              {result.weaknesses.length ? result.weaknesses.map((w, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-content-muted flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />{renderAiListItem(w)}
                                </li>
                              )) : <li className="text-xs text-content-muted italic">None identified</li>}
                            </ul>
                          </div>
                          <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
                            <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <Zap className="h-3 w-3" /> Action Items
                            </p>
                            <ul className="space-y-2">
                              {result.action_items.length ? result.action_items.map((a, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-content-muted flex items-start gap-2">
                                  <CheckCircle2 className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />{renderAiListItem(a)}
                                </li>
                              )) : <li className="text-xs text-content-muted italic">None identified</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-eadius: 10px; }
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
