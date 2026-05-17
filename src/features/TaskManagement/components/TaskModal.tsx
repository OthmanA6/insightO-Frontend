import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
 ClipboardList, Target, Loader2, CheckCircle2, 
 Users, Check, Search, X, BookOpen, Building2, Plus,
 UploadCloud, FileText, AlertCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import api from '@/shared/api/axiosInstance';
import * as userAdminApi from '@/shared/api/userAdminApi';
import type { AdminUser } from '@/shared/api/userAdminApi';
import * as courseApi from '@/shared/api/courseApi';
import type { Task, CreateTaskPayload } from '../api/taskApi';
import * as departmentApi from '@/shared/api/departmentApi';
import type { Department } from '@/shared/api/departmentApi';
import { toast } from 'sonner';

interface TaskModalProps {
 open: boolean;
 onClose: () => void;
 task?: Task | null;
 onSave: (payload: CreateTaskPayload) => Promise<void>;
 /** Pre-filled department ID from route context */
 contextDepartmentId?: string;
 /** Pre-filled course ID from route context */
 contextCourseId?: string;
}

export function TaskModal({ open, onClose, task, onSave, contextDepartmentId, contextCourseId }: TaskModalProps) {
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [departments, setDepartments] = useState<Department[]>([]);
 
 // Form State
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [deadline, setDeadline] = useState('');
 const [rubric, setRubric] = useState('');
 const [attachments, setAttachments] = useState<{url: string, fileName?: string, size?: number}[]>([]);
 const [isUploading, setIsUploading] = useState(false);
 const [status, setStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
 const fileInputRef = useRef<HTMLInputElement>(null);
 
 // Target Selection State
 const [targetType, setTargetType] = useState<'COURSE' | 'DEPARTMENT' | 'SPECIFIC'>('COURSE');
 const [deptId, setDeptId] = useState('');
 const [allStudents, setAllStudents] = useState<AdminUser[]>([]);
 const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
 const [isLoadingUsers, setIsLoadingUsers] = useState(false);
 const [studentSearch, setStudentSearch] = useState('');
 const [contextCourseName, setContextCourseName] = useState<string>('');

 // Determine if department is locked by context
 const isDeptLocked = !!contextDepartmentId;

 useEffect(() => {
 if (contextCourseId) {
 courseApi.getCourseById(contextCourseId)
 .then(c => setContextCourseName(c.name))
 .catch(() => console.error('Failed to fetch context course'));
 }
 }, [contextCourseId]);

 useEffect(() => {
 const fetchDepts = async () => {
 try {
 const data = await departmentApi.getAllDepartments();
 setDepartments(data);
 } catch (err) {
 console.error('Failed to fetch departments');
 }
 };
 if (open) fetchDepts();
 }, [open]);

 useEffect(() => {
 const fetchStudents = async () => {
 if (targetType !== 'SPECIFIC' || allStudents.length > 0) return;
 setIsLoadingUsers(true);
 try {
 const users = await userAdminApi.getAllUsers();
 setAllStudents(users.filter(u => u.role === 'STUDENT'));
 } catch (err) {
 toast.error('Failed to load student directory');
 } finally {
 setIsLoadingUsers(false);
 }
 };
 if (open && targetType === 'SPECIFIC') fetchStudents();
 }, [open, targetType, allStudents.length]);

 useEffect(() => {
 if (task) {
 setTitle(task.title);
 setDescription(task.description);
 setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
 setRubric(task.ai_grading_rubric || '');
 setAttachments(task.attachments?.map(a => ({ url: a.url, fileName: a.fileName })) || []);
 setStatus(task.status || 'ACTIVE');
 
 // Resolve Target Type
 if (task.target.specific_users && task.target.specific_users.length > 0) {
 setTargetType('SPECIFIC');
 setSelectedUserIds(task.target.specific_users);
 } else if (task.target.department_id) {
 setTargetType('DEPARTMENT');
 setDeptId(task.target.department_id);
 } else {
 setTargetType('COURSE');
 }
 } else {
 setTitle('');
 setDescription('');
 setDeadline('');
 setRubric('');
 setAttachments([]);
 setStatus('ACTIVE');
 setSelectedUserIds([]);
 setDeptId(contextDepartmentId || '');
 // Auto-switch target type based on context
 if (contextCourseId) setTargetType('COURSE');
 else if (contextDepartmentId) setTargetType('DEPARTMENT');
 else setTargetType('COURSE');
 }
 }, [task, open, contextDepartmentId, contextCourseId]);

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setIsUploading(true);
 try {
 const formData = new FormData();
 formData.append('file', file);
 const response = await api.post('/upload', formData, {
 headers: { 'Content-Type': 'multipart/form-data' },
 });
 const data = response.data.data;
 setAttachments((prev) => [...prev, { url: data.url, fileName: file.name, size: data.size }]);
 } catch (error) {
 toast.error('File upload failed');
 } finally {
 setIsUploading(false);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 
 // Validation
 if (!title || !description || !deadline || !rubric) {
 toast.error('Please fill in all mandatory fields, including the AI Rubric');
 return;
 }

 if (targetType === 'DEPARTMENT' && !contextDepartmentId && !deptId) {
 toast.error('Please select a target department');
 return;
 }

 if (targetType === 'SPECIFIC' && selectedUserIds.length === 0) {
 toast.error('Please select at least one student');
 return;
 }

 setIsSubmitting(true);
 try {
 const payload: CreateTaskPayload = {
 title,
 description,
 deadline: new Date(deadline).toISOString(),
 ai_grading_rubric: rubric,
 status,
 target: {}
 };

 const validAttachments = attachments.filter(a => a.url.trim() !== '');
 if (validAttachments.length > 0) {
 payload.attachments = validAttachments.map(a => ({
 url: a.url.trim(),
 fileName: a.fileName?.trim() || undefined
 }));
 }

 if (targetType === 'COURSE') {
 payload.target.course_id = contextCourseId;
 } else if (targetType === 'DEPARTMENT') {
 payload.target.department_id = contextDepartmentId || deptId;
 } else if (targetType === 'SPECIFIC') {
 payload.target.specific_users = selectedUserIds;
 }

 await onSave(payload);
 onClose();
 } catch (error) {
 // Error handled by parent
 } finally {
 setIsSubmitting(false);
 }
 };

 const filteredStudents = allStudents.filter(s => 
 s.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
 s.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
 s.email.toLowerCase().includes(studentSearch.toLowerCase())
 );

 const toggleStudent = (id: string) => {
 setSelectedUserIds(prev => 
 prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
 );
 };

 return (
 <Modal
 open={open}
 onClose={onClose}
 title=""
 size="xl"
 className="max-w-3xl bg-[#0a0a0f] border-white/5"
 >
 <Modal.Header 
 title={
 <div className="flex flex-col gap-1">
 <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
 <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
 <ClipboardList className="h-5 w-5 text-indigo-400"/>
 </div>
 {task ? 'Edit Task Architecture' : 'Provision New Task'}
 </h2>
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
 Assignment & Academic Delivery
 </p>
 </div>
 }
 />

 <Modal.Body className="p-8 space-y-8 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="space-y-6">
 <div className="flex flex-col gap-2">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Task Title</Label>
 <Input 
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="e.g. AI Ethics Case Study"
 className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
 />
 </div>

 <div className="flex flex-col gap-2">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Instructional Context</Label>
 <Textarea 
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Provide detailed instructions for the target audience..."
 className="bg-[#0f111a] border-white/10 text-white min-h-[120px] rounded-2xl focus:ring-indigo-500 p-4"
 />
 </div>

 {/* Target Selection Tabs */}
 <div className="flex flex-col gap-4">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Delivery Target</Label>
 <Tabs 
 value={targetType} 
 onValueChange={(v) => setTargetType(v as any)}
 className="w-full"
 >
 <TabsList className={`grid w-full bg-[#0f111a] p-1 rounded-xl h-12 border border-white/5 ${
 contextCourseId ? 'grid-cols-1' : contextDepartmentId ? 'grid-cols-2' : 'grid-cols-3'
 }`}>
 {(!contextDepartmentId || contextCourseId) && (
 <TabsTrigger 
 value="COURSE"
 className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 font-bold text-xs flex items-center gap-2"
 >
 <BookOpen className="h-3.5 w-3.5"/> Course
 </TabsTrigger>
 )}
 {!contextCourseId && (
 <TabsTrigger 
 value="DEPARTMENT"
 className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 font-bold text-xs flex items-center gap-2"
 >
 <Building2 className="h-3.5 w-3.5"/> Dept
 </TabsTrigger>
 )}
 {!contextCourseId && (
 <TabsTrigger 
 value="SPECIFIC"
 className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 font-bold text-xs flex items-center gap-2"
 >
 <Users className="h-3.5 w-3.5"/> Specific
 </TabsTrigger>
 )}
 </TabsList>
 </Tabs>
 </div>

 <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
 {targetType === 'COURSE' && (
 <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/80">
 <BookOpen className="h-5 w-5"/>
 <div className="flex flex-col">
 <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Course Bound Delivery</span>
 <span className="text-sm font-bold text-slate-200">
 Target: {contextCourseId ? (contextCourseName || 'Loading...') : 'Inherited from View Context'}
 </span>
 </div>
 </div>
 )}

 {targetType === 'DEPARTMENT' && (
 <div className="flex flex-col gap-2.5">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Select Department</Label>
 <div className="relative">
 <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none z-10"/>
 <select
 value={deptId}
 onChange={(e) => setDeptId(e.target.value)}
 disabled={isDeptLocked}
 className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#0f111a] border border-white/10 text-white text-sm font-medium appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 transition-[border-color,background-color] disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value=""className="bg-[#0f111a]">-- Choose Department --</option>
 {departments.map((d) => (
 <option key={d.id} value={d.id} className="bg-[#0f111a]">
 {d.name}
 </option>
 ))}
 </select>
 </div>
 </div>
 )}

 {targetType === 'SPECIFIC' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between gap-4">
 <div className="relative flex-1">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"/>
 <Input 
 value={studentSearch}
 onChange={(e) => setStudentSearch(e.target.value)}
 placeholder="Search student directory..."
 className="bg-[#0f111a] border-white/10 text-white h-11 pl-11 rounded-xl"
 />
 </div>
 {selectedUserIds.length > 0 && (
 <Button 
 variant="ghost"
 size="sm"
 onClick={() => setSelectedUserIds([])}
 className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
 >
 Clear {selectedUserIds.length}
 </Button>
 )}
 </div>

 <ScrollArea className="max-h-60 h-auto min-h-[120px] rounded-xl border border-white/5 bg-[#0f111a]/50 p-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
 {isLoadingUsers ? (
 <div className="flex items-center justify-center h-full gap-3 text-slate-500 py-10">
 <Loader2 className="h-4 w-4 animate-spin"/>
 <span className="text-xs font-bold uppercase">Indexing Student Database...</span>
 </div>
 ) : filteredStudents.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10 opacity-30 gap-2">
 <Users className="h-8 w-8"/>
 <span className="text-[10px] font-black uppercase">No students found</span>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {filteredStudents.map((s) => (
 <div 
 key={s.id}
 onClick={() => toggleStudent(s.id)}
 className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-[border-color,background-color] ${
 selectedUserIds.includes(s.id) 
 ? 'bg-indigo-500/10 border-indigo-500/30' 
 : 'bg-transparent border-white/5 hover:border-white/10'
 }`}
 >
 <Checkbox 
 checked={selectedUserIds.includes(s.id)}
 className="border-white/20 data-[state=checked]:bg-indigo-600"
 />
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-bold text-white truncate">{s.firstName} {s.lastName}</span>
 <span className="text-[9px] font-medium text-slate-500 truncate">{s.email}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </ScrollArea>
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="flex flex-col gap-2">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Submission Deadline</Label>
 <Input 
 type="datetime-local"
 value={deadline}
 onChange={(e) => setDeadline(e.target.value)}
 onClick={(e) => (e.currentTarget as any).showPicker?.()}
 className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
 required
 />
 </div>

 <div className="flex flex-col gap-2">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Task Status</Label>
 <div className="flex gap-2 bg-[#0f111a] p-1 rounded-xl border border-white/10 h-12">
 <button
 type="button"
 onClick={() => setStatus('ACTIVE')}
 className={`flex-1 rounded-lg text-xs font-bold transition-[border-color,background-color] flex items-center justify-center gap-2 ${status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
 >
 <CheckCircle2 className="h-4 w-4"/> Active
 </button>
 <button
 type="button"
 onClick={() => setStatus('CLOSED')}
 className={`flex-1 rounded-lg text-xs font-bold transition-[border-color,background-color] flex items-center justify-center gap-2 ${status === 'CLOSED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-slate-300'}`}
 >
 <AlertCircle className="h-4 w-4"/> Closed
 </button>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-2">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
 AI Grading Rubric
 <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-black">MANDATORY</span>
 </Label>
 <Textarea 
 value={rubric}
 onChange={(e) => setRubric(e.target.value)}
 placeholder={`Calibration Guide: Act as a friendly Teaching Assistant for a [Level, e.g., Freshman] course. Evaluate based on: 1. Logical flow (40%), 2. Accuracy of concepts (40%), 3. Professionalism (20%). \n\nNote: Be lenient on minor syntax but strict on core understanding. Feedback should be constructive and encourage the student to think deeper.`}
 className="bg-[#0f111a] border-white/10 text-white min-h-[140px] rounded-2xl focus:ring-indigo-500 p-4 text-sm leading-relaxed"
 required
 />
 <p className="text-[9px] text-slate-500 italic ml-1">This rubric guides the AI agent during the automated grading sequence.</p>
 </div>

 <div className="flex flex-col gap-3">
 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Attachments (Optional)</Label>
 
 <div 
 onClick={() => !isUploading && fileInputRef.current?.click()}
 className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
 isUploading 
 ? 'border-indigo-500/50 bg-indigo-500/5 cursor-wait' 
 : 'border-white/10 hover:border-indigo-500/50 hover:bg-[#1a1d29] cursor-pointer'
 }`}
 >
 <input 
 type="file"
 className="hidden"
 ref={fileInputRef} 
 onChange={handleFileUpload} 
 accept=".pdf,.png,.jpg,.jpeg"
 />
 
 <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
 {isUploading ? (
 <Loader2 className="h-6 w-6 text-indigo-400 animate-spin"/>
 ) : (
 <UploadCloud className="h-6 w-6 text-indigo-400"/>
 )}
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-slate-200">
 {isUploading ? 'Uploading securely...' : 'Click to Upload Material'}
 </p>
 <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG (Max 10MB)</p>
 </div>
 </div>

 {attachments.length > 0 && (
 <div className="space-y-2 mt-2">
 {attachments.map((att, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0f111a] border border-white/5 animate-in fade-in zoom-in-95 duration-200">
 <div className="flex items-center gap-3 min-w-0">
 <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
 <FileText className="h-4 w-4"/>
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-bold text-slate-200 truncate">{att.fileName || 'Attachment'}</span>
 {att.size && <span className="text-[10px] text-slate-500 font-mono">{(att.size / 1024).toFixed(1)} KB</span>}
 </div>
 </div>
 <Button
 type="button"
 variant="ghost"
 onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
 className="h-8 w-8 p-0 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
 >
 <X className="h-4 w-4"/>
 </Button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
 <Button variant="ghost"type="button"onClick={onClose} className="h-12 px-6 rounded-xl text-slate-400">
 Cancel
 </Button>
 <Button 
 type="submit"
 disabled={isSubmitting}
 className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-bold shadow-indigo-500/20 transition-[border-color,background-color] flex items-center gap-2"
 >
 {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}
 {task ? 'Update Infrastructure' : 'Authorize Publication'}
 </Button>
 </div>
 </form>
 </Modal.Body>
 </Modal>
 );
}
