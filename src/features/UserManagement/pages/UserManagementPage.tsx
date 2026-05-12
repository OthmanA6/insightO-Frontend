import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { 
  Search, Plus, MoreHorizontal, Shield, Mail, UserCheck, UserX, 
  Filter, Download, Trash2, Ban, CheckCircle2, Loader2, AlertCircle 
} from 'lucide-react';
import { UserConfigurationModal } from '../components/UserConfigurationModal';
import * as userAdminApi from '@/shared/api/userAdminApi';
import * as authApi from '@/features/auth/api/authApi';
import type { AdminUser } from '@/shared/api/userAdminApi';
import type { PendingUser } from '@/features/auth/types';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        authApi.getPendingUsers()
      ]);
      setUsers(allUsers);
      setPendingUsers(pending);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentList = activeTab === 'all' ? users : pendingUsers;
      setSelectedIds(currentList.map(u => u.id));
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

  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingUsers.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="text-muted-foreground mt-1">Mirroring Backend API v1.0 Administration.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2 p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-in slide-in-from-right-2">
              <span className="text-[10px] font-bold text-indigo-400 px-2 uppercase tracking-widest">{selectedIds.length} Selected</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('activate')} className="h-8 text-emerald-400 hover:bg-emerald-500/10 px-3">
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('suspend')} className="h-8 text-amber-400 hover:bg-amber-500/10 px-3">
                  <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('delete')} className="h-8 text-red-400 hover:bg-red-500/10 px-3">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
          <Button variant="outline" className="flex items-center gap-2 border-white/10 hover:bg-white/5">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add New User
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-[#1e1b2e] border border-white/5 p-1 mb-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            All Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white relative">
            Pending Approval ({pendingUsers.length})
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <Card className="bg-[#1e1b2e] text-card-foreground border-white/5 shadow-xl">
          <CardHeader className="pb-4 border-b border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="w-full bg-[#0f111a] border-white/10 text-white placeholder:text-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    startIcon={<Search className="h-4 w-4 text-slate-400" />}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2 border-white/10 hover:bg-white/5 text-slate-300">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-500">
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
                  type="all"
                />
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="m-0">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Fetching pending approvals...</p>
                </div>
              ) : (
                <UserTable 
                  users={filteredPending} 
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDelete={() => {}} // Handle separately
                  onApprove={(user) => {
                    setSelectedPendingUser(user);
                    setIsModalOpen(true);
                  }}
                  type="pending"
                  onRefresh={fetchData}
                />
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <UserConfigurationModal 
        open={isModalOpen} 
        pendingUser={selectedPendingUser}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPendingUser(null);
          fetchData();
        }} 
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
  type: 'all' | 'pending';
  onRefresh?: () => void;
}

function UserTable({ users, selectedIds, onToggleSelect, onSelectAll, onDelete, onApprove, type, onRefresh }: UserTableProps) {
  return (
    <div className="w-full overflow-auto custom-scrollbar">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-[#0f111a] border-b border-white/5">
          <tr className="transition-colors">
            <th className="h-12 px-4 text-left align-middle w-[40px]">
              <Checkbox 
                checked={users.length > 0 && selectedIds.length === users.length}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              />
            </th>
            <th className="h-12 px-4 text-left align-middle font-bold text-slate-400 uppercase text-[10px] tracking-wider">User</th>
            <th className="h-12 px-4 text-left align-middle font-bold text-slate-400 uppercase text-[10px] tracking-wider">Department</th>
            <th className="h-12 px-4 text-left align-middle font-bold text-slate-400 uppercase text-[10px] tracking-wider">Role</th>
            <th className="h-12 px-4 text-left align-middle font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status</th>
            <th className="h-12 px-4 align-middle font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                <td className="p-4 align-middle">
                  <Checkbox 
                    checked={selectedIds.includes(user.id)}
                    onCheckedChange={() => onToggleSelect(user.id)}
                  />
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-indigo-500/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                      <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold">{user.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">{user.departmentId?.name || user.departmentId || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                    {user.role}
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <Badge 
                    variant={type === 'all' ? (user.isActive ? "success" : "destructive") : "warning"}
                    className="font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider"
                  >
                    {type === 'all' ? (
                      user.isActive ? <UserCheck className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    {type === 'all' ? (user.isActive ? 'Active' : 'Pending Approval') : 'Pending Sync'}
                  </Badge>
                </td>
                <td className="p-4 align-middle text-right">
                  {type === 'all' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5 rounded-lg">
                          <MoreHorizontal className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1e1b2e] border-white/10 text-slate-300">
                        <DropdownMenuLabel>User Management</DropdownMenuLabel>
                        <DropdownMenuItem className="hover:bg-indigo-600 hover:text-white cursor-pointer gap-2">
                          <Shield className="h-3.5 w-3.5" /> Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-indigo-600 hover:text-white cursor-pointer gap-2">
                          <Ban className="h-3.5 w-3.5" /> Suspend Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem 
                          className="text-red-400 focus:bg-red-500 focus:text-white cursor-pointer gap-2"
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
                        variant="gradient"
                        className="h-8 px-3 text-[10px] font-bold"
                        onClick={() => onApprove?.(user)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="p-16 text-center">
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-[#0f111a] border border-white/5 flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-lg font-bold text-white tracking-tight">Sync Complete - No Results</p>
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
