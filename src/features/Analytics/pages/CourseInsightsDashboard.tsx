import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw 
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

// API Response Types
interface InsightData {
  chartData: Array<{ year: string; averageScore: number; submissionCount: number }>;
  aiInsights: {
    overall_score: number;
    trend_analysis: string;
    core_strengths: string[];
    persistent_issues: string[];
    action_plan: string[];
  };
}

export const CourseInsightsDashboard: React.FC = () => {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (forceAI = false) => {
    if (forceAI) setRefreshing(true);
    else setLoading(true);

    try {
      // Mocking API Call for GET /api/courses/:id/insights
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse: InsightData = {
        chartData: [
          { year: "2024", averageScore: 3.2, submissionCount: 45 },
          { year: "2025", averageScore: 4.1, submissionCount: 60 }
        ],
        aiInsights: {
          overall_score: forceAI ? 88 : 85,
          trend_analysis: "Performance has significantly improved over the last year, driven by higher student engagement and clearer curriculum updates.",
          core_strengths: ["Clear curriculum updates", "High student engagement"],
          persistent_issues: ["Slight delays in assignment grading", "Some technical issues during labs"],
          action_plan: ["Implement automated grading for quick checks", "Upgrade lab technical infrastructure"]
        }
      };
      
      setData(mockResponse);
    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-app">
        <Loader2 className="animate-spin text-content/50 w-10 h-10" />
      </div>
    );
  }

  if (!data) return null;

  const { overall_score, trend_analysis, core_strengths, persistent_issues, action_plan } = data.aiInsights;

  // Determine color based on score (Green > 75, Yellow > 50, Red otherwise)
  const getScoreColor = (score: number) => {
    if (score > 75) return "text-emerald-400";
    if (score > 50) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="min-h-screen bg-app text-content p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-3">
            Course Insights
          </h1>
          <p className="text-content/60 text-lg leading-relaxed">
            {trend_analysis}
          </p>
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
          
          <div className="flex items-center gap-4 bg-panel/50 px-6 py-4 rounded-2xl border border-panel">
            <span className="text-sm text-content/40 uppercase tracking-widest font-semibold">Overall Score</span>
            <div className={`text-5xl font-bold tracking-tighter ${getScoreColor(overall_score)} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
              {overall_score}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-panel border border-panel rounded-3xl p-6 md:p-8 mb-8 shadow-2xl"
      >
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
          Performance Curve
        </h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="year" 
                stroke="#ffffff40" 
                tick={{ fill: '#ffffff60', fontSize: 12 }} 
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
                contentStyle={{ 
                  backgroundColor: '#0f111a', 
                  borderColor: '#ffffff10', 
                  borderRadius: '12px', 
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#e2e8f0', fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
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

      {/* AI Actionable Cards (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Strengths */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-panel border border-emerald-500/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-emerald-400 font-semibold mb-6 flex items-center gap-3 text-lg">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            Core Strengths
          </h3>
          <ul className="space-y-4 relative z-10 flex-grow">
            {core_strengths.map((item, idx) => (
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
          className="bg-panel border border-amber-500/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-amber-400 font-semibold mb-6 flex items-center gap-3 text-lg">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            Persistent Issues
          </h3>
          <ul className="space-y-4 relative z-10 flex-grow">
            {persistent_issues.map((item, idx) => (
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
          className="bg-panel border border-indigo-500/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-indigo-400 font-semibold mb-6 flex items-center gap-3 text-lg">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            Action Plan
          </h3>
          <ul className="space-y-4 relative z-10 flex-grow">
            {action_plan.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-content/80 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

      </div>
    </div>
  );
};

export default CourseInsightsDashboard;
