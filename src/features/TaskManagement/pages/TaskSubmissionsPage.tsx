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
        <div className="p-6 rounded-3xl bg-panel border border-panel-hover">
          <p className="text-sm text-content-muted leading-relaxed italic mb-4">
            "{task.description || 'No instructions provided.'}"
          </p>
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

      {/* Submissions List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-content-muted uppercase tracking-widest">
              Loading Submissions...
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 opacity-20">
            <FileText className="h-16 w-16 text-content-muted" />
            <p className="text-lg font-bold text-content-muted">
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
                className="group rounded-3xl bg-panel border border-panel-hover hover:border-indigo-500/50 transition-[border-color,background-color] p-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  {/* Student Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-panel shrink-0">
                      <User className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-content">
                        {student
                          ? `${student.firstName} ${student.lastName}`
                          : 'Unknown Student'}
                      </h3>
                      <p className="text-xs text-content-muted font-mono">
                        {student?.email || '—'}
                      </p>

                      {/* Submitted content */}
                      {task?.task_type === 'QUIZ' && sub.form_answers && sub.form_answers.length > 0 ? (
                        <div className="mt-4 space-y-4 p-5 rounded-2xl bg-app border border-panel">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Quiz Responses</span>
                          </div>
                          {sub.form_answers.map((ans: any, i: number) => {
                            // 👈 التعديل هنا: بنقرأ الـ label من الـ Object اللي رجع من الـ Populate!
                            const qLabel = ans.question_id?.label || form?.questions.find((q) => String(q.id || q._id) === String(ans.question_id))?.label || `Question ${i + 1}`;

                            return (
                              <div key={i} className="space-y-1">
                                <p className="text-xs font-bold text-content-muted">{qLabel}</p>
                                <p className="text-sm text-content">
                                  {Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 p-4 rounded-2xl bg-app border border-panel">
                          <p className="text-sm text-content-muted leading-relaxed">
                            {sub.content || 'No content provided.'}
                          </p>
                        </div>
                      )}

                      {/* Attachments */}
                      {sub.attachments && sub.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {sub.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel border border-panel group-hover:border-indigo-500/20 transition-colors">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedFile({ url: att.url, name: att.fileName || 'Attachment' });
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                title="Smart View"
                              >
                                <FileText className="h-3 w-3" />
                                {att.fileName || 'Attachment'}
                              </button>
                              <div className="w-px h-3 bg-white/10 mx-1"></div>
                              <a
                                href={new URL(att.url, import.meta.env.VITE_API_URL || 'http://localhost:5000').href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                title="Download"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </div>
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
                    <div className="space-y-2 text-end">
                      {sub.ai_evaluation?.suggested_grade !== undefined && sub.ai_evaluation?.suggested_grade !== null && (
                        <div className="flex items-center gap-2">
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-content-muted">
                            AI Grade:{' '}
                            <span className="text-amber-400 font-black">
                              {sub.ai_evaluation.suggested_grade}
                            </span>
                          </span>
                        </div>
                      )}
                      {sub.final_grade !== undefined && sub.final_grade !== null && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-content-muted">
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
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-content-muted italic">
                          "{sub.instructor_feedback}"
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR' || user?.role === 'HOD') && (
                      <Button
                        variant={sub.status === 'FINALIZED' ? "outline" : "ghost"}
                        className={cn(
                          "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-[border-color,background-color]",
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
              </div>
            );
          })
        )}
      </div>

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
