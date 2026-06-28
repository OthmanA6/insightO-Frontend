import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, User, CheckCircle2, AlertCircle,
  Loader2, Star, MessageSquare, Paperclip, ChevronLeft,
  LayoutTemplate, Download, FileCheck, Check, BrainCircuit,
  Layers, Target
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
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
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);

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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-4 text-indigo-500">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-content-muted">Loading Submission Data...</p>
        </div>
      </div>
    );
  }

  if (!task || !submission) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-app">
        <div className="max-w-md w-full p-8 rounded-3xl bg-panel/50 backdrop-blur-md border border-panel shadow-2xl text-center flex flex-col items-center gap-4">
          <AlertCircle className="h-16 w-16 text-content-muted" />
          <h2 className="text-2xl font-black text-content">Submission Unavailable</h2>
          <p className="text-content-muted text-sm font-medium">Could not load the requested submission details.</p>
          <Button onClick={() => navigate(submissionsListUrl)} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-12 px-8 font-bold transition-colors">
            Return to Submissions List
          </Button>
        </div>
      </div>
    );
  }

  const student = typeof submission.submitter_id === 'object' ? submission.submitter_id : null;
  const aiEvaluation = submission.ai_evaluation;

  const weaknessesArr = aiEvaluation
    ? Array.isArray((aiEvaluation as any).weaknesses)
      ? (aiEvaluation as any).weaknesses
      : typeof (aiEvaluation as any).weaknesses === 'string'
        ? [(aiEvaluation as any).weaknesses]
        : []
    : [];

  const recommendationsArr = aiEvaluation
    ? Array.isArray((aiEvaluation as any).recommendations)
      ? (aiEvaluation as any).recommendations
      : typeof (aiEvaluation as any).recommendations === 'string'
        ? [(aiEvaluation as any).recommendations]
        : []
    : [];

  const rubricColors = [
    {
      stroke: 'text-indigo-500',
      glow: 'bg-indigo-500/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.02)]',
      border: 'border-panel-hover hover:border-indigo-500/30'
    },
    {
      stroke: 'text-purple-500',
      glow: 'bg-purple-500/5 shadow-[inset_0_0_20px_rgba(168,85,247,0.02)]',
      border: 'border-panel-hover hover:border-purple-500/30'
    },
    {
      stroke: 'text-pink-500',
      glow: 'bg-pink-500/5 shadow-[inset_0_0_20px_rgba(236,72,153,0.02)]',
      border: 'border-panel-hover hover:border-pink-500/30'
    }
  ];

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto text-content">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-panel pb-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate(submissionsListUrl)}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-wider mb-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Submissions
          </button>
          <h2 className="text-3xl font-black text-content flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-emerald-400" />
            Evaluate Submission
          </h2>
          <p className="text-content-muted text-sm font-medium">
            Review responses and finalise grade for {student ? `${student.firstName} ${student.lastName}` : 'Student'}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grading Panel (Pinned on desktops) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:pr-2">
          <div className="p-5 sm:p-6 rounded-3xl bg-panel/80 backdrop-blur-md border border-panel-hover shadow-xl space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-panel">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Star className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-md font-black text-content">Evaluation Hub</h3>
                <p className="text-[8px] text-content-muted font-bold uppercase tracking-wider">Configure Grade & Feedback</p>
              </div>
            </div>

            {/* Submitter Bio row (tight layout) */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-app/60 border border-panel">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-panel shrink-0">
                <User className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-md font-black text-content truncate">
                  {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                </h4>
                <p className="text-[10px] text-content-muted font-mono truncate">{student?.email || '—'}</p>
              </div>
            </div>

            {/* AI Co-Pilot Row */}
            {aiEvaluation && submission.status !== 'FINALIZED' && (
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-indigo-300">AI Suggest: {aiEvaluation.suggested_grade ?? '—'}/100</span>
                    <span className="text-[10px] text-content-muted font-mono">
                      Conf: {
                        (aiEvaluation as any).confidence_score !== undefined
                          ? `${Math.round((aiEvaluation as any).confidence_score <= 1 ? (aiEvaluation as any).confidence_score * 100 : (aiEvaluation as any).confidence_score)}%`
                          : '—'
                      }
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (aiEvaluation.suggested_grade !== undefined) {
                      setGrade(String(aiEvaluation.suggested_grade));
                      toast.success(`Applied AI suggested grade: ${aiEvaluation.suggested_grade}`);
                    }
                  }}
                  className="h-7 px-2.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors border-none"
                >
                  Apply
                </Button>
              </div>
            )}

            {submission.status === 'FINALIZED' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Evaluation Finalized</h4>
                  <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest mt-0.5">This submission has been graded.</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-content-muted ms-0.5 flex items-center gap-1.5">
                  Final Grade (0-100)
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-black">Required</span>
                </Label>
                <div className="relative">
                  <Star className="absolute start-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted" />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. 90"
                    className="bg-app border-panel-hover text-content h-10 ps-10 rounded-lg focus:ring-emerald-500 text-xs disabled:opacity-70"
                    required
                    disabled={submission.status === 'FINALIZED'}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-content-muted ms-0.5">Instructor Feedback</Label>
                <div className="relative">
                  <MessageSquare className="absolute start-3.5 top-3.5 h-3.5 w-3.5 text-content-muted" />
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide detailed feedback to the student..."
                    className="w-full bg-app/80 border border-panel-hover rounded-xl text-content ps-10 pe-3.5 pt-3 pb-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[100px] resize-y text-xs custom-scrollbar disabled:opacity-70"
                    disabled={submission.status === 'FINALIZED'}
                  />
                </div>
              </div>

              {submission.status !== 'FINALIZED' && (
                <Button
                  type="submit"
                  disabled={isSubmitting || !grade}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-panel-hover text-content font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Finalize Evaluation
                </Button>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Submission Content */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="submission" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-panel/60 border border-panel-hover rounded-2xl p-1.5 backdrop-blur-md">
              <TabsTrigger
                value="submission"
                className="flex items-center justify-center gap-2.5 h-full rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-content-muted font-bold transition-all border border-transparent data-[state=active]:border-panel"
              >
                <LayoutTemplate className="h-4.5 w-4.5" />
                <span>Student Submission</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai-report"
                className="flex items-center justify-center gap-2.5 h-full rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-content-muted font-bold transition-all border border-transparent data-[state=active]:border-panel"
              >
                <BrainCircuit className="h-4.5 w-4.5" />
                <span>Detailed AI Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submission" className="space-y-6 outline-none">
              {/* Linked Quiz Questions or Standard Submission */}
              {task.task_type === 'QUIZ' && form ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-panel/60 border border-panel-hover shadow-lg flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <LayoutTemplate className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-content">Quiz Question Responses</h3>
                      <p className="text-[10px] text-content-muted font-bold uppercase tracking-wider">Responses maps with Form setup</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {form.questions.map((q, idx) => {
                      const qId = q._id || q.id!;
                      const ans = submission.form_answers?.find(a => {
                        const targetQuestionId = a.question_id?._id || a.question_id?.id || a.question_id;
                        return String(targetQuestionId) === String(q._id || q.id);
                      });
                      const val = ans ? ans.value : undefined;

                      return (
                        <div key={qId} className="p-6 sm:p-8 rounded-3xl bg-panel border border-panel-hover shadow-md space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <Label className="text-base font-bold text-content flex gap-2 items-start">
                              <span className="text-indigo-400 font-black shrink-0">{idx + 1}.</span>
                              <span>{q.label}</span>
                              {q.required && <span className="text-red-500 font-bold shrink-0">*</span>}
                            </Label>
                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-content-muted border-panel bg-app font-mono">
                              {q.type.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Display response based on type */}
                          <div className="mt-2 pt-2 border-t border-panel">
                            {val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0) ? (
                              <p className="text-sm italic text-content-muted">No response provided.</p>
                            ) : (
                              <>
                                {/* Text inputs */}
                                {(q.type === "short_text" || q.type === "long_text") && (
                                  <div className="p-4 rounded-xl bg-app border border-panel">
                                    <p className="text-sm text-content leading-relaxed whitespace-pre-wrap">{String(val)}</p>
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
                                              : "bg-app/40 border-panel text-content-muted"
                                          )}
                                        >
                                          <div className={cn(
                                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                            isSelected ? "border-emerald-400 bg-emerald-500/20" : "border-panel-hover"
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
                                              : "bg-app/40 border-panel text-content-muted"
                                          )}
                                        >
                                          <div className={cn(
                                            "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                            isSelected ? "border-emerald-400 bg-emerald-500/20" : "border-panel-hover"
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
                                  <div className="bg-app rounded-xl p-4 border border-panel">
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
                                                    : "border-panel-hover bg-panel text-content-muted"
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
                                  <div className="flex items-center justify-between p-4 rounded-xl bg-app border border-panel">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-indigo-400" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-content truncate">{val.fileName || "Uploaded File"}</p>
                                        {val.size && <p className="text-xs text-content-muted">{(val.size / 1024).toFixed(1)} KB</p>}
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
                  <div className="p-6 rounded-3xl bg-panel border border-panel-hover space-y-4">
                    <h3 className="text-lg font-black text-content">Student Submission Text</h3>
                    <div className="p-5 rounded-2xl bg-app border border-panel">
                      <p className="text-sm text-content-muted leading-relaxed whitespace-pre-wrap">
                        {submission.content || 'No text content provided.'}
                      </p>
                    </div>
                  </div>

                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="p-6 rounded-3xl bg-panel border border-panel-hover space-y-4">
                      <h3 className="text-lg font-black text-content">Attached Files</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submission.attachments.map((att, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-app border border-panel">
                            <div className="flex items-center gap-3 min-w-0">
                              <Paperclip className="h-5 w-5 text-indigo-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-content truncate">{att.fileName || 'Attachment'}</p>
                                {att.size && <p className="text-xs text-content-muted">{(att.size / 1024).toFixed(1)} KB</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedFile({ url: att.url, name: att.fileName || 'Attachment' });
                                }}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0 cursor-pointer"
                                title="Smart View"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              <a
                                href={new URL(att.url, import.meta.env.VITE_API_URL || 'http://localhost:5000').href}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all shrink-0"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-report" className="space-y-6 outline-none">
              {!aiEvaluation ? (
                <div className="p-12 rounded-3xl bg-panel/40 backdrop-blur-md border border-panel shadow-2xl text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-full bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 animate-pulse">
                    <BrainCircuit className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-black text-content">AI Evaluation Pending or Unavailable.</h3>
                  <p className="text-content-muted text-sm max-w-md mx-auto leading-relaxed">
                    The cognitive analysis engine is either currently processing this submission in the background, or no text was provided to evaluate. Please refresh the page in a few moments.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Detailed AI Report Header */}
                  <div className="p-6 rounded-3xl bg-panel/60 border border-panel-hover shadow-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <BrainCircuit className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-content">Detailed AI Analytics</h3>
                        <p className="text-[10px] text-content-muted font-bold uppercase tracking-wider">Automated grading analysis & cognitive feedback</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Analytics Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gauge/Grade Card */}
                    <div className="p-6 rounded-3xl bg-panel border border-panel-hover shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute -end-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                      <span className="text-[10px] text-content-muted font-bold uppercase tracking-widest mb-4">Suggested Grade</span>
                      <div className="relative flex items-center justify-center h-28 w-28">
                        {/* Circular track */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-content/5"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-indigo-500"
                            strokeDasharray={`${aiEvaluation.suggested_grade || 0}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-content">{aiEvaluation.suggested_grade ?? '—'}</span>
                          <span className="text-[9px] text-content-muted font-bold uppercase">out of 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence & Accuracy Card */}
                    <div className="p-6 rounded-3xl bg-panel border border-panel-hover shadow-md flex flex-col justify-between relative overflow-hidden md:col-span-2">
                      <div className="absolute -end-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div>
                        <span className="block text-[10px] text-content-muted font-bold uppercase tracking-widest mb-1">Confidence Score</span>
                        <h4 className="text-2xl font-black text-content">
                          {(aiEvaluation as any).confidence_score !== undefined
                            ? `${Math.round((aiEvaluation as any).confidence_score <= 1 ? (aiEvaluation as any).confidence_score * 100 : (aiEvaluation as any).confidence_score)}%`
                            : '—'}
                        </h4>
                        <p className="text-xs text-content-muted mt-2 leading-relaxed">
                          This score indicates the model's self-assessed accuracy level based on semantic matching and evaluation rubric alignment.
                        </p>
                      </div>

                      {/* Custom styled progress bar */}
                      <div className="mt-6 space-y-2">
                        <div className="h-2 w-full bg-panel-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                            style={{
                              width: `${(aiEvaluation as any).confidence_score !== undefined
                                ? ((aiEvaluation as any).confidence_score <= 1 ? (aiEvaluation as any).confidence_score * 100 : (aiEvaluation as any).confidence_score)
                                : 0
                                }%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-content-muted font-bold uppercase tracking-widest">
                          <span>Low confidence</span>
                          <span>High precision</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deep Qualitative Evaluation Text */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-panel border border-panel-hover shadow-md space-y-4">
                    <div className="flex items-center gap-2 border-b border-panel pb-4">
                      <Star className="h-4.5 w-4.5 text-indigo-400" />
                      <h4 className="text-sm font-black text-content uppercase tracking-wider">Qualitative Feedback Analysis</h4>
                    </div>
                    <div className="p-5 rounded-2xl bg-app border border-panel leading-relaxed text-sm text-content-muted whitespace-pre-wrap font-medium">
                      {aiEvaluation.feedback || 'No qualitative feedback provided.'}
                    </div>
                  </div>

                  {/* Weaknesses & Recommendations Grid */}
                  {(weaknessesArr.length > 0 || recommendationsArr.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Weaknesses Card */}
                      {weaknessesArr.length > 0 && (
                        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c131a] to-[#12131a] border border-rose-500/10 hover:border-rose-500/20 shadow-2xl relative overflow-hidden transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                          {/* Corner glow */}
                          <div className="absolute -end-12 -top-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all duration-500 pointer-events-none" />

                          <div className="flex items-center gap-3 border-b border-panel pb-4 relative z-10">
                            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                              <AlertCircle className="h-5 w-5 animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-content uppercase tracking-wider">Identified Weaknesses</h4>
                              <p className="text-[9px] text-rose-400/80 font-mono uppercase tracking-widest mt-0.5">Areas for Improvement</p>
                            </div>
                          </div>
                          <div className="space-y-3.5 relative z-10 pt-2">
                            {weaknessesArr.map((weakness: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-4 p-3.5 rounded-2xl bg-app/40 border border-panel hover:border-rose-500/10 transition-all duration-300 group/item">
                                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono font-bold text-rose-400 shrink-0">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <p className="text-xs text-content-muted leading-relaxed font-medium group-hover/item:text-content transition-colors">
                                  {weakness}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations Card */}
                      {recommendationsArr.length > 0 && (
                        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121c18] to-[#12131a] border border-emerald-500/10 hover:border-emerald-500/20 shadow-2xl relative overflow-hidden transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                          {/* Corner glow */}
                          <div className="absolute -end-12 -top-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />

                          <div className="flex items-center gap-3 border-b border-panel pb-4 relative z-10">
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              <CheckCircle2 className="h-5 w-5 animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-content uppercase tracking-wider">Actionable Recommendations</h4>
                              <p className="text-[9px] text-emerald-400/80 font-mono uppercase tracking-widest mt-0.5">Optimization Directives</p>
                            </div>
                          </div>
                          <div className="space-y-3.5 relative z-10 pt-2">
                            {recommendationsArr.map((rec: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-4 p-3.5 rounded-2xl bg-app/40 border border-panel hover:border-emerald-500/10 transition-all duration-300 group/item">
                                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <p className="text-xs text-content-muted leading-relaxed font-medium group-hover/item:text-content transition-colors">
                                  {rec}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rubric Criteria Breakdown */}
                  {(aiEvaluation as any).criteria_breakdown && (aiEvaluation as any).criteria_breakdown.length > 0 && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-panel border border-panel-hover shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2.5 border-b border-panel pb-4">
                        <Layers className="h-5 w-5 text-indigo-400" />
                        <div>
                          <h4 className="text-sm font-black text-content uppercase tracking-wider">Rubric Criteria Breakdown</h4>
                          <p className="text-[9px] text-content-muted font-bold uppercase tracking-widest mt-0.5">Weighted Assessment Dimensions</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {(aiEvaluation as any).criteria_breakdown.map((item: any, idx: number) => {
                          const percentage = Math.min(100, Math.max(0, Math.round((item.score / (item.max || 1)) * 100)));
                          const color = rubricColors[idx % rubricColors.length];
                          return (
                            <div key={idx} className={cn(
                              "p-6 rounded-3xl bg-panel border shadow-md flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[260px]",
                              color.border
                            )}>
                              {/* Glow Background effect */}
                              <div className={cn("absolute inset-0 pointer-events-none", color.glow)} />

                              {/* Card Header: Title */}
                              <div className="mb-4 relative z-10 w-full">
                                <span className="block text-xs text-content font-black uppercase tracking-wider leading-tight min-h-[32px] flex items-center justify-center">{item.criterion}</span>
                              </div>

                              {/* Donut Gauge */}
                              <div className="relative flex items-center justify-center h-24 w-24 my-2 z-10 shrink-0">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  {/* Background track */}
                                  <circle
                                    className="text-content/5"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    cx="18"
                                    cy="18"
                                    r="15.9155"
                                  />
                                  {/* Active filled path */}
                                  <circle
                                    className={cn(color.stroke, "transition-all duration-1000 ease-out")}
                                    strokeDasharray={`${percentage}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    cx="18"
                                    cy="18"
                                    r="15.9155"
                                  />
                                </svg>
                                <div className="flex flex-col items-center">
                                  <span className="text-xl font-black text-content">{percentage}%</span>
                                  <span className="text-[9px] text-content-muted font-bold uppercase font-mono mt-0.5">{item.score} / {item.max}</span>
                                </div>
                              </div>

                              {/* Comments/Feedback */}
                              {item.comments && (
                                <div className="mt-4 pt-3 border-t border-panel w-full relative z-10">
                                  <p className="text-[11px] italic text-content-muted leading-relaxed px-1">
                                    "{item.comments}"
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Academic Concept Mastery Mapping */}
                  {(aiEvaluation as any).concept_mastery && (aiEvaluation as any).concept_mastery.length > 0 && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-panel border border-panel-hover shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2.5 border-b border-panel pb-4">
                        <Target className="h-5 w-5 text-indigo-400" />
                        <div>
                          <h4 className="text-sm font-black text-content uppercase tracking-wider">Academic Concept Mastery Mapping</h4>
                          <p className="text-[9px] text-content-muted font-bold uppercase tracking-widest mt-0.5">Core Syllabus Competencies</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {(aiEvaluation as any).concept_mastery.map((item: any, idx: number) => {
                          const masteryPercentage = Math.min(100, Math.max(0, Math.round(item.mastery_level * 100)));

                          // Dynamic progress bar colors
                          let barColor = 'bg-rose-500';
                          if (item.mastery_level >= 0.90) barColor = 'bg-emerald-500';
                          else if (item.mastery_level >= 0.70) barColor = 'bg-amber-500';

                          // Dynamic status badge mapping
                          let badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                          if (item.status === 'EXCELLENT') badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          else if (item.status === 'GOOD') badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                          return (
                            <div key={idx} className="p-4 rounded-2xl bg-app/60 border border-panel space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-content">{item.concept}</span>
                                <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-mono ${badgeStyle}`}>
                                  {item.status}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="h-1.5 w-full bg-panel-hover rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                    style={{ width: `${masteryPercentage}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] font-mono text-content-muted font-bold">
                                  <span>Mastery Level</span>
                                  <span>{masteryPercentage}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

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
      </div>
    </div>
  );
}
