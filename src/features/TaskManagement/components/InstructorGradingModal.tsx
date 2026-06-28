import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { ClipboardCheck, Loader2, CheckCircle2, MessageSquare, Star, LayoutTemplate } from 'lucide-react';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { Form } from '@/features/FormBuilder/types/form.types';

interface InstructorGradingModalProps {
  open: boolean;
  onClose: () => void;
  submission: TaskSubmission | null;
  task?: Task | null;
  form?: Form | null;
  onFinalize: (submissionId: string, finalGrade: number, feedback: string) => Promise<void>;
}

export function InstructorGradingModal({ open, onClose, submission, task, form, onFinalize }: InstructorGradingModalProps) {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (submission) {
      setGrade(submission.final_grade !== undefined ? String(submission.final_grade) : '');
      setFeedback(submission.instructor_feedback || '');
    }
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;

    const parsedGrade = parseInt(grade, 10);
    if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onFinalize(submission.id || submission._id as string, parsedGrade, feedback);
      onClose();
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const student = submission?.submitter_id as any;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size={task?.task_type === 'QUIZ' ? 'xl' : 'md'}
      className="bg-app border-panel"
    >
      <Modal.Header 
        onClose={onClose}
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-content tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              </div>
              Finalize Evaluation
            </h2>
            <p className="text-content-muted text-[10px] font-bold uppercase tracking-widest mt-1">
              {student ? `${student.firstName} ${student.lastName}` : 'Student'}
            </p>
          </div>
        }
      />

      <Modal.Body className="p-8">
        <div className={task?.task_type === 'QUIZ' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : ""}>
          
          {/* Submission Info for Quiz */}
          {task?.task_type === 'QUIZ' && submission?.form_answers && (
            <div className="flex flex-col gap-4 border-b md:border-b-0 md:border-r border-panel pb-6 md:pb-0 md:pr-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <LayoutTemplate className="h-4 w-4 text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-content uppercase tracking-widest">Quiz Responses</h3>
              </div>
              <div className="space-y-4">
                {submission.form_answers.map((ans, i) => {
                  const qLabel = form?.questions.find((q) => (q.id || q._id) === ans.question_id)?.label || `Question ${i + 1}`;
                  return (
                    <div key={i} className="p-4 rounded-xl bg-app border border-panel">
                      <p className="text-xs font-bold text-content-muted mb-2">{qLabel}</p>
                      <p className="text-sm text-content">
                        {Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grading Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1 flex items-center gap-2">
                Final Grade (0-100)
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">MANDATORY</span>
              </Label>
              <div className="relative">
                <Star className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 95"
                  className="bg-app border-panel-hover text-content h-12 ps-11 rounded-xl focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Instructor Feedback</Label>
              <div className="relative h-full">
                <MessageSquare className="absolute start-4 top-4 h-4 w-4 text-content-muted" />
                <Textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback to the student..."
                  className="bg-app border-panel-hover text-content h-full min-h-[120px] rounded-2xl focus:ring-emerald-500 ps-11 pt-4"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-panel flex justify-end gap-3 mt-auto">
              <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 rounded-xl text-content-muted">
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !grade}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-panel-hover text-content font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Finalize Grade
              </Button>
            </div>
          </form>
        </div>
      </Modal.Body>
    </Modal>
  );
}
