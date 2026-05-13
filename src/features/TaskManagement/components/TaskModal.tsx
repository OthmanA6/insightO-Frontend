import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ClipboardList, Target, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [deptId, setDeptId] = useState('');
  const [rubric, setRubric] = useState('');

  // Determine if department is locked by context
  const isDeptLocked = !!contextDepartmentId;

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getAllDepartments();
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments');
      }
    };
    if (open && !isDeptLocked) fetchDepts();
  }, [open, isDeptLocked]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
      setDeptId(task.target.department_id || contextDepartmentId || '');
      setRubric(task.ai_grading_rubric || '');
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setDeptId(contextDepartmentId || '');
      setRubric('');
    }
  }, [task, open, contextDepartmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDeptId = contextDepartmentId || deptId;
    if (!title || !description || !deadline || !effectiveDeptId) {
      toast.error('All required fields must be filled');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        target: {
          department_id: effectiveDeptId,
          course_id: contextCourseId,
        },
        ai_grading_rubric: rubric
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
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
                <ClipboardList className="h-5 w-5 text-indigo-400" />
              </div>
              {task ? 'Edit Task Architecture' : 'Provision New Task'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Assignment & Academic Delivery
            </p>
          </div>
        } 
        onClose={onClose} 
      />

      <Modal.Body className="p-8 space-y-8 custom-scrollbar">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Target Department</Label>
                {isDeptLocked ? (
                  <div className="flex items-center gap-3 h-12 px-4 rounded-xl bg-[#0f111a] border border-white/10">
                    <Target className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-300">
                      {departments.find(d => d.id === contextDepartmentId)?.name || 'Inherited from context'}
                    </span>
                  </div>
                ) : (
                  <Select value={deptId} onValueChange={setDeptId}>
                    <SelectTrigger className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-indigo-500" />
                        <SelectValue placeholder="Select Department" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1b2e] border-white/10 text-slate-200">
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Submission Deadline</Label>
                <Input 
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">AI Grading Rubric (Optional)</Label>
              <Textarea 
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Specify evaluation criteria for AI-assisted grading..."
                className="bg-[#0f111a] border-white/10 text-white min-h-[80px] rounded-2xl focus:ring-indigo-500 p-4"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 rounded-xl text-slate-400">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {task ? 'Update Task' : 'Publish Task'}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
