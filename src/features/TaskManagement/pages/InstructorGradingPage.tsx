import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, User, CheckCircle2, AlertCircle,
  Loader2, Star, MessageSquare, Paperclip, ChevronLeft,
  LayoutTemplate, Download, FileCheck, Check
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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

export default function InstructorGradingPage() {
  const { departmentId, courseId, taskId, submissionId } = useParams<{
    departmentId?: string;
    courseId: string;
    taskId: string;
    submissionId: string;
  }>();

  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grading form state
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Breadcrumb names
  const [departmentName, setDepartmentName] = useState('');
  const [courseName, setCourseName] = useState('');

  // Determine back URL
  const submissionsListUrl = departmentId 
    ? `/dashboard/departments/${departmentId}/courses/${courseId}/tasks/${taskId}`
    : `/dashboard/courses/${courseId}/tasks/${taskId}`;

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
        // Fallback for breadcrumbs
      }
    };
    fetchContext();
  }, [departmentId, courseId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!taskId || !submissionId) return;
      setIsLoading(true);
      try {
        const [taskData, allSubmissions] = await Promise.all([
          taskApi.getTaskById(taskId),
          taskSubmissionApi.getTaskSubmissions(taskId),
        ]);

        setTask(taskData);

        const currentSub = allSubmissions.find(
          (s) => (s.id || s._id) === submissionId
        );

        if (!currentSub) {
          toast.error('Submission not found.');
          navigate(submissionsListUrl);
          return;
        }

        setSubmission(currentSub);
        setGrade(currentSub.final_grade !== undefined ? String(currentSub.final_grade) : '');
        setFeedback(currentSub.instructor_feedback || '');

        if (taskData.task_type === 'QUIZ' && taskData.form_id) {
          const formData = await formApi.getForm(taskData.form_id);
          setForm(formData);
        }
      } catch (error) {
        toast.error('Failed to load submission details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [taskId, submissionId, navigate, submissionsListUrl]);

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !submissionId) return;

    const parsedGrade = parseInt(grade, 10);
    if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100) {
      toast.error('Please enter a valid grade between 0 and 100.');
      return;
    }

    setIsSubmitting(true);
    try {
      await taskSubmissionApi.finalizeGrade(submissionId, {
        final_grade: parsedGrade,
        instructor_feedback: feedback,
      });
      toast.success('Evaluation Finalized successfully!');
      navigate(submissionsListUrl);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to finalize grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4 text-indigo-500">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Submission Data...</p>
        </div>
      </div>
    );
  }

  if (!task || !submission) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#1e1b2e]/50 backdrop-blur-md border border-white/5 shadow-2xl text-center flex flex-col items-center gap-4">
          <AlertCircle className="h-16 w-16 text-slate-500" />
          <h2 className="text-2xl font-black text-white">Submission Unavailable</h2>
          <p className="text-slate-400 text-sm font-medium">Could not load the requested submission details.</p>
          <Button onClick={() => navigate(submissionsListUrl)} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-12 px-8 font-bold transition-colors">
            Return to Submissions List
          </Button>
        </div>
      </div>
    );
  }

  const student = typeof submission.submitter_id === 'object' ? submission.submitter_id : null;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto text-slate-100">
      {/* Breadcrumb */}
      <BreadcrumbNav
        homeItem={{ label: 'Command Center', href: '/dashboard' }}
        items={
          user?.role === 'INSTRUCTOR'
            ? [
                { label: 'Module Directory', href: '/dashboard/courses' },
                { label: courseName || 'Course', href: `/dashboard/courses/${courseId}` },
                { label: task.title, href: submissionsListUrl },
                { label: 'Evaluation' },
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
                { label: task.title, href: submissionsListUrl },
                { label: 'Evaluation' },
              ]
        }
      />

      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate(submissionsListUrl)}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-wider mb-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Submissions
          </button>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-emerald-400" />
            Evaluate Submission
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Review responses and finalise grade for {student ? `${student.firstName} ${student.lastName}` : 'Student'}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grading Panel (Pinned on desktops) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#13151f] border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Star className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Grading Dashboard</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure Grades & Feedback</p>
              </div>
            </div>

            {/* Submitter Bio */}
            <div className="p-4 rounded-2xl bg-[#0a0a0f] border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-white/5">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{student ? `${student.firstName} ${student.lastName}` : 'Unknown'}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">{student?.email || '—'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Submitted:</span>
                <span className="font-bold text-slate-200">
                  {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitEvaluation} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  Final Grade (0-100)
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">Required</span>
                </Label>
                <div className="relative">
                  <Star className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. 90"
                    className="bg-[#0a0a0f] border-white/10 text-white h-12 pl-11 rounded-xl focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Instructor Feedback</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-slate-500" />
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide detailed feedback to the student..."
                    className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-2xl text-white pl-11 pr-4 pt-4 pb-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[140px] resize-y text-sm custom-scrollbar"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !grade}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-black text-base shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Finalize Evaluation
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Submission Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Linked Quiz Questions or Standard Submission */}
          {task.task_type === 'QUIZ' && form ? (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#13151f]/60 border border-white/10 shadow-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <LayoutTemplate className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Quiz Question Responses</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Responses maps with Form setup</p>
                </div>
              </div>

              <div className="space-y-6">
                {form.questions.map((q, idx) => {
                  const qId = q._id || q.id!;
                  const ans = submission.form_answers?.find(a => String(a.question_id) === String(qId));
                  const val = ans ? ans.value : undefined;

                  return (
                    <div key={qId} className="p-6 sm:p-8 rounded-3xl bg-[#13151f] border border-white/10 shadow-md space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <Label className="text-base font-bold text-white flex gap-2 items-start">
                          <span className="text-indigo-400 font-black shrink-0">{idx + 1}.</span>
                          <span>{q.label}</span>
                          {q.required && <span className="text-red-500 font-bold shrink-0">*</span>}
                        </Label>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-slate-500 border-white/5 bg-[#0a0a0f] font-mono">
                          {q.type.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Display response based on type */}
                      <div className="mt-2 pt-2 border-t border-white/5">
                        {val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0) ? (
                          <p className="text-sm italic text-slate-500">No response provided.</p>
                        ) : (
                          <>
                            {/* Text inputs */}
                            {(q.type === "short_text" || q.type === "long_text") && (
                              <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/5">
                                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{String(val)}</p>
                              </div>
                            )}

                            {/* Multiple choice */}
                            {q.type === "multiple_choice" && q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt, i) => {
                                  const isSelected = val === opt;
                                  return (
                                    <div
                                      key={i}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors",
                                        isSelected 
                                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold" 
                                          : "bg-[#0a0a0f]/40 border-white/5 text-slate-400"
                                      )}
                                    >
                                      <div className={cn(
                                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                        isSelected ? "border-emerald-400 bg-emerald-500/20" : "border-white/10"
                                      )}>
                                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Checkbox */}
                            {q.type === "checkbox" && q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt, i) => {
                                  const selectedOpts = Array.isArray(val) ? val : [val];
                                  const isSelected = selectedOpts.includes(opt);
                                  return (
                                    <div
                                      key={i}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors",
                                        isSelected 
                                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold" 
                                          : "bg-[#0a0a0f]/40 border-white/5 text-slate-400"
                                      )}
                                    >
                                      <div className={cn(
                                        "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                        isSelected ? "border-emerald-400 bg-emerald-500/20" : "border-white/10"
                                      )}>
                                        {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Linear scale */}
                            {q.type === "linear_scale" && (
                              <div className="bg-[#0a0a0f] rounded-xl p-4 border border-white/5">
                                {(() => {
                                  const scale = q.scale || { min: 1, max: 5 };
                                  const min = Number(scale.min) || 1;
                                  const max = Number(scale.max) || 5;
                                  return (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {Array.from({ length: max - min + 1 }).map((_, i) => {
                                        const num = min + i;
                                        const isSelected = Number(val) === num;
                                        return (
                                          <div
                                            key={num}
                                            className={cn(
                                              "h-10 w-10 rounded-lg border flex items-center justify-center text-xs font-bold transition-all",
                                              isSelected
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                                : "border-white/10 bg-[#13151f] text-slate-500"
                                            )}
                                          >
                                            {num}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* File Upload Response */}
                            {q.type === "file" && val && val.url && (
                              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0f] border border-white/5">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-indigo-400" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-200 truncate">{val.fileName || "Uploaded File"}</p>
                                    {val.size && <p className="text-xs text-slate-500">{(val.size / 1024).toFixed(1)} KB</p>}
                                  </div>
                                </div>
                                <a
                                  href={val.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Standard Attachment Submission */
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 space-y-4">
                <h3 className="text-lg font-black text-white">Student Submission Text</h3>
                <div className="p-5 rounded-2xl bg-[#0a0a0f] border border-white/5">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {submission.content || 'No text content provided.'}
                  </p>
                </div>
              </div>

              {submission.attachments && submission.attachments.length > 0 && (
                <div className="p-6 rounded-3xl bg-[#13151f] border border-white/10 space-y-4">
                  <h3 className="text-lg font-black text-white">Attached Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {submission.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0f] border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Paperclip className="h-5 w-5 text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">{att.fileName || 'Attachment'}</p>
                            {att.size && <p className="text-xs text-slate-500">{(att.size / 1024).toFixed(1)} KB</p>}
                          </div>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all shrink-0"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
