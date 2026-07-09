import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '@/shared/api/axiosInstance';
import { toast } from 'sonner';

interface EntityInsightsProps {
  entityType: "COURSE" | "DEPARTMENT" | "INSTRUCTOR" | "FACILITY";
  entityId: string;
}

interface InsightData {
  chartData: Array<{ year: string; averageScore: number; submissionCount: number; formId?: string; formTitle?: string; date?: string }>;
  aiInsights: {
    overall_score: number;
    trend_analysis: string;
    core_strengths: string[];
    persistent_issues: string[];
    action_plan: string[];
  } | null;
  ai_status: "active" | "quota_exceeded_or_unavailable";
}

export const EntityInsightsView: React.FC<EntityInsightsProps> = ({ entityType, entityId }) => {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (forceAI = false) => {
    if (forceAI) setRefreshing(true);
    else setLoading(true);

    try {
      let endpoint = '';
      if (entityType === "COURSE") {
        endpoint = `/courses/${entityId}/insights`;
      } else if (entityType === "DEPARTMENT") {
        endpoint = `/admin/departments/${entityId}/insights`; // ركز هنا ضفنا admin/
      } else if (entityType === "INSTRUCTOR") {
        endpoint = `/users/${entityId}/insights`;
      } else if (entityType === "FACILITY") {
        endpoint = `/facilities/${entityId}/insights`;
      }

      if (forceAI) {
        endpoint += `?forceAI=true`;
      }

      const response = await api.get<{ status: string; data: InsightData }>(endpoint);
      const fetchedData = response.data.data;
      if (forceAI && fetchedData.ai_status === "no_data") {
        toast.error("There are no responses available to analyze yet.");
      }
      setData(fetchedData);
    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchInsights();
    }
  }, [entityId, entityType]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="animate-spin text-content/50 w-10 h-10" />
      </div>
    );
  }

  if (!data) return null;

  const { chartData, aiInsights, ai_status } = data;
  const { overall_score, trend_analysis, core_strengths, persistent_issues, action_plan } = aiInsights || {};

  const getScoreColor = (score: number) => {
    if (score > 75) return "text-emerald-400";
    if (score > 50) return "text-amber-400";
    return "text-rose-400";
  };
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-panel border border-panel-hover rounded-2xl p-4 shadow-sm backdrop-blur-md w-[200px]">
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-black mb-1">Survey Details</p>
          <h4 className="text-sm font-bold text-content mb-2 leading-snug truncate" title={data.formTitle || "Survey"}>
            {data.formTitle || "Survey"}
          </h4>
          <div className="h-px bg-panel-hover my-2" />
          <div className="flex justify-between items-center text-xs text-content-muted mb-1">
            <span>Date:</span>
            <span className="font-medium text-content">{data.date}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-content-muted mb-1">
            <span>Submissions:</span>
            <span className="font-mono font-bold text-content">{data.submissionCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-content-muted mt-2 pt-1 border-t border-panel">
            <span className="font-medium text-indigo-300">Average Score:</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{data.averageScore} / 5</span>
          </div>
        </div>
      );
    }
    return null;
  };
  if (ai_status === "no_data" || !chartData || chartData.length === 0) {
    return (
      <div className="min-h-[50vh] bg-transparent text-content p-8 space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-content capitalize">
            {entityType.toLowerCase()} Insights
          </h1>
        </div>
        <div className="p-12 bg-panel border border-panel rounded-3xl flex flex-col items-center justify-center text-center shadow-sm max-w-3xl mx-auto mt-6">
          <div className="bg-indigo-500/10 p-5 rounded-2xl mb-6 shadow-inner text-indigo-400">
             <Zap className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-content mb-2 uppercase tracking-wide">System Ready for Synthesis</h3>
          <p className="text-content-muted text-sm font-medium max-w-md leading-relaxed">
            There are no submissions available for this form yet. Once users submit responses, AI synthesis and performance tracking will be available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-transparent text-content p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-content mb-3 capitalize">
            {entityType.toLowerCase()} Insights
          </h1>
          {aiInsights && (
            <p className="text-content/60 text-lg leading-relaxed">
              {trend_analysis}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-4 min-w-[200px]">
          <button
            onClick={() => fetchInsights(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-panel hover:bg-panel-hover border border-panel rounded-xl transition-all text-sm font-medium shadow-lg hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <RefreshCw className="w-4 h-4 text-indigo-400" />}
            Refresh AI Insights
          </button>

          {aiInsights && overall_score !== undefined && (
            <div className="flex items-center gap-4 bg-panel/50 px-6 py-4 rounded-2xl border border-panel">
              <span className="text-sm text-content/40 uppercase tracking-widest font-semibold">Overall Score</span>
              <div className={`text-5xl font-bold tracking-tighter ${getScoreColor(overall_score)} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                {overall_score}
              </div>
            </div>
          )}
        </div>
      </div>

      {ai_status === "quota_exceeded_or_unavailable" && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-400 font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          ⚠️ AI Analysis is currently unavailable (Quota Exceeded). Displaying quantitative data only.
        </div>
      )}

      {/* Chart Section */}
      {(() => {
        const processedChartData = chartData.map((d, index) => ({
          ...d,
          uniqueKey: `${d.year}__${index}`
        }));
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-panel border border-panel rounded-3xl p-6 md:p-8 mb-8 shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
              Performance Curve
            </h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={processedChartData.length === 1 ? [
                    { ...processedChartData[0], uniqueKey: 'Start' }, 
                    processedChartData[0], 
                    { ...processedChartData[0], uniqueKey: 'Current' }
                  ] : processedChartData} 
                  margin={{ top: 20, right: 30, left: -10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="uniqueKey"
                    stroke="#ffffff40"
                    tickFormatter={(value) => value.split('__')[0]}
                    tick={{ fill: '#ffffff60', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    stroke="#ffffff40"
                    tick={{ fill: '#ffffff60', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickCount={6}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'var(--panel-hover)', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="averageScore"
                    name="Average Score"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    activeDot={{ r: 6, fill: '#818cf8', stroke: '#0f111a', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })()}

      {/* AI Actionable Cards (3-Column Grid) */}
      {aiInsights && ai_status !== "no_data" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Core Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-panel border border-emerald-500/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-emerald-400 font-semibold mb-6 flex items-center gap-3 text-lg">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              Core Strengths
            </h3>
            <ul className="space-y-4 relative z-10 flex-grow">
              {core_strengths?.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-content/80 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Persistent Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-panel border border-amber-500/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-amber-400 font-semibold mb-6 flex items-center gap-3 text-lg">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Persistent Issues
            </h3>
            <ul className="space-y-4 relative z-10 flex-grow">
              {persistent_issues?.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-content/80 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Action Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-panel border border-indigo-500/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-indigo-400 font-semibold mb-6 flex items-center gap-3 text-lg">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              Action Plan
            </h3>
            <ul className="space-y-4 relative z-10 flex-grow">
              {action_plan?.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-content/80 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      )}

      {/* Contributing Forms Table */}
      {chartData && chartData.length > 0 && (
        <div className="mt-8 bg-panel border border-panel rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            Contributing Forms
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel-hover">
                  <th className="py-4 px-4 text-xs font-bold text-content-muted uppercase tracking-wider">Form Title</th>
                  <th className="py-4 px-4 text-xs font-bold text-content-muted uppercase tracking-wider">Date</th>
                  <th className="py-4 px-4 text-xs font-bold text-content-muted uppercase tracking-wider">Submissions</th>
                  <th className="py-4 px-4 text-xs font-bold text-content-muted uppercase tracking-wider">Avg Score</th>
                  <th className="py-4 px-4 text-xs font-bold text-content-muted uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr key={idx} className="border-b border-panel-hover/50 hover:bg-panel-hover/30 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-content">{row.formTitle || 'Untitled Survey'}</td>
                    <td className="py-4 px-4 text-sm text-content-muted">{row.date || row.year}</td>
                    <td className="py-4 px-4 text-sm font-mono text-content-muted">{row.submissionCount}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        {row.averageScore} / 5
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {row.formId && (
                        <a 
                          href={`/dashboard/forms-results/${row.formId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-end gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          View Results <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
