import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Calendar, FileText, Target, Users, Loader2, Rocket } from 'lucide-react';
import * as formApi from '@/features/FormBuilder/api/formApi';
import * as departmentApi from '@/shared/api/departmentApi';
import type { Form } from '@/features/FormBuilder/types/form.types';
import type { Department } from '@/shared/api/departmentApi';
import type { CreateCyclePayload } from '../api/cycleApi';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface CycleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateCyclePayload) => Promise<void>;
}

export function CycleModal({ open, onClose, onSave }: CycleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [formId, setFormId] = useState('');
  const [targetDepts, setTargetDepts] = useState<string[]>([]);
  const [evalRoles, setEvalRoles] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formData, deptData] = await Promise.all([
          formApi.getAllForms(),
          departmentApi.getAllDepartments()
        ]);
        setForms(formData);
        setDepartments(deptData);
      } catch (err) {
        console.error('Failed to fetch modal data');
      }
    };
    if (open) fetchData();
  }, [open]);

  const toggleDept = (id: string) => {
    setTargetDepts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleRole = (role: string) => {
    setEvalRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !formId || !startDate || !endDate || targetDepts.length === 0 || evalRoles.length === 0) {
      toast.error('Please complete all scheduling parameters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        formId,
        targetDepartmentIds: targetDepts,
        evaluatorRoles: evalRoles,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      onClose();
    } catch (error) {
      // Handled by parent
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
      className="max-w-4xl bg-[#0a0a0f] border-white/5"
    >
      <Modal.Header 
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Rocket className="h-5 w-5 text-indigo-400" />
              </div>
              Schedule Evaluation Campaign
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Automated Survey Distribution Engine
            </p>
          </div>
        } 
        onClose={onClose} 
      />

      <Modal.Body className="p-8 space-y-8 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Core Info */}
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Campaign Name</Label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Faculty Review"
                  className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Survey Template (Form)</Label>
                <Select value={formId} onValueChange={setFormId}>
                  <SelectTrigger className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <SelectValue placeholder="Select Template" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1b2e] border-white/10 text-slate-200">
                    {forms.map(f => (
                      <SelectItem key={f._id || f.id} value={(f._id || f.id)!}>{f.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Launch Date</Label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Closure Date</Label>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Targeting */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <Target className="h-3 w-3" /> Target Departments
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                  {departments.map(dept => {
                    const id = dept._id || dept.id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleDept(id)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border text-left truncate",
                          targetDepts.includes(id)
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                            : "bg-[#0f111a] border-white/5 text-slate-500 hover:border-white/20"
                        )}
                      >
                        {dept.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <Users className="h-3 w-3" /> Evaluator Audience
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {['STUDENT', 'INSTRUCTOR', 'HOD', 'ADMIN'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border",
                        evalRoles.includes(role)
                          ? "bg-purple-600/20 border-purple-500 text-purple-400"
                          : "bg-[#0f111a] border-white/5 text-slate-500 hover:border-white/20"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 rounded-xl text-slate-400 hover:bg-white/5">
              Discard
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              Launch Campaign
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
