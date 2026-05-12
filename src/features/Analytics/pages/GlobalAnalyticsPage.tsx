import { useState } from 'react';
import { 
  BarChart3, TrendingUp, PieChart, Brain, 
  Target, Zap, AlertTriangle, CheckCircle2,
  Calendar, Download, Filter, Search, ChevronRight,
  Smile, Meh, Frown, Users, Building2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

export default function GlobalAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('Quarterly');

  return (
    <div className="flex-1 space-y-10 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-500" />
            Institutional Insights
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">AI-Powered Strategic Analysis</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-[#1e1b2e] rounded-xl border border-white/5">
             {['Monthly', 'Quarterly', 'Annual'].map(t => (
               <button 
                 key={t}
                 onClick={() => setTimeRange(t)}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                   timeRange === t ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 {t}
               </button>
             ))}
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-xl border-white/10 hover:bg-white/5 text-slate-300 font-bold">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* AI Synthesis Executive Summary */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e1b2e] via-[#1e1b2e] to-[#2d2a42] border border-white/5 shadow-2xl p-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
               <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                  <Brain className="h-8 w-8 text-indigo-400" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white">AI Executive Synthesis</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aggregated Across 124 Active Surveys</p>
               </div>
            </div>

            <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
              "Performance metrics indicate a <span className="text-emerald-400 font-bold">12% growth</span> in student satisfaction within the <span className="text-white">Computer Science</span> faculty. However, qualitative analysis reveals recurring bottlenecks in <span className="text-amber-400 font-bold">'Response Latency'</span> regarding hardware provisioning. Strategic focus should shift toward departmental resource allocation for Q3."
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Smile className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Positive Sentiment: 74%</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Actionable Items: 12</span>
               </div>
            </div>
          </div>

          <div className="w-full lg:w-80 h-80 rounded-full border-[16px] border-indigo-500/10 relative flex items-center justify-center shadow-inner">
             <div className="absolute inset-4 border-[16px] border-white/5 rounded-full" />
             <div className="flex flex-col items-center">
                <span className="text-6xl font-black text-white">8.4</span>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-1">Global Score</span>
             </div>
             {/* Simple visualization ring segments could be added here */}
          </div>
        </div>
      </div>

      {/* Grid: Department Performance & Sentiment Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sentiment Heatmap Placeholder */}
        <div className="lg:col-span-2 rounded-3xl bg-[#1e1b2e] border border-white/5 p-8 space-y-8 shadow-2xl">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black text-white flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Performance Trends
             </h3>
             <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">View Full Map</Button>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-4">
             {[65, 42, 88, 70, 55, 95, 80].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full relative">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-xl transition-all duration-700 shadow-lg group-hover:opacity-80"
                      style={{ height: `${h}%` }}
                    >
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 opacity-0 group-hover:opacity-100 bg-[#0a0a0f] text-white text-[10px] font-black px-2 py-1 rounded-lg border border-white/10 transition-all">
                          {h}%
                       </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase">W{i+1}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Actionable Insights Panel */}
        <div className="rounded-3xl bg-[#1e1b2e] border border-white/5 p-8 space-y-8 shadow-2xl">
           <h3 className="text-xl font-black text-white flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-400" />
              Critical Alerts
           </h3>
           <div className="space-y-4">
              {[
                { label: 'Hardware Latency', dept: 'CS & AI', level: 'High', color: 'text-red-400' },
                { label: 'Library Access', dept: 'General', level: 'Med', color: 'text-amber-400' },
                { label: 'Lab Booking', dept: 'Mechanical', level: 'Low', color: 'text-indigo-400' },
              ].map((alert, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-white">{alert.label}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{alert.dept}</span>
                   </div>
                   <Badge variant="outline" className={cn("font-black text-[9px] border-white/10", alert.color)}>{alert.level}</Badge>
                </div>
              ))}
           </div>
           <Button className="w-full h-12 rounded-2xl bg-[#0f111a] border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-widest transition-all">
              Launch Resolution Cycle
           </Button>
        </div>

      </div>

      {/* Bottom Grid: Department Comparison */}
      <div className="rounded-[32px] bg-[#1e1b2e] border border-white/5 shadow-2xl overflow-hidden">
         <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h3 className="text-xl font-black text-white">Departmental Comparative Matrix</h3>
            <div className="relative w-64">
               <Input placeholder="Filter matrix..." className="h-10 rounded-xl bg-[#0f111a] border-white/5 text-xs" />
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-white/5 bg-white/[0.01]">
                     <th className="px-8 py-5">Entity Architecture</th>
                     <th className="px-6 py-5">Satisfaction Index</th>
                     <th className="px-6 py-5">Faculty Engagement</th>
                     <th className="px-6 py-5">Trend Variance</th>
                     <th className="px-8 py-5 text-right">Deep Analysis</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {[
                    { name: 'Computer Science', score: '8.8/10', eng: '94%', trend: '+4.2%' },
                    { name: 'Mechanical Engineering', score: '7.2/10', eng: '82%', trend: '-1.5%' },
                    { name: 'Business School', score: '8.1/10', eng: '88%', trend: '+0.8%' },
                  ].map((row, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                       <td className="px-8 py-6 flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-indigo-500" />
                          <span className="text-sm font-black text-white">{row.name}</span>
                       </td>
                       <td className="px-6 py-6 font-bold text-sm text-slate-300">{row.score}</td>
                       <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5 w-32">
                             <div className="h-1.5 w-full bg-[#0f111a] rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: row.eng }} />
                             </div>
                             <span className="text-[9px] font-black text-slate-600 uppercase">{row.eng} Engaged</span>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <Badge className={cn("font-black text-[10px]", row.trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
                             {row.trend}
                          </Badge>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                             <ChevronRight className="h-5 w-5" />
                          </Button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
