import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  LineChart as LineIcon,
  Table2,
} from 'lucide-react';
import { getGlobalAnalytics, type GlobalDepartmentAnalytics } from '@/shared/api/departmentApi';
import { cn } from '@/shared/lib/utils';

const PALETTE = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-panel border border-panel p-6 shadow-2xl transition-all hover:border-panel-hover group">
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20 ${gradient}`} />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">
            {label}
          </span>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-black tracking-tighter text-content">{value}</span>
          </div>
          {sub && <span className="text-xs font-bold text-slate-500 mt-2">{sub}</span>}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} shadow-lg backdrop-blur-xl border border-white/5`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function GlobalDepartmentAnalyticsDashboard() {
  const [data, setData] = useState<GlobalDepartmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'charts' | 'table'>('charts');

  useEffect(() => {
    let isMounted = true;
    getGlobalAnalytics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load global analytics');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 bg-panel border border-panel rounded-3xl shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-bold tracking-widest uppercase text-content-muted">
          Synthesizing Global Insights...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-3xl bg-red-500/10 border border-red-500/20 p-8 text-center text-red-500 shadow-2xl">
        <AlertCircle className="h-12 w-12" />
        <p className="text-lg font-black tracking-tight">{error || 'Data Unavailable'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const sortedByEnrollment = [...data.comparisons].sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  const sortedByActivity = [...data.comparisons].sort((a, b) => b.submissionCount - a.submissionCount);
  const sortedByPerformance = [...data.comparisons].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Departments"
          value={data.kpis.totalDepartments}
          sub="Active Academic Entities"
          icon={Building2}
          color="bg-indigo-500/20 text-indigo-400"
          gradient="bg-indigo-500"
        />
        <SummaryCard
          label="Total Courses"
          value={data.kpis.totalCourses}
          sub="Running Curriculums"
          icon={BookOpen}
          color="bg-purple-500/20 text-purple-400"
          gradient="bg-purple-500"
        />
        <SummaryCard
          label="Total Enrollment"
          value={data.kpis.totalStudents}
          sub="Unique Students Overall"
          icon={Users}
          color="bg-emerald-500/20 text-emerald-400"
          gradient="bg-emerald-500"
        />
        <SummaryCard
          label="Active Faculty"
          value={data.kpis.totalInstructors}
          sub="Teaching Staff"
          icon={GraduationCap}
          color="bg-amber-500/20 text-amber-400"
          gradient="bg-amber-500"
        />
      </div>

      {/* ── View Toggle ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-panel border border-panel p-2 rounded-2xl w-fit mx-auto shadow-sm">
        <button
          onClick={() => setActiveView('charts')}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all',
            activeView === 'charts'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-content-muted hover:text-content hover:bg-panel-hover'
          )}
        >
          <BarChart3 className="h-4 w-4" /> Visualizations
        </button>
        <button
          onClick={() => setActiveView('table')}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all',
            activeView === 'table'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-content-muted hover:text-content hover:bg-panel-hover'
          )}
        >
          <Table2 className="h-4 w-4" /> Data Matrix
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {activeView === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Enrollment Comparison */}
          <div className="rounded-3xl bg-panel border border-panel p-6 sm:p-8 shadow-2xl flex flex-col gap-8 h-[450px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-content">Enrollment by Department</h3>
                <p className="text-sm font-medium text-content-muted mt-1">Total student distribution</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedByEnrollment.slice(0, 7)} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-panel-hover)" vertical={false} />
                  <XAxis 
                    dataKey="departmentName" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--hover-panel)' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-panel)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)'
                    }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar 
                    dataKey="enrollmentCount" 
                    name="Students" 
                    fill="url(#enrollmentGradient)" 
                    radius={[8, 8, 0, 0]} 
                    barSize={40}
                    animationDuration={1500}
                  />
                  <defs>
                    <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Comparison */}
          <div className="rounded-3xl bg-panel border border-panel p-6 sm:p-8 shadow-2xl flex flex-col gap-8 h-[450px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-content">Activity & Engagement</h3>
                <p className="text-sm font-medium text-content-muted mt-1">Task submissions per department</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sortedByActivity.slice(0, 7)} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-panel-hover)" vertical={false} />
                  <XAxis 
                    dataKey="departmentName" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-panel)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="submissionCount" 
                    name="Submissions"
                    stroke="#a855f7" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#activityGradient)" 
                    animationDuration={1500}
                  />
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Comparison (Full Width) */}
          <div className="lg:col-span-2 rounded-3xl bg-panel border border-panel p-6 sm:p-8 shadow-2xl flex flex-col gap-8 h-[450px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-content">Task Completion Rate</h3>
                <p className="text-sm font-medium text-content-muted mt-1">Percentage of expected submissions completed</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedByPerformance} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-panel-hover)" vertical={false} />
                  <XAxis 
                    dataKey="departmentName" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--border-panel-hover)', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-panel)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    name="Completion Rate %"
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: 'var(--bg-panel)' }}
                    activeDot={{ r: 8, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="rounded-3xl bg-panel border border-panel shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-panel-hover/50 text-content-muted uppercase tracking-widest text-[10px] font-black">
                <tr>
                  <th className="px-6 py-5">Department</th>
                  <th className="px-6 py-5">Courses</th>
                  <th className="px-6 py-5">Enrolled Students</th>
                  <th className="px-6 py-5">Submissions</th>
                  <th className="px-6 py-5">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel">
                {data.comparisons.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-panel-hover/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-content">{dept.departmentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-content-muted">
                      {dept.courseCount}
                    </td>
                    <td className="px-6 py-5 font-bold text-content">
                      {dept.enrollmentCount}
                    </td>
                    <td className="px-6 py-5 font-medium text-content-muted">
                      {dept.submissionCount}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-panel-hover overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${Math.min(dept.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-500">{dept.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.comparisons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-content-muted font-medium">
                      No departments have generated data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
