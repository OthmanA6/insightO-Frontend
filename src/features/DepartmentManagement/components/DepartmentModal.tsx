import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Building2, Code, User as UserIcon, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import type { Department, CreateDepartmentPayload } from '../types/department.types';
import * as userAdminApi from '@/shared/api/userAdminApi';
import type { AdminUser } from '@/shared/api/userAdminApi';
import { toast } from 'sonner';

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
  onSave: (payload: CreateDepartmentPayload) => Promise<void>;
}

export function DepartmentModal({ open, onClose, department, onSave }: DepartmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [hodId, setHodId] = useState('');

  // ── User fetching state ──
  const [hodUsers, setHodUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch HOD-eligible users when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const allUsers = await userAdminApi.getAllUsers();
        const hods = allUsers.filter((u) => u.role === 'HOD');
        setHodUsers(hods);
      } catch {
        console.error('Failed to fetch users for HOD selection');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open]);

  useEffect(() => {
    if (department) {
      setName(department.name);
      setCode(department.code);
      setDescription(department.description || '');
      setHodId(department.hodId || '');
    } else {
      setName('');
      setCode('');
      setDescription('');
      setHodId('');
    }
  }, [department, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and Code are required');
      return;
    }
    if (!hodId) {
      toast.error('Head of Department must be selected');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ name, code, description, hodId });
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
      size="lg"
      className="max-w-2xl bg-[#0a0a0f] border-white/5"
    >
      <Modal.Header 
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Building2 className="h-5 w-5 text-indigo-400" />
              </div>
              {department ? 'Edit Department' : 'Configure New Entity'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Institutional Hierarchy Management
            </p>
          </div>
        } 
        onClose={onClose} 
      />

      <Modal.Body className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Department Name</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science"
                className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
                startIcon={<Building2 className="h-4 w-4 text-slate-500" />}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Academic Code</Label>
              <Input 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS-202"
                className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl font-mono focus:ring-indigo-500"
                startIcon={<Code className="h-4 w-4 text-slate-500" />}
              />
            </div>
          </div>

          {/* ── HOD Dropdown ── */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
              Head of Department (HOD)
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none z-10" />
              {isLoadingUsers ? (
                <div className="flex items-center gap-3 h-12 px-4 pl-11 rounded-xl bg-[#0f111a] border border-white/10 text-slate-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading HOD users...
                </div>
              ) : (
                <>
                  <select
                    value={hodId}
                    onChange={(e) => setHodId(e.target.value)}
                    className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#0f111a] border border-white/10 text-white text-sm font-medium appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="" className="bg-[#0f111a] text-slate-400">
                      — Select HOD —
                    </option>
                    {hodUsers.map((user) => {
                      const uid = (user as any)._id || user.id;
                      return (
                        <option key={uid} value={uid} className="bg-[#0f111a] text-white">
                          {user.firstName} {user.lastName} — {user.email}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </>
              )}
            </div>
            {hodUsers.length === 0 && !isLoadingUsers && (
              <p className="text-[10px] text-amber-500/70 font-bold ml-1">No users with HOD role found in the system</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Mission & Description</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Elaborate on the academic scope and responsibilities..."
              className="bg-[#0f111a] border-white/10 text-white min-h-[120px] rounded-2xl focus:ring-indigo-500 p-4"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
              Discard Changes
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {department ? 'Update Entity' : 'Finalize Creation'}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
