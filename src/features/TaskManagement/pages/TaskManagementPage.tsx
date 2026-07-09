import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Plus, Search, MoreVertical, Edit3, Trash2,
  Users, Target, Clock, CheckCircle2,
  Filter, Download, ArrowUpRight, Loader2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';

import { toast } from 'sonner';
import { TaskModal } from '../components/TaskModal';
import { TaskTypeSelectorModal } from '../components/TaskTypeSelectorModal';
import { TaskAnalyticsDashboard } from '../components/TaskAnalyticsDashboard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as taskApi from '../api/taskApi';
import type { Task, CreateTaskPayload } from '../api/taskApi';

export default function TaskManagementPage() {
  const { user } = useAuth();
  const canViewAnalytics = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await taskApi.getTasks();
      setTasks(data);
    } catch (error) {
      toast.error('Failed to synchronize task data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleSave = async (payload: CreateTaskPayload) => {
    try {
      let savedTask;
      if (editingTask) {
        savedTask = await taskApi.updateTask(editingTask.id || editingTask._id!, payload);
        toast.success('Task architecture updated');
      } else {
        savedTask = await taskApi.createTask(payload);
        toast.success('New task provisioned successfully');
      }
      fetchTasks();
      setIsTaskModalOpen(false);
      return savedTask;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to purge this task? All student submissions will be lost.')) {
      try {
        await taskApi.deleteTask(id);
        toast.success('Task purged from system');
        fetchTasks();
      } catch (error) {
        toast.error('Purge operation failed');
      }
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-content flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-indigo-500" />
            Task Management
          </h2>
          <p className="text-content-muted font-bold uppercase text-[10px] tracking-[0.3em]">Academic Assignments &amp; Projects</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          <Button
            onClick={() => setIsSelectorOpen(true)}
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-indigo-500/20 transition-[border-color,background-color] flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Task
          </Button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="bg-panel border border-panel p-1.5 rounded-2xl mb-8 inline-flex h-14 items-center justify-center gap-1">
          <TabsTrigger
            value="tasks"
            className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-content-muted hover:text-content transition-all shadow-sm"
          >
            Tasks Management
          </TabsTrigger>
          {canViewAnalytics && (
            <TabsTrigger
              value="analytics"
              className="rounded-xl px-8 py-2.5 text-sm font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-content text-content-muted hover:text-content transition-all shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              Task Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tasks Tab (existing content, untouched) ── */}
        <TabsContent value="tasks" className="mt-0 outline-none space-y-8">
          {/* Control Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-panel p-4 rounded-3xl border border-panel">
            <div className="w-full lg:w-96 relative group">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title..."
                className="h-12 rounded-2xl bg-app border-panel text-content ps-12 pe-4 font-bold"
              />
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <Button variant="ghost" className="text-content-muted font-bold hover:text-content hover:bg-panel">
                <Filter className="me-2 h-4 w-4" /> All Status
              </Button>
              <div className="h-8 w-px bg-panel mx-2 hidden lg:block"></div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Tasks: {tasks.length}</p>
            </div>
          </div>

          {/* Task Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-sm font-bold text-content-muted uppercase tracking-widest">Synchronizing Tasks...</p>
              </div>
            ) : filteredTasks.map((task) => (
              <div key={task.id || task._id} className="group relative rounded-3xl bg-panel border border-panel hover:border-indigo-500/50 transition-[border-color,background-color] p-8 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-panel">
                      <ClipboardList className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-content group-hover:text-indigo-400 transition-colors">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-[10px] border-panel-hover text-content-muted uppercase">
                          {(() => {
                            try {
                              const d = new Date(task.deadline);
                              const diff = d.getTime() - Date.now();
                              if (diff < 0) return `Expired: ${d.toLocaleDateString()}`;
                              const dDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const dHrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
                              const dMin = Math.floor((diff / 1000 / 60) % 60);
                              if (dDays > 0) return `Deadline: ${dDays}d ${dHrs}h remaining`;
                              if (dHrs > 0) return `Deadline: ${dHrs}h ${dMin}m remaining`;
                              return `Deadline: ${dMin}m remaining`;
                            } catch { return `Deadline: ${task.deadline}`; }
                          })()}
                        </Badge>
                        <span className="text-[10px] text-slate-600 uppercase font-black">
                          {task.status === 'ACTIVE' ? (
                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Active</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Closed</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-panel">
                        <MoreVertical className="h-5 w-5 text-content-muted" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-app border-panel min-w-[160px]">
                      <DropdownMenuItem
                        onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                        className="flex items-center gap-2 hover:bg-panel font-bold py-3 text-indigo-400 cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(task.id || task._id!)}
                        className="flex items-center gap-2 hover:bg-red-500/10 font-bold py-3 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" /> Purge Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-content-muted leading-relaxed line-clamp-2 italic">
                  "{task.description || 'No instruction set for this assignment.'}"
                </p>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-panel">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-panel text-indigo-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase">Target Entity</span>
                      <span className="text-xs font-bold text-content">Department Wide</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-panel text-purple-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase">Submissions</span>
                      <span className="text-xs font-bold text-content">{task.responsesCount || 0} Responses</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-content">
                      {task.creator_id?.firstName?.charAt(0) || 'A'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-content-muted uppercase tracking-tighter leading-none">Creator</span>
                      <span className="text-[11px] font-bold text-content-muted">{task.creator_id?.firstName || 'System'} {task.creator_id?.lastName || 'Admin'}</span>
                    </div>
                  </div>

                  <Button variant="ghost" className="h-10 px-4 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest group">
                    View Submissions <ArrowUpRight className="ms-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Analytics Tab ── */}
        {canViewAnalytics && (
          <TabsContent value="analytics" className="mt-0 outline-none">
            <TaskAnalyticsDashboard />
          </TabsContent>
        )}
      </Tabs>

      <TaskTypeSelectorModal
        open={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectAttachment={() => setIsTaskModalOpen(true)}
      />
      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        onSave={handleSave}
      />
    </div>
  );
}

