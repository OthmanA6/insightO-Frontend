import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { ClipboardCheck, Loader2, CheckCircle2, MessageSquare, Star } from 'lucide-react';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';

interface InstructorGradingModalProps {
  open: boolean;
  onClose: () => void;
  submission: TaskSubmission | null;
  onFinalize: (submissionId: string, finalGrade: number, feedback: string) => Promise<void>;
}

export function InstructorGradingModal({ open, onClose, submission, onFinalize }: InstructorGradingModalProps) {
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

  const student = submission?.student_id as any;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="md"
      className="max-w-lg bg-[#0a0a0f] border-white/5"
    >
      <Modal.Header 
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              </div>
              Finalize Evaluation
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {student ? `${student.firstName} ${student.lastName}` : 'Student'}
            </p>
          </div>
        }
      />

      <Modal.Body className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
              Final Grade (0-100)
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">MANDATORY</span>
            </Label>
            <div className="relative">
              <Star className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 95"
                className="bg-[#0f111a] border-white/10 text-white h-12 pl-11 rounded-xl focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Instructor Feedback</Label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
              <Textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback to the student..."
                className="bg-[#0f111a] border-white/10 text-white min-h-[120px] rounded-2xl focus:ring-emerald-500 pl-11 pt-4"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 rounded-xl text-slate-400">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !grade}
              className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Finalize Grade
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
