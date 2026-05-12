import { useState, useMemo } from 'react';
import { 
  Calendar, Plus, Search, Filter, MoreVertical, 
  Clock, CheckCircle2, AlertCircle, Play, Pause,
  Users, FileText, ChevronRight, ArrowRight,
  TrendingUp, BarChart2, Loader2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import type { EvaluationCycle, CycleStatus } from '../types/cycle.types';

import * as cycleApi from '../api/cycleApi';
import { useEffect } from 'react';
import { CycleModal } from '../components/CycleModal';
import type { CreateCyclePayload } from '../api/cycleApi';

export default function EvaluationCyclesPage() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CycleStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      const data = await cycleApi.getCycles();
      setCycles(data);
    } catch (error) {
      toast.error('Failed to synchronize campaign data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const filteredCycles = useMemo(() => {
    return cycles.filter(c => {
      const matchesTab = activeTab === 'ALL' || c.status === activeTab;
      const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [cycles, activeTab, searchQuery]);

  const handleSave = async (payload: CreateCyclePayload) => {
    try {
      await cycleApi.createCycle(payload);
      toast.success('Evaluation cycle scheduled successfully');
      fetchCycles();
    } catch (error) {
      toast.error('Failed to schedule campaign');
      throw error;
    }
  };

  const getStatusConfig = (status: CycleStatus) => {
    switch (status) {
      case 'ACTIVE': return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Play, label: 'Running' };
      case 'UPCOMING': return { color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Clock, label: 'Scheduled' };
      case 'COMPLETED': return { color: 'text-slate-400 bg-white/5 border-white/10', icon: CheckCircle2, label: 'Finished' };
      default: return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle, label: 'Draft' };
    }
  };

  return (
    <div className="flex-1 space-y-10 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-500" />
            Evaluation Cycles
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Campaign & Schedule Management</p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Schedule New Cycle
        </Button>
      </div>

      {/* Campaign Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Cycles', value: cycles.length, trend: '+2 this month', icon: Calendar, color: 'text-indigo-400' },
          { label: 'Active Now', value: cycles.filter(c => c.status === 'ACTIVE').length, trend: 'High Engagement', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Target Users', value: '5.7k', trend: 'Global Reach', icon: Users, color: 'text-purple-400' },
          { label: 'Avg. Completion', value: '72%', trend: '+5% vs Q1', icon: BarChart2, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-[#1e1b2e] border border-white/5 shadow-2xl flex flex-col gap-4 group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between">
               <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                  <stat.icon className="h-5 w-5" />
               </div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
              <h4 className="text-3xl font-black text-white mt-1">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#1e1b2e] p-3 rounded-2xl border border-white/5">
          <div className="flex gap-1 p-1 bg-[#0f111a] rounded-xl border border-white/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
            {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'DRAFT'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-6 py-2 text-xs font-black transition-all rounded-lg uppercase tracking-widest whitespace-nowrap",
                  activeTab === t
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-96 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by campaign name..."
              className="h-11 rounded-xl bg-[#0f111a] border-white/10 text-white pl-12 font-bold"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          </div>
        </div>

        {/* Cycles List */}
        <div className="grid grid-cols-1 gap-6 pb-20">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Campaign Data...</p>
            </div>
          ) : filteredCycles.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 opacity-20">
              <Calendar className="h-16 w-16 text-slate-500" />
              <p className="text-lg font-bold text-slate-500">No active cycles found</p>
            </div>
          ) : (
            filteredCycles.map((cycle) => {
            const status = getStatusConfig(cycle.status);
            return (
              <div key={cycle.id} className="group relative rounded-3xl bg-[#1e1b2e] border border-white/5 hover:border-white/10 shadow-2xl transition-all overflow-hidden">
                <div className="p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                  {/* Status & Date */}
                  <div className="flex flex-col gap-3 lg:w-48 shrink-0">
                    <Badge className={cn("w-fit px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-[0.2em]", status.color)}>
                       <status.icon className="h-3 w-3 mr-2" />
                       {status.label}
                    </Badge>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-600 uppercase">Campaign Window</span>
                       <span className="text-sm font-bold text-white mt-1">{cycle.startDate} → {cycle.endDate}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors flex items-center gap-3">
                      {cycle.name}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </h3>
                    <p className="text-sm text-slate-500 font-medium line-clamp-1">{cycle.description}</p>
                    <div className="flex flex-wrap gap-4 pt-2">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                          <FileText className="h-3 w-3 text-indigo-500" /> {cycle.formName}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                          <Users className="h-3 w-3 text-purple-500" /> {cycle.participantsCount} Recipients
                       </div>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex flex-col lg:items-end gap-6 lg:w-64 shrink-0">
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                        <span>Response Rate</span>
                        <span className={cn(cycle.completionRate > 50 ? 'text-emerald-400' : 'text-amber-400')}>
                           {cycle.completionRate}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#0f111a] rounded-full overflow-hidden border border-white/5 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${cycle.completionRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                       <Button variant="ghost" className="flex-1 lg:flex-none h-11 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs">
                          <Pause className="h-4 w-4 mr-2" /> Stop
                       </Button>
                       <Button className="flex-1 lg:flex-none h-11 px-6 rounded-xl bg-[#0f111a] border border-white/10 hover:border-indigo-500/50 text-indigo-400 font-bold text-xs uppercase tracking-widest shadow-xl">
                          Analytics
                       </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) )}
        </div>
      </div>

      <CycleModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
      />
    </div>
  );
}
