import { useState, useEffect, useMemo } from 'react';
import { 
 ClipboardList, Plus, Search, MoreVertical, Edit3, Trash2, 
 Calendar, Users, Target, Clock, AlertCircle, CheckCircle2,
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
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { TaskModal } from '../components/TaskModal';
import * as taskApi from '../api/taskApi';
import type { Task, CreateTaskPayload } from '../api/taskApi';

export default function TaskManagementPage() {
 const [tasks, setTasks] = useState<Task[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
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
 if (editingTask) {
 await taskApi.updateTask(editingTask.id || editingTask._id!, payload);
 toast.success('Task architecture updated');
 } else {
 await taskApi.createTask(payload);
 toast.success('New task provisioned successfully');
 }
 fetchTasks();
 setIsModalOpen(false);
 } catch (error: any) {
 toast.error(error.response?.data?.message || 'Operation failed');
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
 <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
 <ClipboardList className="h-8 w-8 text-indigo-500"/>
 Task Management
 </h2>
 <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Academic Assignments & Projects</p>
 </div>

 <div className="flex items-center gap-3 w-full md:w-auto">
 <Button variant="outline"className="h-12 px-6 rounded-xl border-white/10 hover:bg-[#1a1d29] text-slate-300 font-bold">
 <Download className="mr-2 h-4 w-4"/> Export Report
 </Button>
 <Button 
 onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
 className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-indigo-500/20 transition-[border-color,background-color] flex items-center gap-2"
 >
 <Plus className="h-5 w-5"/>
 Create Task
 </Button>
 </div>
 </div>

 {/* Control Bar */}
 <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#13151f] p-4 rounded-3xl border border-white/5">
 <div className="w-full lg:w-96 relative group">
 <Input 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search tasks by title..."
 className="h-12 rounded-2xl bg-[#0f111a] border-white/5 text-white pl-12 pr-4 font-bold"
 />
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors"/>
 </div>

 <div className="flex items-center gap-4 w-full lg:w-auto">
 <Button variant="ghost"className="text-slate-400 font-bold hover:text-white hover:bg-[#1a1d29]">
 <Filter className="mr-2 h-4 w-4"/> All Status
 </Button>
 <div className="h-8 w-px bg-[#1a1d29] mx-2 hidden lg:block"></div>
 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Tasks: {tasks.length}</p>
 </div>
 </div>

 {/* Task Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {isLoading ? (
 <div className="col-span-full py-20 flex flex-col items-center gap-4">
 <Loader2 className="h-10 w-10 animate-spin text-indigo-500"/>
 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Tasks...</p>
 </div>
 ) : filteredTasks.map((task) => (
 <div key={task.id || task._id} className="group relative rounded-3xl bg-[#13151f] border border-white/5 hover:border-indigo-500/50 transition-[border-color,background-color] p-8 flex flex-col gap-6">
 <div className="flex justify-between items-start">
 <div className="flex gap-4">
 <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-white/5">
 <ClipboardList className="h-8 w-8"/>
 </div>
 <div>
 <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">{task.title}</h3>
 <div className="flex items-center gap-2 mt-1">
 <Badge variant="outline"className="font-mono text-[10px] border-white/10 text-slate-500 uppercase">
 Deadline: {new Date(task.deadline).toLocaleDateString()}
 </Badge>
 <span className="text-[10px] text-slate-600 uppercase font-black">
 {task.status === 'ACTIVE' ? (
 <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Active</span>
 ) : (
 <span className="text-red-500 flex items-center gap-1"><Clock className="h-3 w-3"/> Closed</span>
 )}
 </span>
 </div>
 </div>
 </div>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost"className="h-10 w-10 p-0 rounded-xl hover:bg-[#1a1d29]">
 <MoreVertical className="h-5 w-5 text-slate-500"/>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end"className="bg-[#0a0a0f] border-white/5 min-w-[160px]">
 <DropdownMenuItem 
 onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
 className="flex items-center gap-2 hover:bg-[#1a1d29] font-bold py-3 text-indigo-400 cursor-pointer"
 >
 <Edit3 className="h-4 w-4"/> Edit Details
 </DropdownMenuItem>
 <DropdownMenuItem 
 onClick={() => handleDelete(task.id || task._id!)}
 className="flex items-center gap-2 hover:bg-red-500/10 font-bold py-3 text-red-400 cursor-pointer"
 >
 <Trash2 className="h-4 w-4"/> Purge Task
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 italic">
"{task.description || 'No instruction set for this assignment.'}"
 </p>

 <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-[#1a1d29] text-indigo-400">
 <Target className="h-4 w-4"/>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-black text-slate-600 uppercase">Target Entity</span>
 <span className="text-xs font-bold text-slate-200">Department Wide</span>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-[#1a1d29] text-purple-400">
 <Users className="h-4 w-4"/>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-black text-slate-600 uppercase">Submissions</span>
 <span className="text-xs font-bold text-slate-200">0 Responses</span>
 </div>
 </div>
 </div>

 <div className="mt-2 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
 {task.creator_id?.firstName?.charAt(0) || 'A'}
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter leading-none">Creator</span>
 <span className="text-[11px] font-bold text-slate-300">{task.creator_id?.firstName || 'System'} {task.creator_id?.lastName || 'Admin'}</span>
 </div>
 </div>
 
 <Button variant="ghost"className="h-10 px-4 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest group">
 View Submissions <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
 </Button>
 </div>
 </div>
 ))}
 </div>

 <TaskModal 
 open={isModalOpen} 
 onClose={() => setIsModalOpen(false)} 
 task={editingTask}
 onSave={handleSave}
 />
 </div>
 );
}
