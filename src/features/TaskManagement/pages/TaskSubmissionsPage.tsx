import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
 FileText, User, Clock, CheckCircle2, AlertCircle,
 Loader2, Download, Star, MessageSquare, Paperclip,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';
import * as departmentApi from '@/shared/api/departmentApi';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import * as taskSubmissionApi from '@/shared/api/taskSubmissionApi';
import * as formApi from '@/features/FormBuilder/api/formApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { Form } from '@/features/FormBuilder/types/form.types';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function TaskSubmissionsPage() {
 const { departmentId, courseId, taskId } = useParams<{
 departmentId: string;
 courseId: string;
 taskId: string;
 }>();

 const navigate = useNavigate();
 const { user } = useAuth();
 const [task, setTask] = useState<Task | null>(null);
 const [form, setForm] = useState<Form | null>(null);
 const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 
 // Breadcrumb context
 const [departmentName, setDepartmentName] = useState('');
 const [courseName, setCourseName] = useState('');

 useEffect(() => {
 const fetchContext = async () => {
 try {
 if (departmentId && departmentId !== 'all') {
 const dept = await departmentApi.getDepartment(departmentId);
 setDepartmentName(dept.name);
 } else if (departmentId === 'all') {
 setDepartmentName('Teaching');
 }
 if (courseId) {
 const course = await courseApi.getCourseById(courseId);
 setCourseName(course.name);
 }
 } catch {
 // Breadcrumb will show fallback
 }
 };
 fetchContext();
 }, [departmentId, courseId]);

 useEffect(() => {
 const fetchData = async () => {
 if (!taskId || taskId === 'undefined' || taskId.startsWith(':')) return;
 setIsLoading(true);
 try {
 const [taskData, submissionsData] = await Promise.all([
 taskApi.getTaskById(taskId),
 taskSubmissionApi.getTaskSubmissions(taskId),
 ]);
 setTask(taskData);
 setSubmissions(submissionsData);
 if (taskData.task_type === 'QUIZ' && taskData.form_id) {
   const formData = await formApi.getForm(taskData.form_id);
   setForm(formData);
 }
 } catch (error) {
 toast.error('Failed to load task submissions');
 } finally {
 setIsLoading(false);
 }
 };
 fetchData();
 }, [taskId]);

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'GRADED':
 return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'REVIEWED':
 return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 default:
 return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
 }
 };

 return (
 <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
 {/* Breadcrumb */}
 <BreadcrumbNav
 homeItem={{ label: 'Command Center', href: '/dashboard' }}
 items={
 user?.role === 'INSTRUCTOR'
 ? [
 { label: 'Module Directory', href: '/dashboard/courses' },
 { label: courseName || 'Course', href: `/dashboard/courses/${courseId}` },
 { label: task?.title || 'Task' },
 ]
 : [
 {
 label: departmentName || 'Department',
 href: departmentId === 'all' ? undefined : `/dashboard/departments/${departmentId}`,
 },
 {
 label: courseName || 'Course',
 href: `/dashboard/departments/${departmentId}/courses/${courseId}`,
 },
 { label: task?.title || 'Task' },
 ]
 }
 />

 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div className="space-y-1">
 <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
 <FileText className="h-8 w-8 text-indigo-500"/>
 {task?.title || 'Task Submissions'}
 </h2>
 <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
 Student Submissions & Grading
 </p>
 </div>

 <div className="flex items-center gap-3 w-full md:w-auto">
 <Button
 variant="outline"
 className="h-12 px-6 rounded-xl border-white/10 hover:bg-[#1a1d29] text-slate-300 font-bold"
 >
 <Download className="mr-2 h-4 w-4"/> Export All
 </Button>
 </div>
 </div>

 {/* Task Info Card */}
 {task && (
 <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10">
 <p className="text-sm text-slate-400 leading-relaxed italic mb-4">
"{task.description || 'No instructions provided.'}"
 </p>
 <div className="flex flex-wrap items-center gap-4">
 <Badge
 variant="outline"
 className="font-mono text-[10px] border-white/10 text-slate-400"
 >
 <Clock className="mr-1.5 h-3 w-3"/>
 Deadline: {new Date(task.deadline).toLocaleDateString()}
 </Badge>
 <Badge
 variant="outline"
 className={cn(
 'text-[10px] font-black uppercase',
 task.status === 'ACTIVE'
 ? 'text-emerald-400 border-emerald-500/20'
 : 'text-red-400 border-red-500/20',
 )}
 >
 {task.status === 'ACTIVE' ? (
 <>
 <CheckCircle2 className="mr-1.5 h-3 w-3"/> Active
 </>
 ) : (
 <>
 <AlertCircle className="mr-1.5 h-3 w-3"/> Closed
 </>
 )}
 </Badge>
 <Badge
 variant="outline"
 className="font-mono text-[10px] border-white/10 text-indigo-400"
 >
 {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
 </Badge>
 </div>
 {task.ai_grading_rubric && (
 <div className="mt-4 pt-4 border-t border-white/5">
 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
 AI Grading Rubric
 </span>
 <p className="text-xs text-slate-400 mt-1">{task.ai_grading_rubric}</p>
 </div>
 )}
 </div>
 )}

 {/* Submissions List */}
 <div className="space-y-6">
 {isLoading ? (
 <div className="py-20 flex flex-col items-center gap-4">
 <Loader2 className="h-10 w-10 animate-spin text-indigo-500"/>
 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
 Loading Submissions...
 </p>
 </div>
 ) : submissions.length === 0 ? (
 <div className="py-20 flex flex-col items-center gap-4 opacity-20">
 <FileText className="h-16 w-16 text-slate-500"/>
 <p className="text-lg font-bold text-slate-500">
 No submissions received yet
 </p>
 </div>
 ) : (
 submissions.map((sub) => {
 const subId = sub.id || sub._id!;
 const student =
 typeof sub.submitter_id === 'object'
 ? sub.submitter_id
 : null;

 return (
 <div
 key={subId}
 className="group rounded-3xl bg-[#13151f] border border-white/10 hover:border-indigo-500/50 transition-[border-color,background-color] p-8"
 >
 <div className="flex flex-col md:flex-row justify-between items-start gap-6">
 {/* Student Info */}
 <div className="flex items-start gap-4 flex-1">
 <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-white/5 shrink-0">
 <User className="h-7 w-7"/>
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-lg font-black text-white">
 {student
 ? `${student.firstName} ${student.lastName}`
 : 'Unknown Student'}
 </h3>
 <p className="text-xs text-slate-500 font-mono">
 {student?.email || '—'}
 </p>

 {/* Submitted content */}
 {task?.task_type === 'QUIZ' && sub.form_answers && sub.form_answers.length > 0 ? (
   <div className="mt-4 space-y-4 p-5 rounded-2xl bg-[#0f111a] border border-white/5">
     <div className="flex items-center gap-2 mb-2">
       <div className="h-2 w-2 rounded-full bg-indigo-500" />
       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Quiz Responses</span>
     </div>
     {sub.form_answers.map((ans, i) => {
       const qLabel = form?.questions.find((q) => String(q.id || q._id) === String(ans.question_id))?.label || `Question ${i + 1}`;
       return (
         <div key={i} className="space-y-1">
           <p className="text-xs font-bold text-slate-400">{qLabel}</p>
           <p className="text-sm text-slate-200">
             {Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value)}
           </p>
         </div>
       );
     })}
   </div>
 ) : (
   <div className="mt-4 p-4 rounded-2xl bg-[#0f111a] border border-white/5">
     <p className="text-sm text-slate-300 leading-relaxed">
       {sub.content || 'No content provided.'}
     </p>
   </div>
 )}

 {/* Attachments */}
 {sub.attachments && sub.attachments.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-2">
 {sub.attachments.map((att, i) => (
 <a
 key={i}
 href={att.url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d29] text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 transition-colors"
 >
 <Paperclip className="h-3 w-3"/>
 {att.fileName || 'Attachment'}
 </a>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Right side: Grading info + actions */}
 <div className="flex flex-col items-end gap-4 shrink-0">
 {/* Status */}
 <Badge
 variant="outline"
 className={cn(
 'text-[10px] font-black uppercase px-3 py-1',
 getStatusColor(sub.status),
 )}
 >
 {sub.status}
 </Badge>

 {/* Submitted time */}
 <span className="text-[10px] text-slate-600 font-bold">
 {sub.createdAt
 ? new Date(sub.createdAt).toLocaleString()
 : '—'}
 </span>

 {/* Grades */}
 <div className="space-y-2 text-right">
 {sub.ai_evaluation?.suggested_grade !== undefined && sub.ai_evaluation?.suggested_grade !== null && (
 <div className="flex items-center gap-2">
 <Star className="h-3.5 w-3.5 text-amber-400"/>
 <span className="text-xs font-bold text-slate-400">
 AI Grade:{' '}
 <span className="text-amber-400 font-black">
 {sub.ai_evaluation.suggested_grade}
 </span>
 </span>
 </div>
 )}
 {sub.final_grade !== undefined && sub.final_grade !== null && (
 <div className="flex items-center gap-2">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400"/>
 <span className="text-xs font-bold text-slate-400">
 Final Grade:{' '}
 <span className="text-emerald-400 font-black">
 {sub.final_grade}
 </span>
 </span>
 </div>
 )}
 </div>

 {/* Feedback */}
 {sub.instructor_feedback && (
 <div className="flex items-start gap-2 max-w-xs">
 <MessageSquare className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0"/>
 <p className="text-xs text-slate-400 italic">
"{sub.instructor_feedback}"
 </p>
 </div>
 )}

 {/* Action */}
 {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR' || user?.role === 'HOD') && (
<Button
 variant={sub.status === 'FINALIZED' ?"outline":"ghost"}
 className={cn(
"h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-[border-color,background-color]",
 sub.status === 'FINALIZED' 
 ?"text-slate-400 border-white/10 hover:bg-[#1a1d29] hover:text-slate-200"
 :"text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
 )}
  onClick={() => {
    const subId = sub.id || sub._id;
    const targetUrl = departmentId
      ? `/dashboard/departments/${departmentId}/courses/${courseId}/tasks/${taskId}/submissions/${subId}/grade`
      : `/dashboard/courses/${courseId}/tasks/${taskId}/submissions/${subId}/grade`;
    navigate(targetUrl);
  }}
 >
 <Star className="mr-1.5 h-3.5 w-3.5"/>
 {sub.status === 'FINALIZED' ? 'Update Evaluation' : 'Finalize Grade'}
 </Button>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>

  {/* Modal state has been migrated to standalone InstructorGradingPage */}
 </div>
 );
}
