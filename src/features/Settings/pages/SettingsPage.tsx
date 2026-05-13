import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { 
  Bell, Lock, Shield, Eye, Globe, Smartphone, 
  Key, ShieldCheck, History, Laptop, Loader2, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import * as authApi from '@/features/auth/api/authApi';
import { toast } from 'sonner';

type SettingsTab = 'notifications' | 'security' | 'privacy' | 'language' | 'devices';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [isSaving, setIsSaving] = useState(false);

  // Security Form State
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword({ currentPassword: passwordCurrent, newPassword: password, confirmPassword: passwordConfirm });
      toast.success('Password updated successfully. Please use your new credentials for future logins.');
      setPasswordCurrent('');
      setPassword('');
      setPasswordConfirm('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password update failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">System Settings</h2>
        <p className="text-slate-400 font-medium">Configure your account preferences and security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security & Auth', icon: Lock },
            { id: 'privacy', label: 'Privacy & Data', icon: Shield },
            { id: 'language', label: 'Language', icon: Globe },
            { id: 'devices', label: 'Active Sessions', icon: Laptop },
          ].map((tab) => (
            <Button 
              key={tab.id}
              variant={activeTab === tab.id ? "primary" : "ghost"}
              className={`w-full justify-start font-bold h-12 rounded-xl transition-all ${
                activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
            >
              <tab.icon className={`mr-3 h-4 w-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'notifications' && (
            <Card className="bg-[#1e1b2e] border-white/5 shadow-2xl overflow-hidden animate-in slide-in-from-right-4">
              <CardHeader className="bg-white/[0.02] border-b border-white/5 p-8">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Bell className="h-5 w-5 text-indigo-500" /> Notifications
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Manage how InsightO communicates with you across different channels.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Academic Notifications</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-slate-200">New Evaluations</Label>
                      <p className="text-xs text-slate-500 font-medium">Get notified when a new evaluation is assigned to your department.</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-slate-200">Submission Deadlines</Label>
                      <p className="text-xs text-slate-500 font-medium">Reminders about upcoming academic document submission deadlines.</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Platform Updates</h4>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-slate-200">System Maintenance</Label>
                      <p className="text-xs text-slate-500 font-medium">Crucial updates about scheduled downtime or platform upgrades.</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[#0f111a]/50 border-t border-white/5 p-6 flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg">Save Preferences</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <Card className="bg-[#1e1b2e] border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5 p-8">
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <Key className="h-5 w-5 text-indigo-500" /> Change Password
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-1">Ensure your account stays protected by using a unique and strong password.</CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordChange}>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Current Password</Label>
                      <Input 
                        type="password" 
                        value={passwordCurrent}
                        onChange={(e) => setPasswordCurrent(e.target.value)}
                        placeholder="••••••••" 
                        className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
                        startIcon={<Lock className="h-4 w-4 text-slate-500" />}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">New Password</Label>
                        <Input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
                          startIcon={<Key className="h-4 w-4 text-slate-500" />}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Confirm New Password</Label>
                        <Input 
                          type="password" 
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          placeholder="••••••••" 
                          className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500"
                          startIcon={<CheckCircle2 className="h-4 w-4 text-slate-500" />}
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-medium text-amber-500/80 leading-relaxed uppercase tracking-wider">
                        Password must be at least 8 characters long and include numbers, symbols, and mixed-case letters for maximum security.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-[#0f111a]/50 border-t border-white/5 p-6 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Update Credentials
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="bg-[#1e1b2e] border-white/5 shadow-xl overflow-hidden border-l-4 border-l-indigo-500">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white tracking-tight">Two-Factor Authentication</h4>
                      <p className="text-sm text-slate-500 font-medium">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 h-11 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    Configure 2FA
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#1e1b2e] border-white/5 shadow-xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-500" /> Recent Security Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                    {[
                      { action: 'Password Change', date: 'May 10, 2024', status: 'Success', icon: Key },
                      { action: 'New Login from Chrome on Windows', date: 'May 08, 2024', status: 'Success', icon: Laptop },
                    ].map((item, i) => (
                      <div key={i} className="px-8 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center gap-4">
                          <item.icon className="h-4 w-4 text-slate-500" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-200">{item.action}</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{item.date}</span>
                          </div>
                        </div>
                        <Badge variant="success" className="px-2 py-0 text-[8px] uppercase">{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(activeTab === 'privacy' || activeTab === 'language' || activeTab === 'devices') && (
            <Card className="bg-[#1e1b2e] border-white/5 border-dashed border-2 py-20 flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{activeTab.toUpperCase()} Module</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium">This synchronization module is currently being provisioned in the backend directory.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal Badge helper since it's used in the template
function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  const variants: any = {
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    default: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  };
  return (
    <span className={`px-2 py-1 rounded-md border font-medium inline-flex items-center ${variants[variant || 'default']} ${className}`}>
      {children}
    </span>
  );
}
