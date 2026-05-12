import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { 
  User, Mail, Building2, Shield, Settings, 
  CheckCircle2, FileText, Loader2, Calendar, Lock
} from 'lucide-react';
import * as departmentApi from '@/shared/api/departmentApi';
import * as authApi from '@/features/auth/api/authApi';
import * as userAdminApi from '@/shared/api/userAdminApi';
import type { Department } from '@/shared/api/departmentApi';
import type { UserRole } from '@/features/auth/types';
import { toast } from 'sonner';

interface UserConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  pendingUser?: any; // If provided, we are in Approval Mode
}

export function UserConfigurationModal({ open, onClose, pendingUser }: UserConfigurationModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Failed to fetch departments');
      }
    };
    if (open) fetchDepts();
  }, [open]);

  // Sync initial values if pendingUser is provided
  useEffect(() => {
    if (pendingUser) {
      setSelectedRole(pendingUser.role);
      setNationalId(pendingUser.nationalId || '');
      setSelectedDept(pendingUser.departmentId || '');
    } else {
      // Clear form for "Add New User" mode
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setSelectedDept('');
      setSelectedRole('STUDENT');
      setAcademicYear('');
      setNationalId('');
    }
  }, [pendingUser, open]);

  const validateForm = () => {
    if (!pendingUser) {
      if (!firstName || !lastName || !email || !password) {
        toast.error('Basic information (Name, Email, Password) is required');
        return false;
      }
    }
    
    if (nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
      toast.error('National ID must be exactly 14 digits');
      return false;
    }

    if (!selectedDept) {
      toast.error('Department is required');
      return false;
    }

    if (selectedRole === 'STUDENT' && !academicYear) {
      toast.error('Academic Year is required for Students');
      return false;
    }

    return true;
  };

  const handleAction = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (pendingUser) {
        // --- Task 2: Pending Approval Workflow ---
        await authApi.approvePendingUser(pendingUser.id, {
          role: selectedRole,
          departmentId: selectedDept,
          academicYear: selectedRole === 'STUDENT' ? Number(academicYear) : undefined
        });
        toast.success(`User ${pendingUser.firstName} approved successfully!`);
      } else {
        // --- Task 1 (Modified): Direct Admin Creation (Bypass Pending/OTP) ---
        await userAdminApi.createAdminUser({
          firstName,
          lastName,
          email,
          password,
          nationalId,
          role: selectedRole,
          departmentId: selectedDept,
          academicYear: selectedRole === 'STUDENT' ? Number(academicYear) : undefined
        });
        toast.success(`User ${firstName} created and activated successfully!`);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (pendingUser ? 'Approval failed' : 'Creation failed'));
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
                <User className="h-5 w-5 text-indigo-400" />
              </div>
              {pendingUser ? 'Review & Approve User' : 'Direct User Provisioning'}
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
              {pendingUser ? 'Verify credentials for pending enrollment' : 'Bypassing OTP & Pending Queue'}
            </p>
          </div>
        } 
        onClose={onClose} 
      />

      <Modal.Body className="p-8 space-y-8 custom-scrollbar">
        {/* User Identity Preview (For Approval Mode) */}
        {pendingUser && (
          <div className="p-6 rounded-2xl bg-[#1e1b2e] border border-white/5 flex items-center justify-between shadow-inner animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {pendingUser.firstName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{pendingUser.firstName} {pendingUser.lastName}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" /> {pendingUser.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                Pending Approval
              </Badge>
              <span className="text-[10px] text-slate-500 font-mono">ID: {pendingUser.id}</span>
            </div>
          </div>
        )}

        {/* --- Direct Add New User Form Fields --- */}
        {!pendingUser && (
          <section className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Identity & Credentials</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                <Input 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Othman"
                  className="bg-[#0f111a] border-white/10 text-white h-11 rounded-xl"
                  startIcon={<User className="h-4 w-4 text-slate-500" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                <Input 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Al-Hamdi"
                  className="bg-[#0f111a] border-white/10 text-white h-11 rounded-xl"
                  startIcon={<User className="h-4 w-4 text-slate-500" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="bg-[#0f111a] border-white/10 text-white h-11 rounded-xl"
                  startIcon={<Mail className="h-4 w-4 text-slate-500" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</Label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="bg-[#0f111a] border-white/10 text-white h-11 rounded-xl"
                  startIcon={<Lock className="h-4 w-4 text-slate-500" />}
                />
              </div>
            </div>
          </section>
        )}

        {/* Configuration Section (Used in both modes) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {pendingUser ? 'Verify & Sync' : 'System Configuration'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Department</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Select Department" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1e1b2e] border-white/10 text-slate-200">
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id} className="hover:bg-indigo-600 focus:bg-indigo-600">
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">System Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Assign Role" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1e1b2e] border-white/10 text-slate-200">
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="HOD">HOD</SelectItem>
                  <SelectItem value="INSTRUCTOR">INSTRUCTOR</SelectItem>
                  <SelectItem value="STUDENT">STUDENT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'STUDENT' && (
              <div className="flex flex-col gap-2.5 animate-in slide-in-from-left-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Academic Year</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 2024" 
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  startIcon={<Calendar className="h-4 w-4 text-slate-400" />}
                  className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">National ID (14 Digits)</Label>
              <Input 
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="00000000000000" 
                maxLength={14}
                startIcon={<FileText className="h-4 w-4 text-slate-400" />}
                className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl font-mono focus:ring-indigo-500"
                disabled={!!pendingUser}
              />
            </div>
          </div>
        </section>

        {/* Status Sync Footer */}
        <section className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f111a] border border-white/5">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrative Provisioning</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Active Instantly</div>
          </div>
        </section>
      </Modal.Body>

      <Modal.Footer className="bg-[#0f111a]/50 border-t border-white/5 p-6">
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center w-full gap-4">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto text-slate-400 hover:text-white hover:bg-white/5">
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Button 
              className="w-full sm:w-auto px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {pendingUser ? 'Confirm Approval' : 'Create & Activate'}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
