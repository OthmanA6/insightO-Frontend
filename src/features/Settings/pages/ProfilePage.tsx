import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { User as UserIcon, Mail, Camera, Loader2, Shield, Building2, Calendar, Fingerprint, Lock } from 'lucide-react';
import * as authApi from '@/features/auth/api/authApi';
import type { User } from '@/features/auth/types';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await authApi.getProfile();
      setUser(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
    } catch (error) {
      toast.error('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateMe({ firstName, lastName, email });
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
        <UserIcon className="h-12 w-12 opacity-20 mb-4" />
        <p>User profile not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">Account Settings</h2>
          <p className="text-slate-400 font-medium">Manage your digital identity and academic credentials.</p>
        </div>
        <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
          Verified Identity
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Card & Quick Info */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-[#1e1b2e] border-white/5 shadow-2xl overflow-hidden group">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>
            <CardContent className="relative pt-0 flex flex-col items-center text-center">
              <div className="relative -mt-12 mb-4">
                <Avatar className="h-32 w-32 border-8 border-[#1e1b2e] shadow-2xl ring-2 ring-white/5 transition-transform group-hover:scale-105 duration-500">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Profile" />
                  <AvatarFallback className="text-4xl bg-indigo-500/20 text-indigo-400 font-black">{user.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-1 right-1 p-2.5 rounded-full bg-indigo-600 border-4 border-[#1e1b2e] text-white hover:bg-indigo-500 transition-all shadow-xl">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{user.firstName} {user.lastName}</h3>
              <p className="text-sm font-bold text-indigo-400/80 uppercase tracking-widest mt-1">{user.role}</p>
              
              <div className="w-full mt-8 grid grid-cols-2 gap-px bg-white/5 border-y border-white/5 overflow-hidden rounded-xl">
                <div className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
                  <Badge variant="success" className="px-2 py-0 font-bold text-[9px] h-5 uppercase">Active</Badge>
                </div>
                <div className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Created</span>
                  <span className="text-xs font-bold text-slate-300">{new Date(user.createdAt).getFullYear()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1b2e] border-white/5 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-500" /> Administrative Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Department</span>
                  <span className="text-xs font-bold text-slate-200">{user.departmentId?.name || 'Academic Administration'}</span>
                </div>
              </div>
              
              {user.academicYear && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Academic Year</span>
                    <span className="text-xs font-bold text-slate-200">{user.academicYear}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">National ID</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{user.nationalId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#1e1b2e] border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 p-8">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-indigo-500" /> Personal Identity
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Update your personal identification details synchronized with the central directory.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500" 
                      startIcon={<UserIcon className="h-4 w-4 text-slate-500" />} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500" 
                      startIcon={<UserIcon className="h-4 w-4 text-slate-500" />} 
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0f111a] border-white/10 text-white h-12 rounded-xl focus:ring-indigo-500" 
                    startIcon={<Mail className="h-4 w-4 text-slate-500" />} 
                  />
                  <p className="text-[10px] text-slate-600 ml-1 font-medium italic">Changes here will require re-verification of academic access.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 bg-[#0f111a]/50 p-6 border-t border-white/5">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => fetchProfile()}
                  className="text-slate-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl font-bold"
                >
                  Discard Changes
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-8 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Digital Profile
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="bg-[#1e1b2e] border-white/5 border-l-4 border-l-amber-500/50 shadow-xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Security Credentials</h4>
                  <p className="text-xs text-slate-500 font-medium">Update your password and authentication methods.</p>
                </div>
              </div>
              <Button variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
