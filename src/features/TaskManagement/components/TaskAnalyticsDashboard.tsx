// features/TaskManagement/components/TaskAnalyticsDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Analytics dashboard for ADMIN / INSTRUCTOR.
// Renders summary cards, three charts (pie, bar, line) and a data table.
// Uses recharts (already in package.json) — zero new dependencies.
// Does NOT modify any existing component.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ClipboardCheck,
  ClipboardX,
  ClipboardList,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Table2,
} from 'lucide-react';
import { getTaskAnalytics, type TaskAnalyticsData } from '../api/taskAnalyticsApi';

// ── Colour palette (matches the rest of the app's indigo/purple scheme) ─────
const PALETTE = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];
const PIE_COLORS = { Submitted: '#6366f1', 'Not Submitted': '#334155' };

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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
    <div
      className={`relative overflow-hidden rounded-3xl p-6 border border-panel-hover bg-panel shadow-xl flex flex-col gap-3 group hover:border-indigo-500/40 transition-all duration-300`}
    >
      {/* decorative glow */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${gradient}`}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-content-muted">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className="text-4xl font-black text-content tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <p className="text-xs font-bold text-content-muted">{sub}</p>}
    </div>
  );
}

// Custom tooltip for pie chart
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0];
    return (
      <div className="bg-panel border border-panel-hover p-3 rounded-2xl shadow-2xl text-sm font-bold text-content flex items-center gap-2">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ background: d.payload.fill ?? d.fill }}
        />
        {d.name}: <span className="text-indigo-400">{d.value}</span>
      </div>
    );
  }
  return null;
};

// Custom tooltip for bar/line charts
const GenericTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-panel/95 backdrop-blur-md border border-panel-hover p-4 rounded-2xl shadow-2xl">
        <p className="text-xs font-black text-content-muted uppercase tracking-wider mb-2">
          {label}
        </p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Status badge with colour coding
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    AI_GRADED: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    FINALIZED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  };
  const cls = map[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}

// Section header used for each chart/table block
function SectionHeader({
  icon: Icon,
  title,
  color = 'text-indigo-400',
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Icon className={`h-4 w-4 ${color}`} />
      <h3 className="text-sm font-black text-content uppercase tracking-widest">{title}</h3>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = 'studentName' | 'taskTitle' | 'status' | 'submissionDate' | 'finalGrade';

export function TaskAnalyticsDashboard({ departmentId, courseId, taskId }: { departmentId?: string; courseId?: string; taskId?: string }) {
  const [data, setData] = useState<TaskAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submissionDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    (async () => {
      try {
        const result = await getTaskAnalytics({ departmentId, courseId, taskId });
        setData(result);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, [departmentId, courseId, taskId]);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-black text-content-muted uppercase tracking-widest">
          Crunching analytics…
        </p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-bold text-red-400">{error ?? 'No data returned'}</p>
      </div>
    );
  }

  const { summary, charts, table } = data;

  // ── Table helpers ───────────────────────────────────────────────────────────
  const filteredRows = table.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.taskTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    const va = a[sortKey] ?? '';
    const vb = b[sortKey] ?? '';
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);
  const pageRows = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
    ) : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-content flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-indigo-500" />
          Task Analytics
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
          Submission insights · Admin & Instructor view
        </p>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          label="Total Tasks"
          value={summary.totalTasks}
          icon={ClipboardList}
          color="text-indigo-400"
          gradient="bg-indigo-500"
        />
        <SummaryCard
          label="Submissions"
          value={summary.submittedCount}
          icon={ClipboardCheck}
          color="text-emerald-400"
          gradient="bg-emerald-500"
        />
        <SummaryCard
          label="Not Submitted"
          value={summary.notSubmittedCount}
          icon={ClipboardX}
          color="text-rose-400"
          gradient="bg-rose-500"
        />
        <SummaryCard
          label="Submission Rate"
          value={`${summary.submissionRate}%`}
          sub={`${summary.submittedCount} of ${summary.totalTasks} tasks covered`}
          icon={TrendingUp}
          color="text-purple-400"
          gradient="bg-purple-500"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pie: Submitted vs Not Submitted */}
        <div className="bg-panel rounded-3xl border border-panel-hover p-6 shadow-xl flex flex-col">
          <SectionHeader icon={PieIcon} title="Submitted vs Not" color="text-indigo-400" />
          <div className="flex-1 min-h-[220px]">
            {charts.submittedVsNotSubmitted.every((d) => d.value === 0) ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.submittedVsNotSubmitted}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {charts.submittedVsNotSubmitted.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] ?? '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-bold text-content-muted">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar: Submissions per Student */}
        <div className="bg-panel rounded-3xl border border-panel-hover p-6 shadow-xl flex flex-col">
          <SectionHeader icon={BarChart3} title="Submissions / Student" color="text-emerald-400" />
          <div className="flex-1 min-h-[220px]">
            {charts.submissionsPerStudent.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.submissionsPerStudent.slice(0, 10)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e48" vertical={false} />
                  <XAxis
                    dataKey="studentName"
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<GenericTooltip />} cursor={{ fill: '#2e2e48', opacity: 0.4 }} />
                  <Bar dataKey="submittedCount" name="Submissions" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {charts.submissionsPerStudent.slice(0, 10).map((_e, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Line: Submissions over time */}
        <div className="bg-panel rounded-3xl border border-panel-hover p-6 shadow-xl flex flex-col">
          <SectionHeader icon={LineIcon} title="Submissions Over Time" color="text-purple-400" />
          <div className="flex-1 min-h-[220px]">
            {charts.submissionsOverTime.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.submissionsOverTime}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e48" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<GenericTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Submissions"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#a855f7', stroke: '#181825', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Submissions Table ────────────────────────────────────────────────── */}
      <div className="bg-panel rounded-3xl border border-panel-hover shadow-xl overflow-hidden">
        {/* Table header */}
        <div className="p-6 border-b border-panel-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-black text-content uppercase tracking-widest">
              Submission Details
            </h3>
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-[10px] font-black">
              {filteredRows.length} rows
            </span>
          </div>
          {/* Search */}
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Filter by student, task or status…"
            className="w-full sm:w-64 h-10 rounded-xl bg-app border border-panel-hover text-content text-sm px-4 placeholder:text-content-muted focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel-hover/30">
              <tr>
                {(
                  [
                    { key: 'studentName', label: 'Student' },
                    { key: 'taskTitle', label: 'Task' },
                    { key: 'status', label: 'Status' },
                    { key: 'submissionDate', label: 'Submitted On' },
                    { key: 'finalGrade', label: 'Grade' },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="p-4 text-[10px] font-black uppercase tracking-wider text-content-muted cursor-pointer hover:text-content transition-colors select-none whitespace-nowrap"
                  >
                    {label}
                    <SortIcon k={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-hover">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-content-muted">
                    No submissions match your filter.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-panel-hover/20 transition-colors group"
                  >
                    <td className="p-4 font-bold text-content group-hover:text-indigo-300 transition-colors whitespace-nowrap">
                      {row.studentName || '—'}
                    </td>
                    <td className="p-4 text-content-muted max-w-[200px] truncate">
                      {row.taskTitle || '—'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="p-4 text-content-muted whitespace-nowrap">
                      {row.submissionDate ?? '—'}
                    </td>
                    <td className="p-4 text-center">
                      {row.finalGrade != null ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
                          {row.finalGrade}
                        </span>
                      ) : (
                        <span className="text-content-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-panel-hover flex items-center justify-between">
            <p className="text-xs text-content-muted">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-content-muted hover:bg-panel-hover disabled:opacity-30 transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-content-muted hover:bg-panel-hover disabled:opacity-30 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared empty-state helper ─────────────────────────────────────────────────
function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-content-muted text-sm">
      No data yet
    </div>
  );
}
