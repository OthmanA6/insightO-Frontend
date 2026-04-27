import React, { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { Badge, User, Mail, Briefcase, Building2, Shield, Users, Settings, ChevronDown, CheckCircle2, FileText, Eye, EyeOff } from 'lucide-react';

interface UserConfigurationModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserConfigurationModal({ open, onClose }: UserConfigurationModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [accountStatus, setAccountStatus] = useState('active');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="xl"
      className="max-w-4xl"
    >
      <Modal.Header 
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></span>
              Add New User
            </h2>
            <p className="text-muted-foreground text-sm font-normal">Configure basic information and permissions.</p>
          </div>
        } 
        onClose={onClose} 
      />

      <Modal.Body className="p-6 md:p-8 space-y-8">
        {/* Basic Information Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Badge className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground tracking-wide">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
              <Input placeholder="e.g. Jane Doe" startIcon={<User className="h-4 w-4" />} />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
              <Input type="email" placeholder="e.g. jane.doe@insighto.ai" startIcon={<Mail className="h-4 w-4" />} />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Job Title</Label>
              <Input placeholder="e.g. Senior HR Analyst" startIcon={<Briefcase className="h-4 w-4" />} />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Department</Label>
              <Select>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="eng">Engineering</SelectItem>
                  <SelectItem value="mkt">Marketing</SelectItem>
                  <SelectItem value="ops">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Role & Access Level</Label>
              <Select>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Assign Role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Direct Manager</Label>
              <Select>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Manager" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah">Sarah Connor</SelectItem>
                  <SelectItem value="john">John Smith</SelectItem>
                  <SelectItem value="mike">Mike Ross</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="h-px bg-border w-full"></div>

        {/* Advanced Settings Section */}
        <section>
          <button 
            type="button"
            className="flex w-full items-center justify-between cursor-pointer p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/50 text-foreground border border-border">
                <Settings className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground tracking-wide">Advanced Settings</h3>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 ml-1">Granular Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'analytics', label: 'View Analytics', desc: 'Can view dashboard metrics', checked: true },
                    { id: 'users', label: 'Manage Users', desc: 'Can add/edit user accounts', checked: false },
                    { id: 'export', label: 'Export Data', desc: 'Can download CSV/PDF reports', checked: false },
                    { id: 'feedback', label: 'Submit Feedback', desc: 'Can participate in reviews', checked: true },
                    { id: 'config', label: 'System Config', desc: 'Can modify global settings', checked: false },
                  ].map((perm) => (
                    <Label key={perm.id} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all">
                      <Checkbox defaultChecked={perm.checked} className="mt-0.5" />
                      <div className="flex flex-col gap-1 font-normal">
                        <span className="text-sm font-medium text-foreground leading-none">{perm.label}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{perm.desc}</span>
                      </div>
                    </Label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Account Status</Label>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border w-fit">
                    {[
                      { id: 'active', label: 'Active' },
                      { id: 'suspended', label: 'Suspended' },
                      { id: 'onboarding', label: 'Onboarding' }
                    ].map(status => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setAccountStatus(status.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                          accountStatus === status.id 
                            ? 'bg-background shadow-sm text-foreground ring-1 ring-border' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Temporary Password</Label>
                    <button type="button" className="text-xs text-primary font-medium hover:text-primary/80 hover:underline">Generate Random</button>
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      defaultValue="tempPassword123!" 
                      className="font-mono tracking-wider pr-10" 
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground ml-1">User will be forced to change this on first login.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center w-full gap-4">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
              <FileText className="h-4 w-4" /> Save as Draft
            </Button>
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Create User
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
