import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Modal } from '@/shared/components/ui/Modal';
import { User as UserIcon, Mail, Camera, Loader2, Shield, Building2, Calendar, Fingerprint, Lock, Eye, EyeOff, CheckCircle2, XCircle, Palette } from 'lucide-react';
import * as authApi from '@/features/auth/api/authApi';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import type { User } from '@/features/auth/types';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Avatar upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // ── Avatar Upload Handler ────────────────────────────────────────────────────
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPEG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updatedUser = await authApi.uploadAvatar(file);
      setUser((prev) => prev ? { ...prev, profileImage: updatedUser.profileImage } : prev);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Profile Update Handler ───────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateMe({ firstName, lastName, email });
      setUser((prev) => prev ? { ...prev, ...updatedUser } : updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Password Change Handler ──────────────────────────────────────────────────
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const passwordLongEnough = newPassword.length >= 8;
  const passwordFormValid = currentPassword.length > 0 && passwordsMatch && passwordLongEnough;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordFormValid) return;

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success('Password changed successfully');
      // Reset form & close modal
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // ── Avatar source logic ──────────────────────────────────────────────────────
  const avatarSrc = user?.profileImage
    ? user.profileImage
    : user
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
      : undefined;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-content-muted">
        <UserIcon className="h-12 w-12 opacity-20 mb-4" />
        <p>User profile not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-content">Account Settings</h2>
          <p className="text-content-muted font-medium">Manage your digital identity and academic credentials.</p>
        </div>
        <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
          Verified Identity
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Card & Quick Info */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-panel border-panel shadow-2xl overflow-hidden group">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>
            <CardContent className="relative pt-0 flex flex-col items-center text-center">
              <div className="relative -mt-12 mb-4">
                <Avatar className="h-32 w-32 border-8 border-[#1e1b2e] shadow-2xl ring-2 ring-white/5 transition-transform group-hover:scale-105 duration-500">
                  <AvatarImage src={avatarSrc} alt="Profile" />
                  <AvatarFallback className="text-4xl bg-indigo-500/20 text-indigo-400 font-black">{user.firstName.charAt(0)}</AvatarFallback>
                </Avatar>

                {/* Hidden file input for avatar upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 end-1 p-2.5 rounded-full bg-indigo-600 border-4 border-[#1e1b2e] text-content hover:bg-indigo-500 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload profile picture"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              <h3 className="text-2xl font-black text-content tracking-tight">{user.firstName} {user.lastName}</h3>
              <p className="text-sm font-bold text-indigo-400/80 uppercase tracking-widest mt-1">{user.role}</p>
              
              <div className="w-full mt-8 grid grid-cols-2 gap-px bg-panel-hover border-y border-panel overflow-hidden rounded-xl">
                <div className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1">Status</span>
                  <Badge variant="success" className="px-2 py-0 font-bold text-[9px] h-5 uppercase">Active</Badge>
                </div>
                <div className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1">Created</span>
                  <span className="text-xs font-bold text-content-muted">{new Date(user.createdAt).getFullYear()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-panel border-panel shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-content-muted flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-500" /> Administrative Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-panel-hover border border-panel">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-tight">Department</span>
                  <span className="text-xs font-bold text-content">{user.departmentId?.name || 'Academic Administration'}</span>
                </div>
              </div>
              
              {user.academicYear && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-panel-hover border border-panel">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-tight">Academic Year</span>
                    <span className="text-xs font-bold text-content">{user.academicYear}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-3 rounded-xl bg-panel-hover border border-panel">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-tight">National ID</span>
                  <span className="text-xs font-mono font-bold text-content-muted">{user.nationalId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-panel border-panel shadow-2xl overflow-hidden">
            <CardHeader className="bg-panel-hover border-b border-panel p-8">
              <CardTitle className="text-xl font-bold text-content flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-indigo-500" /> Personal Identity
              </CardTitle>
              <CardDescription className="text-content-muted font-medium mt-1">Update your personal identification details synchronized with the central directory.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-indigo-500" 
                      startIcon={<UserIcon className="h-4 w-4 text-content-muted" />} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-indigo-500" 
                      startIcon={<UserIcon className="h-4 w-4 text-content-muted" />} 
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-indigo-500" 
                    startIcon={<Mail className="h-4 w-4 text-content-muted" />} 
                  />
                  <p className="text-[10px] text-slate-600 ms-1 font-medium italic">Changes here will require re-verification of academic access.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 bg-app/50 p-6 border-t border-panel">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => fetchProfile()}
                  className="text-content-muted hover:text-content hover:bg-panel-hover h-11 px-6 rounded-xl font-bold"
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

          <Card className="bg-panel border-panel border-s-4 border-s-amber-500/50 shadow-xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content tracking-tight">Security Credentials</h4>
                  <p className="text-xs text-content-muted font-medium">Update your password and authentication methods.</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-panel border-panel border-s-4 border-s-indigo-500/50 shadow-xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content tracking-tight">Appearance</h4>
                  <p className="text-xs text-content-muted font-medium">Toggle between Light and Dark mode for the system.</p>
                </div>
              </div>
              <div className="bg-panel-hover border border-panel rounded-xl flex items-center justify-center shadow-inner">
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Password Change Modal ─────────────────────────────────────────────── */}
      <Modal
        open={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        title={
          <span className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-500" />
            </div>
            Change Password
          </span>
        }
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClosePasswordModal}
              className="text-content-muted hover:text-content hover:bg-panel-hover h-10 px-5 rounded-xl font-bold text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="change-password-form"
              disabled={!passwordFormValid || isChangingPassword}
              className="bg-amber-500 hover:bg-amber-400 text-black h-10 px-6 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </>
        }
      >
        <form id="change-password-form" onSubmit={handleChangePassword} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-app border-panel-hover text-content h-11 rounded-xl focus:ring-amber-500 pe-10"
                startIcon={<Lock className="h-4 w-4 text-content-muted" />}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-muted transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="bg-app border-panel-hover text-content h-11 rounded-xl focus:ring-amber-500 pe-10"
                startIcon={<Lock className="h-4 w-4 text-content-muted" />}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-muted transition-colors"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Validation indicators */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-1.5 ms-1">
                {passwordLongEnough ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-[10px] font-medium ${passwordLongEnough ? 'text-emerald-500' : 'text-red-400'}`}>
                  At least 8 characters
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="bg-app border-panel-hover text-content h-11 rounded-xl focus:ring-amber-500 pe-10"
                startIcon={<Lock className="h-4 w-4 text-content-muted" />}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-muted transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 ms-1">
                {passwordsMatch ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-[10px] font-medium ${passwordsMatch ? 'text-emerald-500' : 'text-red-400'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
