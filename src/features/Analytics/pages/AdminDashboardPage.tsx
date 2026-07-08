import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/api/axiosInstance';
import { 
  Users, FileText, CheckCircle2, Zap, BrainCircuit, Activity, ChevronRight, BarChart3, PieChart,
  Building2, BookOpen, GraduationCap, Users2, ShieldCheck, UserCog
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';


// Custom Tooltip for the Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const nameMap: any = {
      STUDENT: "Students",
      INSTRUCTOR: "Instructors",
      HOD: "Head of Departments",
      ADMIN: "Administrators"
    };
    
    let Icon = Users2;
    if (data.name === 'STUDENT') Icon = GraduationCap;
    if (data.name === 'INSTRUCTOR') Icon = UserCog;
    if (data.name === 'HOD') Icon = ShieldCheck;
    if (data.name === 'ADMIN') Icon = Zap;

    return (
      <div className="bg-panel border border-panel-hover p-4 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${payload[0].fill}20` }}>
          <Icon className="h-6 w-6" style={{ color: payload[0].fill }} />
        </div>
        <div>
          <p className="text-xs text-content-muted font-bold tracking-wider uppercase mb-1">{nameMap[data.name] || data.name}</p>
          <p className="text-xl font-black text-content leading-none">{data.value} <span className="text-sm font-medium text-content-muted">Users</span></p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for the Bar Chart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-panel/95 backdrop-blur-md border border-panel-hover p-4 rounded-2xl shadow-sm">
        <p className="text-xs text-indigo-400 font-bold mb-1 uppercase tracking-wider">{data.name}</p>
        <p className="text-sm font-bold text-content mb-3">{data.fullName}</p>
        <div className="flex items-center gap-2 bg-indigo-500/10 w-fit px-3 py-1.5 rounded-lg border border-indigo-500/20">
          <Activity className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-black text-indigo-400">{data.engagementRate}% Engagement</span>
        </div>
      </div>
    );
  }
  return null;
};

