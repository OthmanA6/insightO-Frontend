import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Search, Plus, MoreHorizontal, Shield, Mail, UserCheck,
  Filter, Download, Trash2, Ban, CheckCircle2, Loader2, AlertCircle, User,
  Eye, Settings, UserPlus
} from 'lucide-react';
import { UserConfigurationModal } from '../components/UserConfigurationModal';
import * as userAdminApi from '@/shared/api/userAdminApi';
import { approveUser, type AdminUser } from '@/shared/api/userAdminApi';
import type { PendingUser } from '@/features/auth/types';
import { toast } from 'sonner';

/** Matches admin user / pending-user API status strings and UI badges */
const STATUS_PENDING_APPROVAL = 'PENDING APPROVAL';
const STATUS_ACTIVE = 'ACTIVE';

const isPendingApprovalStatus = (status?: string) =>
  (status?.trim() ?? '') === STATUS_PENDING_APPROVAL;

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'approve' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState('all');

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, pending] = await Promise.all([
        userAdminApi.getAllUsers(),
        userAdminApi.getPendingUsersForAdmin(),
      ]);
      setUsers(allUsers);
      setPendingUsers(
        pending.map((p) => ({
          ...p,
          id: p.id || (p as { _id?: string })._id || '',
          status: p.status?.trim() ? p.status.trim() : undefined,
        })),
      );
    } catch (error) {
      toast.error('Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


  // 1. تصفية اليوزرز لتابة All Users (المفعلين فقط)
  const filteredUsers = users.filter((user) => {
    const isActuallyActive = user.isActive === true;
    const matchesSearch =
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return isActuallyActive && matchesSearch && matchesRole;
  });

  const filteredPending = [
    ...pendingUsers,
    ...users.filter(u => u.isActive === false)
  ].filter((user, index, self) => {

    const isDuplicate = self.findIndex(t => (t.id || (t as any)._id) === (user.id || (user as any)._id)) !== index;
    if (isDuplicate) return false;

    const isPending = user.isActive === false || user.status?.trim().toUpperCase() === "PENDING APPROVAL";
    const matchesSearch =
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return isPending && matchesSearch && matchesRole;
  });

  const usersExcludingPendingApproval = users.filter(u => u.isActive === true);
  const pendingApprovalOnly = [
    ...pendingUsers,
    ...users.filter(u => u.isActive === false)
  ].filter((user, index, self) =>
    self.findIndex(t => (t.id || (t as any)._id) === (user.id || (user as any)._id)) === index &&
    (user.isActive === false || user.status?.trim().toUpperCase() === "PENDING APPROVAL")
  );





  // 4. دالة التحديد الكل
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentList = activeTab === 'all' ? filteredUsers : filteredPending;
      setSelectedIds(currentList.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await userAdminApi.deleteUser(id);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };


  const handleBulkAction = async (action: 'delete' | 'suspend' | 'activate') => {
    const confirmMsg = action === 'delete'
      ? `Are you sure you want to delete ${selectedIds.length} users?`
      : `Are you sure you want to ${action} ${selectedIds.length} users?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (action === 'delete') {
        await Promise.all(selectedIds.map(id => userAdminApi.deleteUser(id)));
      } else {
        await Promise.all(selectedIds.map(id => userAdminApi.updateUser(id, { isActive: action === 'activate' })));
      }
      toast.success(`Bulk ${action} successful`);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast.error('Bulk operation partially failed');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 me-2 p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-in slide-in-from-right-2">
              <span className="text-[10px] font-bold text-indigo-400 px-2 uppercase tracking-widest">{selectedIds.length} Selected</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('activate')} className="h-8 text-emerald-400 hover:bg-emerald-500/10 px-3">
                  <UserCheck className="h-3.5 w-3.5 me-1" /> Activate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('suspend')} className="h-8 text-amber-400 hover:bg-amber-500/10 px-3">
                  <Ban className="h-3.5 w-3.5 me-1" /> Suspend
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('delete')} className="h-8 text-red-400 hover:bg-red-500/10 px-3">
                  <Trash2 className="h-3.5 w-3.5 me-1" /> Delete
                </Button>
              </div>
            </div>
          )}

          <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white gap-2 font-bold h-10 px-4 rounded-xl shadow-lg shadow-violet-500/20"
              onClick={() => {
                setSelectedPendingUser(null);
                setModalMode('create');
                setIsModalOpen(true);
              }}
            >
            <Plus className="h-4 w-4" /> Add New User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-panel border border-panel p-1 mb-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-content">
            All Users ({usersExcludingPendingApproval.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-content relative">
            Pending Approval ({pendingApprovalOnly.length})
            {pendingApprovalOnly.length > 0 && (
              <span className="absolute -top-1 -end-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <Card className="bg-panel text-card-foreground border-panel shadow-xl">
          <CardHeader className="pb-4 border-b border-panel">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="w-full bg-app border-panel-hover text-content placeholder:text-content-muted"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    startIcon={<Search className="h-4 w-4 text-content-muted" />}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 border-panel-hover hover:bg-panel-hover text-content-muted">
                      <Filter className="h-4 w-4" /> {roleFilter === 'ALL' ? 'Filter by Role' : roleFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-panel border-panel-hover text-content-muted w-48">
                    <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setRoleFilter('ALL')} className="hover:bg-indigo-600 hover:text-content cursor-pointer">All Roles</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter('STUDENT')} className="hover:bg-indigo-600 hover:text-content cursor-pointer">Student</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter('INSTRUCTOR')} className="hover:bg-indigo-600 hover:text-content cursor-pointer">Instructor</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter('HOD')} className="hover:bg-indigo-600 hover:text-content cursor-pointer">Head of Dept</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter('ADMIN')} className="hover:bg-indigo-600 hover:text-content cursor-pointer">Admin</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 text-content-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Loading synchronization data...</p>
                </div>
              ) : (
                <UserTable
                  users={filteredUsers}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDelete={handleDeleteUser}
                  setModalMode={setModalMode}
                  setIsModalOpen={setIsModalOpen}
                  setSelectedPendingUser={setSelectedPendingUser}
                  type="all"
                />
              )}
            </TabsContent>

            <TabsContent value="pending" className="m-0">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 text-content-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Fetching pending approvals...</p>
                </div>
              ) : (
                <UserTable
                  users={filteredPending}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDelete={() => { }} // Handle separately
                  setModalMode={setModalMode}
                  setIsModalOpen={setIsModalOpen}
                  setSelectedPendingUser={setSelectedPendingUser}
                  onApprove={(user) => {
                    setSelectedPendingUser(user);
                    setModalMode('approve');
                    setIsModalOpen(true);
                  }}
                  type="pending"
                />
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <UserConfigurationModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData}
        user={selectedPendingUser}
        mode={modalMode}
      />
    </div>
  );
}

interface UserTableProps {
  users: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (id: string) => void;
  onApprove?: (user: any) => void;
  setModalMode: (mode: 'create' | 'approve' | 'edit') => void;
  setIsModalOpen: (open: boolean) => void;
  setSelectedPendingUser: (user: any) => void;
  type: 'all' | 'pending';
}

function UserTable({ users, selectedIds, onToggleSelect, onSelectAll, onDelete, onApprove, setModalMode, setIsModalOpen, setSelectedPendingUser, type }: UserTableProps) {
  return (
    <div className="w-full overflow-auto custom-scrollbar">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-app border-b border-panel">
          <tr className="transition-colors">
            <th className="h-12 px-4 text-start align-middle w-10">
              <Checkbox
                checked={users.length > 0 && selectedIds.length === users.length}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              />
            </th>
            <th className="h-12 px-4 text-start align-middle font-bold text-content-muted uppercase text-[10px] tracking-wider">User</th>
            <th className="h-12 px-4 text-start align-middle font-bold text-content-muted uppercase text-[10px] tracking-wider">Department</th>
            <th className="h-12 px-4 text-start align-middle font-bold text-content-muted uppercase text-[10px] tracking-wider">Role</th>
            <th className="h-12 px-4 text-start align-middle font-bold text-content-muted uppercase text-[10px] tracking-wider">Status</th>
            <th className="h-12 px-4 align-middle font-bold text-content-muted uppercase text-[10px] tracking-wider text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="border-b border-panel transition-colors hover:bg-white/2">
                <td className="p-4 align-middle">
                  <Checkbox
                    checked={selectedIds.includes(user.id)}
                    onCheckedChange={() => onToggleSelect(user.id)}
                  />
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-panel-hover ring-2 ring-indigo-500/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                      <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold">{user.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <Link to={`/dashboard/users/${user.id}/profile`} className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">{user.firstName} {user.lastName}</Link>
                      <span className="text-xs text-content-muted flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-content-muted">
                      {user.profile?.data?.departmentId?.name || 
                       user.profile?.data?.departmentIds?.[0]?.name || 
                       (user.departmentId?.name) || 
                       'Unassigned'}
                    </span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2 text-content-muted font-semibold text-xs">
                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                    {user.role}
                  </div>
                </td>
                <td className="p-4 align-middle">
                  {(() => {
                    const rowStatus =
                      type === 'all'
                        ? (user.status?.trim() ||
                          (user.isActive ? STATUS_ACTIVE : STATUS_PENDING_APPROVAL))
                        : STATUS_PENDING_APPROVAL;
                    const isActiveRow =
                      type === 'all' &&
                      (rowStatus === STATUS_ACTIVE ||
                        (user.status == null && user.isActive));
                    return (
                      <Badge
                        variant={
                          type === 'all'
                            ? isActiveRow
                              ? 'success'
                              : 'destructive'
                            : 'secondary'
                        }
                        className={
                          type === 'pending'
                            ? 'font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider border-violet-500/35 bg-violet-500/15 text-violet-200 shadow-sm shadow-violet-500/10'
                            : 'font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider'
                        }
                      >
                        {type === 'all' ? (
                          isActiveRow ? (
                            <UserCheck className="me-1 h-3 w-3" />
                          ) : (
                            <AlertCircle className="me-1 h-3 w-3" />
                          )
                        ) : (
                          <AlertCircle className="me-1 h-3 w-3" />
                        )}
                        {rowStatus}
                      </Badge>
                    );
                  })()}
                </td>
                <td className="p-4 align-middle text-end">
                  {type === 'all' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-panel-hover rounded-lg">
                          <MoreHorizontal className="h-4 w-4 text-content-muted" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-panel border-panel-hover text-content-muted">
                        <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-violet-400">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-panel-hover" />
                        <DropdownMenuItem className="hover:bg-indigo-600 hover:text-content cursor-pointer gap-2">
                          <Eye className="h-3.5 w-3.5" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="hover:bg-indigo-600 hover:text-content cursor-pointer gap-2"
                          onClick={() => {
                            setSelectedPendingUser(user as any);
                            setModalMode('edit');
                            setIsModalOpen(true);
                          }}
                        >
                          <Settings className="h-3.5 w-3.5" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-indigo-600 hover:text-content cursor-pointer gap-2">
                          <Shield className="h-3.5 w-3.5" /> Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-panel-hover" />
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-500 focus:text-content cursor-pointer gap-2"
                          onClick={() => onDelete(user.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Permanent Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="h-8 px-3 text-[10px] font-bold bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-md shadow-violet-500/25 border border-violet-400/20"
                        onClick={() => onApprove?.(user)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 me-1" /> Approve
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="p-16 text-center">
                <div className="flex flex-col items-center justify-center text-content-muted">
                  <div className="w-16 h-16 rounded-2xl bg-app border border-panel flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-lg font-bold text-content tracking-tight">Sync Complete - No Results</p>
                  <p className="text-xs max-w-xs mx-auto mt-1">No users matched your current filters or synchronization parameters.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
