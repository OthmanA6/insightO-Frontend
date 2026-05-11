import React, { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { 
  Download, Sparkles, ArrowUp, Brain, Star, ChevronDown, Smile, Meh, 
  ChevronLeft, ChevronRight, User, Calendar, Clock, Network, Lightbulb, CheckCircle2, ArrowLeft 
} from "lucide-react"
import { cn } from "@/lib/utils"

type TabKey = "summary" | "questions" | "individual" | "ai"

export default function FormsResultsPage() {
  const navigate = useNavigate()
  const { formId } = useParams() // Optional usage based on routing /results/:formId
  const [activeTab, setActiveTab] = useState<TabKey>("summary")

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-bg-dark w-full">
      <header className="sticky top-0 z-20 flex flex-col justify-center border-b border-slate-200 bg-white/90 dark:border-white/10 dark:bg-bg-dark/90 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Q1 Manager 360 Review</h2>
                <span className="inline-flex rounded-full bg-green-100 dark:bg-green-500/10 px-2.5 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest border border-green-200 dark:border-green-500/20">Active</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Created by HR Dept • 142 Responses</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 items-center justify-center gap-2 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 px-4 text-sm font-semibold text-slate-900 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
        
        <div className="flex gap-6 border-b border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("summary")}
            className={cn(
              "border-b-2 pb-3 text-sm font-semibold transition-all whitespace-nowrap",
              activeTab === "summary"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Summary
          </button>
          <button 
            onClick={() => setActiveTab("questions")}
            className={cn(
              "border-b-2 pb-3 text-sm font-semibold transition-all whitespace-nowrap",
              activeTab === "questions"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Questions
          </button>
          <button 
            onClick={() => setActiveTab("individual")}
            className={cn(
              "border-b-2 pb-3 text-sm font-semibold transition-all whitespace-nowrap",
              activeTab === "individual"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Individual
          </button>
          <button 
            onClick={() => setActiveTab("ai")}
            className={cn(
              "flex items-center gap-1 border-b-2 pb-3 text-sm font-semibold transition-all whitespace-nowrap",
              activeTab === "ai"
                ? "border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-300"
                : "border-transparent text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            )}
          >
            <Sparkles className="h-4 w-4" /> AI Deep Dive
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="mx-auto max-w-5xl">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
            
            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Responses</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">142</h3>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium mb-1 flex items-center">
                        <ArrowUp className="h-4 w-4 mr-0.5" /> 12 today
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Completion Rate</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">94%</h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">out of 150 invited</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Average Time</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">4m 12s</h3>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-gradient-to-r from-purple-50 to-white dark:from-surface-dark dark:to-[#1e172e] p-6 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-300 dark:to-white bg-clip-text text-transparent mb-2">AI Synthesis & Insights</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Overall sentiment is highly positive (4.2/5 avg). Employees frequently praised <strong className="text-green-600 dark:text-green-400">"Clear Communication"</strong>. However, 28% indicate a need for <strong className="text-orange-600 dark:text-orange-400">"Better alignment on goals"</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">1. Rate manager's communication skills</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="w-12 text-right font-medium text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                        5 <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      </span>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '65%' }}></div>
                      </div>
                      <span className="w-10 text-right font-bold text-slate-900 dark:text-white">65%</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="w-12 text-right font-medium text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                        4 <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      </span>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: '22%' }}></div>
                      </div>
                      <span className="w-10 text-right font-bold text-slate-900 dark:text-white">22%</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* QUESTIONS TAB */}
            {activeTab === "questions" && (
              <>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Select Question:</span>
                  <div className="relative w-full">
                    <select className="w-full appearance-none bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none focus:border-primary">
                      <option>2. Provide a specific example of their problem-solving ability.</option>
                      <option>1. Rate manager's communication skills (Rating)</option>
                      <option>3. What can the manager improve? (Text)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none h-4 w-4" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b border-slate-200 dark:border-white/5 gap-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">128 Responses</h3>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1 rounded bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 font-medium">All</button>
                      <button className="px-3 py-1 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-200 dark:hover:bg-green-500/20">Positive</button>
                      <button className="px-3 py-1 rounded bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-500/20">Constructive</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">"When the client server crashed last week, they stayed calm, organized a quick war-room meeting, and delegated tasks perfectly. We were back online in 30 mins."</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          <Smile className="h-3 w-3" /> Positive
                        </span>
                        <span className="text-xs text-slate-500">Anonymous • Engineering Dept</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">"Sometimes takes too long to make a decision when data is missing. Needs to trust their gut feeling more to speed up the process."</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                          <Meh className="h-3 w-3" /> Constructive
                        </span>
                        <span className="text-xs text-slate-500">Anonymous • Sales Dept</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* INDIVIDUAL TAB */}
            {activeTab === "individual" && (
              <>
                <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Response #42</h3>
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Anonymous (Sales)</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Oct 24, 2025</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 3m 45s</span>
                    </div>
                  </div>

                  <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block mb-1">AI Response Analysis</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">This respondent gave lower ratings compared to the department average. Their text feedback suggests feeling undervalued regarding recent project allocations.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">1. How would you rate the manager's communication skills?</p>
                    <div className="flex gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                      <Star className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-200 dark:bg-white/5"></div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">2. Provide a specific example of their problem-solving ability.</p>
                    <p className="text-base text-slate-900 dark:text-white">"Honestly, the communication has been lacking this quarter. Decisions are made at the top without explaining the 'why' to the rest of the team."</p>
                  </div>
                  <div className="w-full h-px bg-slate-200 dark:bg-white/5"></div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">3. Does the manager foster a collaborative environment?</p>
                    <span className="inline-flex rounded bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-white/10 px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white">No, mostly siloed work</span>
                  </div>
                </div>
              </>
            )}

            {/* AI TAB */}
            {activeTab === "ai" && (
              <>
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center p-3 bg-purple-100 dark:bg-purple-500/20 rounded-2xl mb-4 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                    <Network className="h-9 w-9 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Strategic AI Analysis</h2>
                  <p className="text-slate-500 dark:text-slate-400">Discover hidden patterns, correlations, and strategic recommendations.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Key Themes Extracted</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-900 dark:text-white font-medium">Empathetic Leadership</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">Positive</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: '70%' }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Mentioned in 82 responses.</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-900 dark:text-white font-medium">Goal Alignment</span>
                          <span className="text-orange-600 dark:text-orange-400 font-medium">Needs Attention</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Mentioned in 45 responses.</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-900 dark:text-white font-medium">Meeting Efficiency</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">Critical</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: '20%' }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Mentioned in 22 responses.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-b from-purple-50 to-white dark:from-[#1e172e] dark:to-surface-dark rounded-2xl border border-purple-200 dark:border-purple-500/30 p-6 relative overflow-hidden shadow-sm">
                    <Lightbulb className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] dark:opacity-10 h-40 w-40 text-purple-600 dark:text-purple-400 pointer-events-none" />
                    <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-6 relative z-10">AI Action Plan</h3>
                    <ul className="space-y-4 relative z-10">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-200"><strong className="text-slate-900 dark:text-white">Host a Q2 Goal Alignment Workshop.</strong> The data shows a 28% drop in clarity regarding upcoming objectives.</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-200"><strong className="text-slate-900 dark:text-white">Review Meeting Cadence.</strong> Several constructive comments link "micromanagement" to the frequency of daily standups.</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-200"><strong className="text-slate-900 dark:text-white">Recognize Emotional Intelligence.</strong> Share positive feedback with managers about their handling of the recent server outage.</p>
                      </li>
                    </ul>
                    <button className="mt-6 w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white text-sm font-bold transition-colors relative z-10 shadow-sm dark:shadow-lg dark:shadow-purple-500/20">Generate Full PDF Report</button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
