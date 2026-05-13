import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';

export default function TaskSubmissionsPage() {
  const { departmentId, courseId, taskId } = useParams<{
    departmentId: string;
    courseId: string;
    taskId: string;
  }>();

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Breadcrumb context
  const [departmentName, setDepartmentName] = useState('');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    const fetchContext = async () => {
      try {
        if (departmentId) {
          const dept = await departmentApi.getDepartment(departmentId);
          setDepartmentName(dept.name);
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
      if (!taskId) return;
      setIsLoading(true);
      try {
        const [taskData, submissionsData] = await Promise.all([
          taskApi.getTaskById(taskId),
          taskSubmissionApi.getTaskSubmissions(taskId),
        ]);
        setTask(taskData);
        setSubmissions(submissionsData);
      } catch (error) {
        toast.error('Failed to load task submissions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [taskId]);

  const handleFinalizeGrade = async (submissionId: string) => {
    const gradeInput = window.prompt('Enter final grade (0-100):');
    if (gradeInput === null) return;
    const grade = parseInt(gradeInput, 10);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Please enter a valid grade between 0 and 100');
      return;
    }

    const feedback = window.prompt('Enter instructor feedback (optional):') || '';

    try {
      await taskSubmissionApi.finalizeGrade(submissionId, {
        final_grade: grade,
        instructor_feedback: feedback,
      });
      toast.success('Grade finalized successfully');
      // Refresh submissions
      if (taskId) {
        const updated = await taskSubmissionApi.getTaskSubmissions(taskId);
        setSubmissions(updated);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to finalize grade');
    }
  };

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
        items={[
          {
            label: departmentName || 'Department',
            href: `/dashboard/departments/${departmentId}`,
          },
          {
            label: courseName || 'Course',
            href: `/dashboard/departments/${departmentId}/courses/${courseId}`,
          },
          { label: task?.title || 'Task' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-500" />
            {task?.title || 'Task Submissions'}
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
            Student Submissions & Grading
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-xl border-white/10 hover:bg-white/5 text-slate-300 font-bold"
          >
            <Download className="mr-2 h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      {/* Task Info Card */}
      {task && (
        <div className="p-6 rounded-3xl bg-[#1e1b2e] border border-white/5 shadow-2xl">
          <p className="text-sm text-slate-400 leading-relaxed italic mb-4">
            "{task.description || 'No instructions provided.'}"
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-white/10 text-slate-400"
            >
              <Clock className="mr-1.5 h-3 w-3" />
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
                  <CheckCircle2 className="mr-1.5 h-3 w-3" /> Active
                </>
              ) : (
                <>
                  <AlertCircle className="mr-1.5 h-3 w-3" /> Closed
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
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Loading Submissions...
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 opacity-20">
            <FileText className="h-16 w-16 text-slate-500" />
            <p className="text-lg font-bold text-slate-500">
              No submissions received yet
            </p>
          </div>
        ) : (
          submissions.map((sub) => {
            const subId = sub.id || sub._id!;
            const student =
              typeof sub.student_id === 'object'
                ? sub.student_id
                : null;

            return (
              <div
                key={subId}
                className="group rounded-3xl bg-[#1e1b2e] border border-white/5 hover:border-indigo-500/20 shadow-2xl transition-all p-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  {/* Student Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-white/5 shrink-0">
                      <User className="h-7 w-7" />
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
                      <div className="mt-4 p-4 rounded-2xl bg-[#0f111a] border border-white/5">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {sub.content || 'No content provided.'}
                        </p>
                      </div>

                      {/* Attachments */}
                      {sub.attachments && sub.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {sub.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            >
                              <Paperclip className="h-3 w-3" />
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
                      {sub.ai_grade !== undefined && sub.ai_grade !== null && (
                        <div className="flex items-center gap-2">
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-slate-400">
                            AI Grade:{' '}
                            <span className="text-amber-400 font-black">
                              {sub.ai_grade}
                            </span>
                          </span>
                        </div>
                      )}
                      {sub.final_grade !== undefined && sub.final_grade !== null && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
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
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-400 italic">
                          "{sub.instructor_feedback}"
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-4 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest"
                      onClick={() => handleFinalizeGrade(subId)}
                    >
                      <Star className="mr-1.5 h-3.5 w-3.5" />
                      Finalize Grade
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
