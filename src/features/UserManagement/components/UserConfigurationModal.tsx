import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { 
  User, Mail, Building2, Shield, Settings, 
  CheckCircle2, FileText, Loader2, Calendar, Lock, Plus
} from 'lucide-react';
import * as departmentApi from '@/shared/api/departmentApi';
import * as authApi from '@/features/auth/api/authApi';
import * as userAdminApi from '@/shared/api/userAdminApi';
import type { Department } from '@/shared/api/departmentApi';
import type { ApprovePendingUserPayload, UserRole } from '@/features/auth/types';
import { toast } from 'sonner';

function resolveDepartmentId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'id' in value && typeof (value as { id: unknown }).id === 'string') {
    return (value as { id: string }).id;
  }
  if (typeof value === 'object' && value !== null && '_id' in value && typeof (value as { _id: unknown })._id === 'string') {
    return (value as { _id: string })._id;
  }
  return '';
}

interface UserConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: any; // The user to edit or approve
  mode?: 'create' | 'approve' | 'edit';
}

export function UserConfigurationModal({ open, onClose, onSuccess, user, mode = 'create' }: UserConfigurationModalProps) {
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
  
  // Inline Department Creation State
  const [showNewDeptForm, setShowNewDeptForm] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

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

  // Sync initial values
  useEffect(() => {
    if (user && (mode === 'approve' || mode === 'edit')) {
      setSelectedRole(user.role || 'STUDENT');
      setNationalId(user.nationalId ? String(user.nationalId) : '');
      const deptId = user.profile?.data?.departmentId?._id || user.profile?.data?.departmentId?.id || user.profile?.data?.departmentId || user.departmentId;
      setSelectedDept(resolveDepartmentId(deptId));
      
      const acadYear = user.profile?.data?.academicYear || user.academicYear;
      if (acadYear != null) setAcademicYear(String(acadYear));
      else setAcademicYear('');

      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPassword(''); // keep blank unless changing
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
  }, [user, mode, open]);

  const validateForm = () => {
    if (mode === 'create') {
      if (!firstName || !lastName || !email || !password) {
        toast.error('Basic information (Name, Email, Password) is required');
        return false;
      }
    } else if (mode === 'edit') {
      if (!firstName || !lastName || !email) {
        toast.error('Basic information (Name, Email) is required');
        return false;
      }
    }
    
    if ((mode === 'create' || mode === 'edit') && (nationalId.length !== 14 || !/^\d+$/.test(nationalId))) {
      toast.error('National ID must be exactly 14 digits');
      return false;
    }

    if (showNewDeptForm) {
      if (!newDeptName || !newDeptCode) {
        toast.error('New Department Name and Code are required');
        return false;
      }
    } else if (!selectedDept) {
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
      let finalDeptId = selectedDept;

      // Handle inline department creation first
      if (showNewDeptForm) {
        const newDept = await departmentApi.createDepartment({ 
          name: newDeptName, 
          code: newDeptCode, 
          description: '' 
        });
        finalDeptId = newDept._id || newDept.id;
        // Optionally fetch depts again, though modal might close anyway
      }

      if (mode === 'approve') {
        const pendingId = user._id ?? user.id;
        if (!pendingId) {
          toast.error('Missing pending user id; cannot approve.');
          return;
        }

        const data: ApprovePendingUserPayload = {
          role: selectedRole,
          departmentId: finalDeptId,
          academicYear: selectedRole === 'STUDENT' ? Number(academicYear) : undefined,
        };

        await authApi.approvePendingUser(pendingId, data);
        toast.success(`User ${user.firstName} approved successfully!`);
      } else if (mode === 'edit') {
        const payload: any = {
           firstName, lastName, email, role: selectedRole, departmentId: finalDeptId
        };
        if (password) payload.password = password;
        if (selectedRole === 'STUDENT') payload.academicYear = Number(academicYear);
        
        await userAdminApi.updateUser(user.id || user._id, payload);
        toast.success(`User updated successfully!`);
      } else {
        await userAdminApi.createAdminUser({
          firstName,
          lastName,
          email,
          password,
          nationalId: Number(nationalId),
          role: selectedRole,
          departmentId: finalDeptId,
          academicYear: selectedRole === 'STUDENT' ? Number(academicYear) : undefined,
        });
        toast.success(`User ${firstName} created and activated successfully!`);
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (mode === 'approve' ? 'Approval failed' : mode === 'edit' ? 'Update failed' : 'Creation failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logic to determine if the button should be disabled
  const isFormInvalid = () => {
    if (isSubmitting) return true;
    // if (nationalId.length !== 14) return true;
    // if (!selectedDept) return true;
    // if (selectedRole === 'STUDENT' && !academicYear) return true;
    // if (!pendingUser && (!firstName || !lastName || !email || !password)) return true;
    // return false;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="xl"
      className="max-w-4xl bg-app border border-violet-500/15 shadow-xl shadow-violet-950/40"
    >
      <Modal.Header 
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-content tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25">
                <User className="h-5 w-5 text-violet-300" />
              </div>
              {mode === 'approve' ? 'Review & Approve User' : mode === 'edit' ? 'Edit User Details' : 'Direct User Provisioning'}
            </h2>
            <p className="text-content-muted text-xs font-medium uppercase tracking-widest mt-1">
              {mode === 'approve' ? 'Verify credentials for pending enrollment' : mode === 'edit' ? 'Update user information and roles' : 'Bypassing OTP & Pending Queue'}
            </p>
          </div>
        } 
        onClose={onClose} 
      />

      <Modal.Body className="p-8 space-y-8 custom-scrollbar">
        {/* User Identity Preview (For Approval Mode) */}
        {mode === 'approve' && user && (
          <div className="p-6 rounded-2xl bg-panel border border-violet-500/15 flex items-center justify-between shadow-inner shadow-violet-950/20 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl font-bold text-content shadow-lg ring-2 ring-violet-500/20">
                {user.firstName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-content leading-tight">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-content-muted flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-violet-500/15 text-violet-200 border border-violet-500/30 px-3 py-1 font-bold text-[10px] uppercase tracking-widest shadow-sm shadow-violet-500/10">
                Pending Approval
              </Badge>
              <span className="text-[10px] text-content-muted font-mono">ID: {user._id || user.id}</span>
            </div>
          </div>
        )}

        {/* --- Direct Add/Edit User Form Fields --- */}
        {mode !== 'approve' && (
          <section className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 bg-violet-500 rounded-full" />
              <h3 className="text-sm font-bold text-content-muted uppercase tracking-widest">Identity & Credentials</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">First Name</Label>
                <Input 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Othman"
                  className="bg-app border-panel-hover text-content h-11 rounded-xl"
                  startIcon={<User className="h-4 w-4 text-content-muted" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Last Name</Label>
                <Input 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Al-Hamdi"
                  className="bg-app border-panel-hover text-content h-11 rounded-xl"
                  startIcon={<User className="h-4 w-4 text-content-muted" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Email Address</Label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="bg-app border-panel-hover text-content h-11 rounded-xl"
                  startIcon={<Mail className="h-4 w-4 text-content-muted" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Password</Label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'edit' ? 'Leave blank to keep current' : '••••••••'} 
                  className="bg-app border-panel-hover text-content h-11 rounded-xl"
                  startIcon={<Lock className="h-4 w-4 text-content-muted" />}
                />
              </div>
            </div>
          </section>
        )}

        {/* Configuration Section (Used in both modes) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-8 bg-violet-500 rounded-full" />
            <h3 className="text-sm font-bold text-content-muted uppercase tracking-widest">
              {mode === 'approve' ? 'Verify & Sync' : 'System Configuration'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Department</Label>
              {showNewDeptForm ? (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-violet-400">Create New Department</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-content-muted" onClick={() => setShowNewDeptForm(false)}>
                      Cancel
                    </Button>
                  </div>
                  <Input 
                    placeholder="Department Name (e.g. Information Technology)" 
                    value={newDeptName} 
                    onChange={e => setNewDeptName(e.target.value)} 
                    className="h-10 bg-app border-panel-hover"
                  />
                  <Input 
                    placeholder="Academic Code (e.g. IT-101)" 
                    value={newDeptCode} 
                    onChange={e => setNewDeptCode(e.target.value)} 
                    className="h-10 bg-app border-panel-hover font-mono"
                  />
                </div>
              ) : (
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-violet-500 focus:ring-offset-0 overflow-hidden">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                      <Building2 className="h-4 w-4 text-violet-400/80 shrink-0" />
                      <div className="truncate text-left flex-1"><SelectValue placeholder="Select Department" /></div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-panel-hover text-content">
                    {departments.map(dept => (
                      <SelectItem key={dept._id || dept.id} value={dept._id || dept.id} className="hover:bg-violet-600 focus:bg-violet-600">
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                    <div className="p-2 border-t border-violet-500/20 mt-1">
                      <Button 
                        type="button" 
                        onClick={() => setShowNewDeptForm(true)} 
                        className="w-full text-xs bg-violet-500/10 text-violet-300 hover:bg-violet-500/20" 
                        variant="ghost"
                      >
                         <Plus className="h-3.5 w-3.5 mr-2" /> Create New Department
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">System Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-violet-500 focus:ring-offset-0">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-violet-400/80" />
                    <SelectValue placeholder="Assign Role" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-panel border-panel-hover text-content">
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="HOD">HOD</SelectItem>
                  <SelectItem value="INSTRUCTOR">INSTRUCTOR</SelectItem>
                  <SelectItem value="STUDENT">STUDENT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'STUDENT' && (
              <div className="flex flex-col gap-2.5 animate-in slide-in-from-left-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Academic Year</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 2024" 
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  startIcon={<Calendar className="h-4 w-4 text-content-muted" />}
                  className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-violet-500 focus:ring-offset-0"
                />
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">National ID (14 Digits)</Label>
              <Input 
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="00000000000000" 
                maxLength={14}
                startIcon={<FileText className="h-4 w-4 text-content-muted" />}
                className="bg-app border-panel-hover text-content h-12 rounded-xl font-mono focus:ring-violet-500 focus:ring-offset-0"
                disabled={mode === 'approve' || mode === 'edit'}
              />
            </div>
          </div>
        </section>


      </Modal.Body>

      <Modal.Footer>
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center w-full gap-4 bg-app/50 -mx-6 -mb-4 px-6 py-6 border-t border-violet-500/10">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto text-content-muted hover:text-content hover:bg-violet-500/10">
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Button 
              className="w-full sm:w-auto px-10 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-12 rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 border border-violet-400/20"
              onClick={handleAction}
              disabled={isFormInvalid()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {mode === 'approve' ? 'Confirm Approval' : mode === 'edit' ? 'Save Changes' : 'Create & Activate'}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
