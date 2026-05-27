import React, { useEffect, useState } from 'react';
import {
  User, Mail, BookOpen, Award, TrendingUp, AlertTriangle,
  Target, Lightbulb, Loader2, Calendar, Briefcase, ChevronRight, Activity, BrainCircuit
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Link } from 'react-router-dom';

import { getProfileAnalytics, type ProfileAnalyticsResponse } from '@/shared/api/profileApi';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface StudentProfileDashboardProps {
  userId: string;
}

export const StudentProfileDashboard: React.FC<StudentProfileDashboardProps> = ({ userId }) => {
  const [data, setData] = useState<ProfileAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProfileAnalytics(userId);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile analytics');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Generating Profile Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 text-destructive">
        <AlertTriangle className="w-12 h-12" />
        <p className="font-semibold text-lg">{error || 'Failed to load profile data'}</p>
      </div>
    );
  }

  const isStudent = data.user.role === 'STUDENT';
  const getGradeColor = (grade: number) => {
    if (grade >= 85) return 'text-green-500';
    if (grade >= 70) return 'text-blue-500';
    if (grade >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const initials = `${data.user.firstName?.[0] || ''}${data.user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const departmentName = (data.profile?.departmentId as any)?.name || 'Department details unavailable';

  const chartDataHistory = data.task_history?.slice().reverse().map((item, index) => ({
    name: `T${index + 1}`,
    final: item.final_grade || 0,
    ai: item.ai_suggested_grade || 0,
    taskName: item.task_id?.title || 'Unknown'
  })) || [];

  const chartDataMastery = data.aggregated_metrics.concept_mastery?.map(c => ({
    concept: c.concept.length > 15 ? c.concept.substring(0, 15) + '...' : c.concept,
    fullConcept: c.concept,
    mastery: Math.round(c.average_mastery * 100)
  })) || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6 animate-in fade-in zoom-in-95 duration-200">

      {/* Header Section */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#12131f] to-[#0f111a] border border-white/10 shadow-2xl overflow-hidden group">
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <Avatar className="w-28 h-28 ring-4 ring-[#13151f] border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${data.user.firstName} ${data.user.lastName}`} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-300 font-black">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">{data.user.firstName} {data.user.lastName}</h1>
              <Badge variant="outline" className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 w-fit mx-auto md:mx-0">
                Active Profile
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400 font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"><Mail className="w-4 h-4 text-indigo-400" /> {data.user.email}</div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"><User className="w-4 h-4 text-indigo-400" /> <span className="capitalize">{data.user.role.toLowerCase()}</span></div>
              {data.profile?.departmentId && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"><Briefcase className="w-4 h-4 text-indigo-400" /> {departmentName}</div>
              )}
              {data.profile?.academicYear && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"><Calendar className="w-4 h-4 text-indigo-400" /> Year {data.profile.academicYear}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isStudent ? (
        // INSTRUCTOR or HOD View
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Role Type</span>
              <h4 className="text-2xl font-black text-white capitalize">{data.user.role.toLowerCase()}</h4>
              <p className="text-xs text-slate-400 mt-1">Managing courses and departmental tasks.</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Assigned Courses</span>
              <h4 className="text-2xl font-black text-white">{data.profile?.teachingCourses?.length || 0}</h4>
              <p className="text-xs text-slate-400 mt-1">Active courses being managed.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        // STUDENT View
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/20 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Submissions</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white relative z-10">{data.aggregated_metrics.total_submissions}</div>
            </div>

            <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/20 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Average AI Grade</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-3xl font-black relative z-10 ${getGradeColor(data.aggregated_metrics.average_suggested_grade)}`}>
                {data.aggregated_metrics.average_suggested_grade.toFixed(1)} <span className="text-sm font-bold text-slate-500 opacity-50 uppercase tracking-wider">/ 100</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/20 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Confidence Index</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-3xl font-black relative z-10 ${getConfidenceColor(data.aggregated_metrics.average_confidence_score)}`}>
                {(data.aggregated_metrics.average_confidence_score * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* AI Synthesis Highlight Section */}
          {data.ai_synthesis ? (
            <div className="p-6 rounded-3xl bg-[#13151f]/60 border border-white/10 shadow-lg space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <BrainCircuit className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Senior Academic Advisor Synthesis</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Automated Profile Analysis & Cognitive Feedback</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0a0a0f] border border-white/5 leading-relaxed text-sm text-slate-300 whitespace-pre-wrap font-medium">
                {data.ai_synthesis.overall_summary}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121a18] to-[#12131a] border border-emerald-500/10 hover:border-emerald-500/20 shadow-2xl relative overflow-hidden transition-all duration-300 group">
                  <div className="absolute -right-12 -top-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Core Strengths</h4>
                      <p className="text-[9px] text-emerald-400/80 font-mono uppercase tracking-widest mt-0.5">Key Capabilities</p>
                    </div>
                  </div>
                  <div className="space-y-3.5 relative z-10 pt-4">
                    {data.ai_synthesis.core_strengths.length > 0 ? (
                      data.ai_synthesis.core_strengths.map((strength, i) => (
                        <div key={i} className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#0a0a0f]/40 border border-white/5 hover:border-emerald-500/10 transition-all duration-300 group/item">
                          <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium group-hover/item:text-slate-200 transition-colors">
                            {strength}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific strengths identified yet.</p>
                    )}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c131a] to-[#12131a] border border-rose-500/10 hover:border-rose-500/20 shadow-2xl relative overflow-hidden transition-all duration-300 group">
                  <div className="absolute -right-12 -top-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all duration-500 pointer-events-none" />
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Persistent Weaknesses</h4>
                      <p className="text-[9px] text-rose-400/80 font-mono uppercase tracking-widest mt-0.5">Areas for Improvement</p>
                    </div>
                  </div>
                  <div className="space-y-3.5 relative z-10 pt-4">
                    {data.ai_synthesis.persistent_weaknesses.length > 0 ? (
                      data.ai_synthesis.persistent_weaknesses.map((weakness, i) => (
                        <div key={i} className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#0a0a0f]/40 border border-white/5 hover:border-rose-500/10 transition-all duration-300 group/item">
                          <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono font-bold text-rose-400 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium group-hover/item:text-slate-200 transition-colors">
                            {weakness}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No persistent weaknesses identified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#12131f] to-[#12131a] border border-indigo-500/10 hover:border-indigo-500/20 shadow-2xl relative overflow-hidden transition-all duration-300 group">
                <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Action Plan</h4>
                    <p className="text-[9px] text-indigo-400/80 font-mono uppercase tracking-widest mt-0.5">Targeted Next Steps</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10 pt-4">
                  {data.ai_synthesis.action_plan.length > 0 ? (
                    data.ai_synthesis.action_plan.map((action, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[#0a0a0f]/40 border border-white/5 hover:border-indigo-500/10 transition-all duration-300 group/item">
                        <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-400 shrink-0 mt-0.5">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium group-hover/item:text-slate-200 transition-colors">
                          {action}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic col-span-full">Keep up the good work!</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#13151f]/60 border border-white/10 shadow-lg text-center text-slate-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No AI Synthesis available yet. Complete more tasks to generate an advisor profile.</p>
            </div>
          )}

          {/* Detail Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-4 bg-[#1e1b2e] border border-white/5 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Mastery</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <Activity className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Grade Progression</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tracking final grades vs AI suggested grades over time</p>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  {chartDataHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartDataHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #1e293b', color: '#f8fafc', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ color: '#818cf8', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}
                          formatter={(value: number, name: string) => [
                            <span className={name === 'final' ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold'}>{value}</span>,
                            <span className="text-slate-400">{name === 'final' ? 'Final Grade' : 'AI Grade'}</span>
                          ]}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.taskName || label}
                        />
                        <Legend wrapperStyle={{ paddingTop: '24px', fontSize: '12px', color: '#94a3b8' }} />
                        <Line type="monotone" dataKey="final" name="final" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="ai" name="ai" stroke="#6366f1" strokeWidth={3} strokeDasharray="6 6" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Activity className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">Not enough task history to plot progression.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills">
              <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <Target className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Concept Mastery</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI evaluated mastery levels across different topics</p>
                  </div>
                </div>
                <div className="h-[400px] w-full">
                  {chartDataMastery.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataMastery} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                        <YAxis dataKey="concept" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                        <Tooltip
                          cursor={{ fill: '#334155', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value}%`, 'Mastery']}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullConcept || label}
                        />
                        <Bar dataKey="mastery" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Target className="w-12 h-12 mb-3 opacity-20" />
                      <p>No concept mastery data available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 shadow-md">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <BookOpen className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Submission History</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recent assignments and evaluations</p>
                  </div>
                </div>
                <div className="w-full">
                  {data.task_history && data.task_history.length > 0 ? (
                    <div className="rounded-md border border-white/5 overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[10px] tracking-wider uppercase bg-[#0f111a] border-b border-white/5 text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-bold">Task</th>
                            <th className="px-4 py-3 font-bold">Type</th>
                            <th className="px-4 py-3 font-bold">Status</th>
                            <th className="px-4 py-3 font-bold text-right">AI Grade</th>
                            <th className="px-4 py-3 font-bold text-right">Final Grade</th>
                            <th className="px-4 py-3 font-bold text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.task_history.map((item) => {
                            // Extract course ID from task, or fallback to the student's enrolled courses, or a dummy string 'all'
                            const fallbackCourseId = data.profile?.enrolledCourses?.[0]?._id || data.profile?.enrolledCourses?.[0] || 'all';
                            const courseId = item.task_id?.course_id || fallbackCourseId;

                            // Force route to the grading page for all users to see the Detailed AI Analytics
                            const taskLink = `/dashboard/courses/${courseId}/tasks/${item.task_id?._id || 'unknown'}/submissions/${item._id}/grade`;

                            return (
                              <tr key={item._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 font-medium">
                                  <Link
                                    to={taskLink}
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                  >
                                    {item.task_id?.title || 'Unknown Task'}
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </Link>
                                </td>
                                <td className="px-4 py-3 text-slate-400">{item.task_id?.task_type || '-'}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={item.status === 'FINALIZED' ? 'default' : 'secondary'} className="text-[10px] uppercase bg-slate-800 text-slate-300 border-white/10">
                                    {item.status.replace('_', ' ')}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-slate-200">
                                  {item.ai_suggested_grade !== undefined && item.ai_suggested_grade !== null ? `${item.ai_suggested_grade}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-400">
                                  {item.final_grade !== undefined && item.final_grade !== null ? `${item.final_grade}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                                  {new Date(item.updatedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No task history found for this student.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
