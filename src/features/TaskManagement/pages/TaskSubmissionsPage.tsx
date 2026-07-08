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
import { SystemFileViewer } from '@/shared/components/ui/SystemFileViewer';
import { Modal } from '@/shared/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { TaskAnalyticsDashboard } from '@/features/TaskManagement/components/TaskAnalyticsDashboard';

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
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);

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
          setEnrolledStudents(course.enrolledStudents || []);
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

  const submittedStudentIds = new Set(
    submissions.map((s) => {
      if (typeof s.submitter_id === 'object' && s.submitter_id !== null) {
        return (s.submitter_id as any)._id || (s.submitter_id as any).id;
      }
      return s.submitter_id;
    })
  );

  const pendingStudents = enrolledStudents.filter((student) => {
    const sid = student._id || student.id;
    return sid && !submittedStudentIds.has(sid);
  });

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
          <h2 className="text-4xl font-black tracking-tight text-content flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-500" />
            {task?.title || 'Task Submissions'}
          </h2>
          <p className="text-content-muted font-bold uppercase text-[10px] tracking-[0.3em]">
            Student Submissions & Grading
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-xl border-panel-hover hover:bg-panel text-content-muted font-bold"
          >
            <Download className="me-2 h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      {/* Task Info Card */}
      {task && (
        <div className="p-6 rounded-3xl bg-panel border border-panel-hover flex flex-col gap-4">
          <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2">
            <p className="text-sm text-content-muted leading-relaxed italic whitespace-pre-wrap break-words">
              "{task.description || 'No instructions provided.'}"
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-panel-hover text-content-muted"
            >
              <Clock className="me-1.5 h-3 w-3" />
              Deadline: {new Date(task.deadline).toLocaleDateString()}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-black uppercase',
                task.status === 'ACTIVE'
                  ? 'text-emerald-400 border-emerald-500/20'
                  : 'text-red-400 border-eed-500/20',
              )}
            >
              {task.status === 'ACTIVE' ? (
                <>
                  <CheckCircle2 className="me-1.5 h-3 w-3" /> Active
                </>
              ) : (
                <>
                  <AlertCircle className="me-1.5 h-3 w-3" /> Closed
                </>
              )}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-panel-hover text-indigo-400"
            >
              {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {task.ai_grading_rubric && (
            <div className="mt-4 pt-4 border-t border-panel">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                AI Grading Rubric
              </span>
              <p className="text-xs text-content-muted mt-1">{task.ai_grading_rubric}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="w-full">
        <div className="overflow-x-auto custom-scrollbar mb-8 pb-2">
          <TabsList className="bg-panel border border-panel p-1 flex w-fit rounded-2xl min-w-max">
            <TabsTrigger value="submissions" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-sm font-bold transition-all">
              Submissions
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-content text-sm font-bold transition-all flex items-center gap-2">
              Pending ({pendingStudents.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-content text-sm font-bold transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Task Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="mt-0 outline-none">
          <TaskAnalyticsDashboard taskId={taskId} />
        </TabsContent>

        <TabsContent value="submissions" className="mt-0 outline-none">
          {/* Submissions List */}
          <div className={cn(
            "w-full transition-all",
            !isLoading && submissions.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : ""
          )}>
            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-4 w-full">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-sm font-bold text-content-muted uppercase tracking-widest">
                  Loading Submissions...
                </p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-20 w-full">
                <FileText className="h-16 w-16 text-content-muted" />
                <p className="text-lg font-bold text-content-muted">
                  No submissions received yet
                </p>
              </div>
            ) : (
              submissions.map((sub) => {
                const subId = sub.id || sub._id!;
                const student = typeof sub.submitter_id === 'object' ? sub.submitter_id : null;

                return (
                  <div
                    key={subId}
                    className="group rounded-3xl bg-panel border border-panel-hover hover:border-indigo-500/50 transition-[border-color,background-color] p-6 flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    {/* Header: Student Info & Status */}
                    <div className="flex items-start justify-between gap-4 mb-4 border-b border-panel pb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-panel shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-sm font-black text-content truncate">
                            {student ? `${student.firstName} ${student.lastName}` : 'Unknown'}
                          </h3>
                          <p className="text-[10px] text-content-muted font-mono truncate">
                            {student?.email || '—'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 h-fit shrink-0',
                          getStatusColor(sub.status)
                        )}
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    {/* Body: Content Summary */}
                    <div className="flex-1 flex flex-col gap-4">
                      {task?.task_type === 'QUIZ' && sub.form_answers && sub.form_answers.length > 0 ? (
                        <div className="p-3 rounded-2xl bg-app border border-panel h-24 overflow-y-auto custom-scrollbar">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Quiz Snapshot</span>
                          </div>
                          {sub.form_answers.slice(0, 2).map((ans: any, i: number) => {
                            const qLabel = ans.question_id?.label || form?.questions.find((q) => String(q.id || q._id) === String(ans.question_id))?.label || `Q${i + 1}`;
                            return (
                              <div key={i} className="mb-2 last:mb-0">
                                <p className="text-[10px] font-bold text-content-muted truncate">{qLabel}</p>
                                <p className="text-xs text-content truncate">
                                  {Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value)}
                                </p>
                              </div>
                            );
                          })}
                          {sub.form_answers.length > 2 && (
                            <p className="text-[10px] text-content-muted italic">+{sub.form_answers.length - 2} more answers...</p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-app border border-panel h-24 overflow-y-auto custom-scrollbar">
                          <p className="text-xs text-content-muted leading-relaxed break-words whitespace-pre-wrap">
                            {sub.content || 'No text content provided.'}
                          </p>
                        </div>
                      )}

                      {/* Attachments & Time */}
                      <div className="flex flex-col gap-3 mt-auto pt-2">
                        {sub.attachments && sub.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {sub.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-panel-hover border border-panel group-hover:border-indigo-500/20 transition-colors max-w-full">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedFile({ url: att.url, name: att.fileName || 'Attachment' });
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer truncate"
                                  title={att.fileName || 'Attachment'}
                                >
                                  <FileText className="h-3 w-3 shrink-0" />
                                  <span className="truncate max-w-[120px]">{att.fileName || 'Attachment'}</span>
                                </button>
                                <div className="w-px h-2 bg-white/20 shrink-0"></div>
                                <a
                                  href={new URL(att.url, import.meta.env.VITE_API_URL || 'http://localhost:5000').href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                                  title="Download"
                                >
                                  <Download className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9px] font-bold text-slate-500">
                            {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}
                          </span>
                        {/* Grades compact */}
                        <div className="flex items-center gap-2">
                          {sub.ai_evaluation?.suggested_grade !== undefined && sub.ai_evaluation?.suggested_grade !== null && (
                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20" title="AI Suggested Grade">
                              <Star className="h-3 w-3" />
                              <span className="text-[10px] font-black">{sub.ai_evaluation.suggested_grade}</span>
                            </div>
                          )}
                          {sub.final_grade !== undefined && sub.final_grade !== null && (
                            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20" title="Final Grade">
                              <CheckCircle2 className="h-3 w-3" />
                              <span className="text-[10px] font-black">{sub.final_grade}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                    <div className="mt-4 pt-4 border-t border-panel flex flex-col gap-2">
                       {/* Feedback compact */}
                       {sub.instructor_feedback && (
                        <div className="flex items-start gap-1.5 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-2">
                          <MessageSquare className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-content-muted italic line-clamp-2">
                            "{sub.instructor_feedback}"
                          </p>
                        </div>
                      )}
                      {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR' || user?.role === 'HOD') && (
                        <Button
                          variant={sub.status === 'FINALIZED' ? "outline" : "ghost"}
                          className={cn(
                            "w-full h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                            sub.status === 'FINALIZED'
                              ? "text-content-muted border-panel-hover hover:bg-panel hover:text-content"
                              : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          )}
                          onClick={() => {
                            const subId = sub.id || sub._id;
                            const targetUrl = departmentId
                              ? `/dashboard/departments/${departmentId}/courses/${courseId}/tasks/${taskId}/submissions/${subId}/grade`
                              : `/dashboard/courses/${courseId}/tasks/${taskId}/submissions/${subId}/grade`;
                            navigate(targetUrl);
                          }}
                        >
                          <Star className="me-1.5 h-3.5 w-3.5" />
                          {sub.status === 'FINALIZED' ? 'Update Evaluation' : 'Finalize Grade'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-0 outline-none">
          <div className="p-8 rounded-3xl bg-panel border border-panel-hover flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-content">Pending Submissions</h3>
                <p className="text-xs font-bold text-content-muted uppercase tracking-widest mt-1">
                  Students who haven't submitted yet
                </p>
              </div>
              <Badge variant="outline" className="h-8 px-3 text-amber-400 border-amber-500/20 bg-amber-500/10 font-bold">
                {pendingStudents.length} Pending
              </Badge>
            </div>

            {pendingStudents.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-4 opacity-50">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-sm font-bold text-content-muted">All enrolled students have submitted!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pendingStudents.map(student => (
                  <div key={student._id || student.id} className="flex items-center gap-3 p-4 rounded-2xl bg-app border border-panel">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 flex items-center justify-center text-amber-400 border border-panel shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-sm font-bold text-content truncate">
                        {student.firstName} {student.lastName}
                      </h4>
                      <p className="text-[10px] text-content-muted font-mono truncate">
                        {student.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* File Viewer Modal */}
      <Modal
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        title={selectedFile?.name || 'File Viewer'}
        size="7xl"
      >
        {selectedFile && (
          <SystemFileViewer fileUrl={selectedFile.url} fileName={selectedFile.name} />
        )}
      </Modal>
    </div>
  );
}