// Simple memory cache so we don't show spinners on back/forward navigation within the same session
let cachedDashboardData: any = null;

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(cachedDashboardData);
  const [loading, setLoading] = useState(!cachedDashboardData);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/admin/dashboard-metrics');
        cachedDashboardData = response.data.data;
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch admin metrics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const pieCells = useMemo(() => {
    if (!data?.charts?.userRoles) return [];
    return data.charts.userRoles.map((entry: any, index: number) => {
      let color = '#6366f1';
      const roleName = String(entry.name || '').toUpperCase();
      if (roleName === 'STUDENT') color = '#10b981'; // Emerald
      else if (roleName === 'INSTRUCTOR') color = '#f59e0b'; // Amber
      else if (roleName === 'HOD') color = '#a855f7'; // Purple
      else if (roleName === 'ADMIN') color = '#f43f5e'; // Rose
      return <Cell key={`cell-${roleName}-${index}`} fill={color} />;
    });
  }, [data?.charts?.userRoles]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { kpis, charts, recentActivity } = data;
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6'];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-content">Admin Dashboard</h1>
          <p className="text-content-muted mt-2">Platform overview and AI utilization metrics.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Total Users" value={kpis.totalUsers} icon={Users} color="text-blue-500" />
        <KPICard title="Departments" value={kpis.totalDepartments} icon={Building2} color="text-amber-500" />
        <KPICard title="Courses" value={kpis.totalCourses} icon={BookOpen} color="text-emerald-500" />
        <KPICard title="Total Tasks" value={kpis.totalTasks} icon={Activity} color="text-indigo-500" />
        <KPICard title="AI Tokens" value={kpis.totalAITokens} icon={BrainCircuit} color="text-purple-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Roles Donut Chart */}
        <div className="bg-panel rounded-3xl p-6 border border-panel-hover shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-content flex items-center gap-2 mb-6">
            <Users2 className="h-4 w-4 text-indigo-400" /> Users Classification
          </h3>
          <div className="flex-1 min-h-[250px]">
            {charts.userRoles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie 
                    data={charts.userRoles} 
                    innerRadius={70} 
                    outerRadius={95} 
                    paddingAngle={3} 
                    dataKey="value"
                    stroke="none"
                    // Re-enabled entrance animation!
                  >
                    {pieCells}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} cursor={{ fill: 'transparent' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => {
                    const nameMap: any = { STUDENT: "Student", INSTRUCTOR: "Instructor", HOD: "HOD", ADMIN: "Admin" };
                    return <span className="text-xs font-medium text-content-muted capitalize">{nameMap[value] || value}</span>;
                  }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-content-muted">No data available</div>
            )}
          </div>
        </div>

        {/* Top Performing Courses */}
        <div className="bg-panel rounded-3xl p-6 border border-panel-hover shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-content flex items-center gap-2 mb-6">
            <Activity className="h-4 w-4 text-emerald-400" /> Top Engaging Courses (Completion %)
          </h3>
          <div className="flex-1 min-h-[250px]">
             {charts.topPerformingCourses && charts.topPerformingCourses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topPerformingCourses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--chart-axis-text)" tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-axis-text)" tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    content={<CustomBarTooltip />}
                    cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
                  />
                  <Bar dataKey="engagementRate" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {charts.topPerformingCourses.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-content-muted">No data available</div>
             )}
          </div>
        </div>

        {/* Submissions Over Time */}
        <div className="bg-panel rounded-3xl p-6 border border-panel-hover shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-content flex items-center gap-2 mb-6">
            <BarChart3 className="h-4 w-4 text-emerald-400" /> Submissions (Last 7 Days)
          </h3>
          <div className="flex-1 min-h-[250px]">
             {charts.recentSubmissionsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.recentSubmissionsChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--chart-axis-text)" tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-axis-text)" tick={{ fill: 'var(--chart-axis-text)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--border-panel-hover)', borderRadius: '12px', color: 'var(--text-primary)' }} 
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'var(--bg-panel)' }} activeDot={{ r: 6, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-content-muted">No data available</div>
             )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Forms */}
        <div className="bg-panel rounded-3xl border border-panel-hover overflow-hidden shadow-sm">
          <div className="p-6 border-b border-panel-hover bg-panel-hover/50">
            <h3 className="text-sm font-bold text-content">Recently Created Forms</h3>
          </div>
          <div className="divide-y divide-panel-hover">
            {recentActivity.recentForms.map((form: any) => (
              <div 
                key={form._id}
                onClick={() => navigate(`/dashboard/forms-results/${form._id}`)}
                className="p-4 flex items-center justify-between hover:bg-panel-hover/50 cursor-pointer transition-colors group"
              >
                <div>
                  <h4 className="text-sm font-bold text-content group-hover:text-indigo-400 transition-colors">{form.title}</h4>
                  <p className="text-[10px] text-content-muted mt-1 uppercase tracking-wider">{form.category} • By {form.creator_id?.firstName} {form.creator_id?.lastName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full text-xs font-bold border border-indigo-500/20">
                    {form.responsesCount || 0} Responses
                  </span>
                  <ChevronRight className="h-4 w-4 text-content-muted group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
            {recentActivity.recentForms.length === 0 && (
              <div className="p-8 text-center text-content-muted text-sm">No forms found.</div>
            )}
          </div>
        </div>

        {/* Top AI Consumers */}
        <div className="bg-panel rounded-3xl border border-panel-hover overflow-hidden shadow-sm">
          <div className="p-6 border-b border-panel-hover bg-panel-hover/50 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            <h3 className="text-sm font-bold text-content">Top AI Consumers</h3>
          </div>
          <div className="divide-y divide-panel-hover">
            {recentActivity.topAIUsers.map((user: any) => (
              <div key={user._id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-content">{user.firstName} {user.lastName}</h4>
                  <p className="text-[10px] text-content-muted mt-1 uppercase tracking-wider">{user.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-purple-400">{user.ai_tokens_used.toLocaleString()}</span>
                  <p className="text-[10px] text-content-muted mt-1">/ {user.ai_tokens_limit ? user.ai_tokens_limit.toLocaleString() : '∞'} Tokens</p>
                </div>
              </div>
            ))}
            {recentActivity.topAIUsers.length === 0 && (
              <div className="p-8 text-center text-content-muted text-sm">No AI consumption data yet.</div>
            )}
          </div>
        </div>

        {/* Courses Overview */}
        <div className="bg-panel rounded-3xl border border-panel-hover overflow-hidden shadow-sm lg:col-span-2">
          <div className="p-6 border-b border-panel-hover bg-panel-hover/50 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-content">Courses Overview (Top 10 Enrolled)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-panel-hover/30 text-xs uppercase tracking-wider text-content-muted">
                <tr>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Course Code</th>
                  <th className="p-4 font-medium">Course Name</th>
                  <th className="p-4 font-medium text-center">Enrolled Students</th>
                  <th className="p-4 font-medium text-center">Tasks Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-hover">
                {recentActivity.coursesOverview?.map((course: any) => (
                  <tr 
                    key={course._id} 
                    onClick={() => course.departmentId && navigate(`/dashboard/departments/${course.departmentId}/courses/${course._id}`)}
                    className="hover:bg-panel-hover/20 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-sm font-bold text-content-muted group-hover:text-content">{course.departmentName}</td>
                    <td className="p-4 text-sm font-bold text-indigo-400">{course.courseCode}</td>
                    <td className="p-4 text-sm text-content group-hover:text-indigo-300 transition-colors">{course.name}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-xs font-bold">
                        {course.studentsCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs font-bold">
                        {course.submissionsCount}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recentActivity.coursesOverview || recentActivity.coursesOverview.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-content-muted text-sm">No courses data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-panel rounded-3xl p-6 border border-panel-hover shadow-sm flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl bg-app ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className="text-3xl font-black text-content tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
