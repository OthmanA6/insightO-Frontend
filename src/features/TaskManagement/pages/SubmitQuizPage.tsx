import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as taskApi from "@/features/TaskManagement/api/taskApi";
import * as formApi from "@/features/FormBuilder/api/formApi";
import { submitTask } from "@/shared/api/taskSubmissionApi";
import api from "@/shared/api/axiosInstance";
import type { Task } from "@/features/TaskManagement/api/taskApi";
import type { Form } from "@/features/FormBuilder/types/form.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowRight, AlertCircle, FileText, Upload, Trash2, Check, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { format } from "date-fns";

export default function SubmitQuizPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadQuizDetails = async () => {
      try {
        if (!taskId) return;
        const taskData = await taskApi.getTaskById(taskId);
        setTask(taskData);

        if (taskData.task_type !== "QUIZ") {
          toast.error("This is not a quiz-based task.");
          navigate("/dashboard");
          return;
        }

        if (taskData.status !== "ACTIVE") {
          toast.error("This task is not active or has been closed.");
          navigate("/dashboard");
          return;
        }

        if (new Date() > new Date(taskData.deadline)) {
          toast.error("Submission deadline for this task has passed.");
          navigate("/dashboard");
          return;
        }

        if (taskData.form_id) {
          const formData = await formApi.getForm(taskData.form_id);
          setForm(formData);
        } else {
          toast.error("No questions form is linked to this quiz.");
        }
      } catch (err) {
        toast.error("Failed to load quiz details.");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    loadQuizDetails();
  }, [taskId, navigate]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0)) {
      setValidationErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    setIsUploading(prev => ({ ...prev, [questionId]: true }));
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data.data;
      handleAnswerChange(questionId, { url: data.url, fileName: file.name, size: data.size });
      toast.success("File uploaded successfully", { id: toastId });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Failed to upload file";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsUploading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!task || !form || !taskId) return;

    // Validate required fields
    const errors: Record<string, boolean> = {};
    form.questions.forEach(q => {
      const qId = q._id || q.id!;
      const val = answers[qId];
      if (q.required) {
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          errors[qId] = true;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please complete all required questions.");

      const firstErrorId = Object.keys(errors)[0];
      const element = document.getElementById(`question-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadAnswers = form.questions.map(q => {
        const qId = q._id || q.id!;
        return {
          question_id: qId,
          value: answers[qId] !== undefined ? answers[qId] : ""
        };
      });

      await submitTask(taskId, {
        form_answers: payloadAnswers
      });

      setIsSuccess(true);
      toast.success("Quiz submitted successfully!");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to submit quiz.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4 text-indigo-500">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Quiz Module...</p>
        </div>
      </div>
    );
  }

  if (!task || !form) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#1e1b2e]/50 backdrop-blur-md border border-white/5 shadow-2xl text-center flex flex-col items-center gap-4">
          <AlertCircle className="h-16 w-16 text-slate-500" />
          <h2 className="text-2xl font-black text-white">Quiz Unavailable</h2>
          <p className="text-slate-400 text-sm font-medium">This quiz is not available, has no questions, or you might not have access to it.</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-12 px-8 font-bold transition-colors">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="max-w-md w-full p-10 rounded-3xl bg-[#1e1b2e] border border-white/5 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Quiz Submitted!</h2>
            <p className="text-slate-400 text-sm font-medium">Your answers have been securely submitted and stored.</p>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="w-full mt-4 h-12 rounded-xl border-white/10 hover:bg-white/5 text-slate-300 font-bold transition-all">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0f] text-slate-100 py-12 px-4 sm:px-6 relative overflow-y-auto">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Header Block */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#1e1b2e]/60 backdrop-blur-md border-t-4 border-t-indigo-500 border-x border-b border-white/5 shadow-2xl space-y-6">
          <div>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 font-bold text-[10px] uppercase tracking-widest mb-4">
              Quiz Form Task
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">{task.title}</h1>
            {task.description && (
              <p className="text-slate-400 font-medium mt-4 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
              <Clock className="h-4 w-4" />
              <span>Due: {format(new Date(task.deadline), "MMM d, yyyy h:mm a")}</span>
            </div>
            {form.is_anonymous && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Anonymous
              </span>
            )}
          </div>
        </div>

        {/* Questions Canvas */}
        <div className="space-y-6">
          {form.questions.map((q, idx) => {
            const qId = q._id || q.id!;
            const hasError = validationErrors[qId];
            const val = answers[qId];

            return (
              <div
                key={qId}
                id={`question-${qId}`}
                className={cn(
                  "p-8 sm:p-10 rounded-3xl bg-[#1e1b2e]/40 backdrop-blur-md border transition-all duration-300",
                  hasError ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/5 shadow-xl hover:border-white/10"
                )}
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-bold text-white flex gap-2 items-start">
                      <span className="text-indigo-400 shrink-0">{idx + 1}.</span>
                      <span>{q.label}</span>
                      {q.required && <span className="text-red-500 shrink-0">*</span>}
                    </Label>
                  </div>

                  {q.type === "short_text" && (
                    <Input
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(qId, e.target.value)}
                      placeholder="Your answer..."
                      className="bg-[#0f111a]/80 border-white/10 h-14 rounded-xl text-white px-4 focus:ring-indigo-500 transition-all text-base shadow-inner"
                    />
                  )}

                  {q.type === "long_text" && (
                    <textarea
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(qId, e.target.value)}
                      placeholder="Your detailed answer..."
                      className="w-full bg-[#0f111a]/80 border border-white/10 rounded-xl text-white p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px] resize-y text-base custom-scrollbar shadow-inner"
                    />
                  )}

                  {q.type === "multiple_choice" && q.options && (
                    <div className="space-y-3">
                      {q.options.map((opt, i) => {
                        const isSelected = val === opt;
                        return (
                          <label
                            key={i}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                              isSelected ? "bg-indigo-600/10 border-indigo-500 text-indigo-100" : "bg-[#0f111a]/50 border-white/5 hover:border-white/10 text-slate-300"
                            )}
                          >
                            <input
                              type="radio"
                              name={`q-${qId}`}
                              value={opt}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(qId, opt)}
                              className="sr-only"
                            />
                            <div className={cn(
                              "h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
                              isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-400 dark:border-white/20"
                            )}>
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="font-medium text-base">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "checkbox" && q.options && (
                    <div className="space-y-3">
                      {q.options.map((opt, i) => {
                        const selectedOpts = (val as string[]) || [];
                        const isSelected = selectedOpts.includes(opt);
                        return (
                          <label
                            key={i}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                              isSelected ? "bg-indigo-600/10 border-indigo-500 text-indigo-100" : "bg-[#0f111a]/50 border-white/5 hover:border-white/10 text-slate-300"
                            )}
                          >
                            <input
                              type="checkbox"
                              name={`q-${qId}`}
                              value={opt}
                              checked={isSelected}
                              onChange={(e) => {
                                const current = (val as string[]) || [];
                                const next = e.target.checked
                                  ? [...current, opt]
                                  : current.filter(o => o !== opt);
                                handleAnswerChange(qId, next);
                              }}
                              className="sr-only"
                            />
                            <div className={cn(
                              "h-4 w-4 rounded-sm border-2 transition-all flex items-center justify-center shrink-0",
                              isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-400 dark:border-white/20"
                            )}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="font-medium text-base">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "linear_scale" && (
                    <div className="bg-[#0f111a]/60 rounded-xl p-6 border border-white/5 space-y-4">
                      {(() => {
                        const scale = q.scale || { min: 1, max: 5 };
                        const min = Number(scale.min) || 1;
                        const max = Number(scale.max) || 5;
                        return (
                          <>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                              <span>{min} (Poor)</span>
                              <span>{max} (Excellent)</span>
                            </div>
                            <div className="flex justify-between gap-2 overflow-x-auto pb-2">
                              {Array.from({ length: max - min + 1 }).map((_, i) => {
                                const num = min + i;
                                const isSelected = Number(val) === num;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleAnswerChange(qId, num)}
                                    className={cn(
                                      "h-11 flex-1 min-w-[40px] rounded-lg border flex items-center justify-center text-sm font-medium transition-all",
                                      isSelected
                                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 font-bold shadow-[0_0_15px_rgba(79,70,229,0.15)]"
                                        : "border-white/10 bg-[#1e1b2e]/60 text-slate-400 hover:border-white/20 hover:text-slate-200"
                                    )}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {q.type === "file" && (
                    <div className="space-y-4">
                      <label className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-2xl cursor-pointer bg-[#0f111a]/60 hover:bg-white/5 hover:border-indigo-500/50 transition-all group",
                        isUploading[qId] && "pointer-events-none opacity-55"
                      )}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading[qId] ? (
                            <Loader2 className="w-8 h-8 text-indigo-500 mb-3 animate-spin" />
                          ) : (
                            <Upload className="w-8 h-8 text-slate-500 mb-3 group-hover:text-indigo-400 transition-colors" />
                          )}
                          <p className="text-sm font-bold text-slate-300">
                            {isUploading[qId] ? "Uploading your file..." : "Click to upload file"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                            {q.file_config?.allowed_types?.join(", ") || "Any file"} (Max {Math.round((q.file_config?.max_size || 5242880) / 1024 / 1024)}MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          disabled={isUploading[qId]}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleFileUpload(qId, file);
                            }
                          }}
                          accept={q.file_config?.allowed_types?.join(",")}
                        />
                      </label>
                      {val && val.fileName && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-indigo-400" />
                            <span className="text-sm font-bold text-slate-200">{val.fileName}</span>
                            {val.size && <span className="text-xs text-slate-500 font-mono">({(val.size / 1024).toFixed(1)} KB)</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(qId, undefined)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {hasError && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest mt-4">
                      <AlertCircle className="h-4 w-4" /> This field is required
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Actions */}
        <div className="pt-6 pb-20 flex gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-16 px-8 rounded-2xl border-white/10 hover:bg-white/5 text-slate-300 font-bold transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>Submit Quiz Answers <ArrowRight className="h-5 w-5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
