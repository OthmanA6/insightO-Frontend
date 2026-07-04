import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CheckCircle, TrendingUp, AlertTriangle, UserCheck, BookOpen, BrainCircuit, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import * as departmentApi from '@/shared/api/departmentApi';
import type { DepartmentSpecificAnalyticsResult } from '@/shared/api/departmentApi';
import { EntityInsightsView } from '@/components/EntityInsightsView';
import { toast } from 'sonner';

export function DepartmentAnalyticsDashboard({ departmentId }: { departmentId: string }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'ai' | 'stats'>('ai');
  const [data, setData] = useState<DepartmentSpecificAnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState<number>(50);

  useEffect(() => {
    if (!departmentId || viewMode !== 'stats') return;
    
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const result = await departmentApi.getDepartmentAnalytics(departmentId);
        setData(result);
      } catch (error) {
        toast.error('Failed to load department analytics');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if data doesn't exist to avoid redundant calls on toggle
    if (!data) {
      fetchAnalytics();
    }
  }, [departmentId, viewMode, data]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-panel p-1 rounded-xl border border-panel">
          <button
            onClick={() => setViewMode('ai')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
              viewMode === 'ai' 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-content-muted hover:text-content hover:bg-panel-hover"
            )}
          >
            <BrainCircuit className="h-4 w-4" />
            AI Insights
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
              viewMode === 'stats' 
                ? "bg-purple-600 text-white shadow-md" 
                : "text-content-muted hover:text-content hover:bg-panel-hover"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Performance Stats
          </button>
        </div>
      </div>

      {viewMode === 'ai' && (
        <div className="rounded-[2.5rem] overflow-hidden border border-panel bg-app shadow-2xl relative">
          <EntityInsightsView entityType="DEPARTMENT" entityId={departmentId} />
        </div>
      )}

      {viewMode === 'stats' && (
        <div className="space-y-8">
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : data ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="p-6 rounded-3xl bg-panel border border-panel shadow-2xl flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-black text-content">{data.kpis.totalEnrolled}</h4>
                    <p className="text-[11px] font-bold text-content-muted uppercase tracking-widest mt-1">Unique Students</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-panel border border-panel shadow-2xl flex flex-col justify-between group hover:border-blue-500/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-black text-content">{data.kpis.totalCourses}</h4>
                    <p className="text-[11px] font-bold text-content-muted uppercase tracking-widest mt-1">Total Courses</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-panel border border-panel shadow-2xl flex flex-col justify-between group hover:border-purple-500/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-black text-content">{data.kpis.totalTasks}</h4>
                    <p className="text-[11px] font-bold text-content-muted uppercase tracking-widest mt-1">Total Tasks</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-panel border border-panel shadow-2xl flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-black text-content">{data.kpis.completionRate}%</h4>
                    <p className="text-[11px] font-bold text-content-muted uppercase tracking-widest mt-1">Overall Completion</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-panel border border-panel shadow-2xl flex flex-col justify-between group hover:border-amber-500/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-black text-content">{data.kpis.averageGrade}%</h4>
                    <p className="text-[11px] font-bold text-content-muted uppercase tracking-widest mt-1">Average Grade</p>
                  </div>
                </div>
              </div>

              {/* Threshold Control */}
              <div className="rounded-3xl bg-panel border border-panel p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-content flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Risk Threshold Configuration
                    </h3>
                    <p className="text-sm text-content-muted mt-1 font-medium">
                      Students falling below this overall average grade will be flagged as "At Risk".
                    </p>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto bg-app p-4 rounded-2xl border border-panel min-w-[300px]">
                    <div className="flex-1">
                      <input
                        type="range"
                        value={riskThreshold}
                        onChange={(e) => setRiskThreshold(Number(e.target.value))}
                        max={100}
                        step={5}
                        className="w-full accent-amber-500 h-2 bg-panel-hover rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="w-16 text-center">
                      <span className="text-xl font-black text-amber-500">{riskThreshold}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="rounded-3xl bg-panel border border-panel shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-panel flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-content">Department Student Roster</h3>
                    <p className="text-sm font-medium text-content-muted mt-1">Detailed breakdown of student engagement and grades across all department courses</p>
                  </div>
                  <div className="px-4 py-2 bg-purple-500/10 text-purple-500 font-bold rounded-xl text-sm">
                    Total Enrolled: {data.students.length}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-app/50 text-content-muted font-black uppercase tracking-widest text-[10px]">
                      <tr>
                        <th className="px-6 py-5">Student Name</th>
                        <th className="px-6 py-5">Email</th>
                        <th className="px-6 py-5">Tasks Completed</th>
                        <th className="px-6 py-5">Avg Grade</th>
                        <th className="px-6 py-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-panel">
                      {data.students.map((student) => {
                        const isAtRisk = student.averageGrade < riskThreshold;

                        return (
                          <tr key={student.userId} className="hover:bg-panel-hover/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </div>
                                <span 
                                  onClick={() => navigate(`/dashboard/users/${student.userId}/profile`)}
                                  className="font-bold text-content hover:text-indigo-400 cursor-pointer underline decoration-indigo-500/30 underline-offset-4 transition-colors"
                                >
                                  {student.firstName} {student.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-content-muted font-medium">
                              {student.email}
                            </td>
                            <td className="px-6 py-5">
                              <span className="font-bold text-content">{student.tasksCompleted}</span>
                              <span className="text-content-muted text-xs ms-1">tasks</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded-full bg-panel-hover overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${Math.min(student.averageGrade, 100)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-blue-500">{student.averageGrade}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {isAtRisk ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  At Risk
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-widest">
                                  <UserCheck className="h-3.5 w-3.5" />
                                  On Track
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {data.students.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-content-muted font-bold">
                            No students currently enrolled in this department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
