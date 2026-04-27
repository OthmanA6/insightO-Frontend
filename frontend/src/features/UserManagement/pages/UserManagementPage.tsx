import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Shield, Mail, UserCheck, UserX, Filter, Download } from 'lucide-react';
import { UserConfigurationModal } from '../components/UserConfigurationModal';

const usersData = [
  { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=1', joined: 'Oct 24, 2023' },
  { id: 2, name: 'Sarah Williams', email: 'sarah.w@example.com', role: 'Editor', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=2', joined: 'Nov 12, 2023' },
  { id: 3, name: 'Michael Brown', email: 'mbrown@example.com', role: 'Viewer', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=3', joined: 'Jan 05, 2024' },
  { id: 4, name: 'Emily Davis', email: 'emily.d@example.com', role: 'Editor', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=4', joined: 'Feb 18, 2024' },
  { id: 5, name: 'James Wilson', email: 'jwilson@example.com', role: 'Viewer', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=5', joined: 'Mar 30, 2024' },
];

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredUsers = usersData.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="text-muted-foreground mt-1">Manage your team members and their account permissions.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add New User
          </Button>
        </div>
      </div>

      <Card className="bg-card text-card-foreground border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-medium">All Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="w-full bg-background border-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden dark:bg-surface-dark">
            <div className="w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b [&_tr]:border-border bg-muted/30">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground dark:text-slate-400">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground dark:text-slate-400 ">Role</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground dark:text-slate-400">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground dark:text-slate-400">Joined</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{user.name}</span>
                              <span className="text-xs dark:text-slate-400 text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" /> {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center dark:text-slate-400 gap-2 text-foreground font-medium">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            {user.role}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={user.status === 'Active' ? "success" : "destructive"}
                            className="font-medium px-2.5 py-0.5"
                          >
                            {user.status === 'Active' ? <UserCheck className="mr-1 h-3.5 w-3.5" /> : <UserX className="mr-1 h-3.5 w-3.5" />}
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 dark:text-slate-400 align-middle text-muted-foreground">
                          {user.joined}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border min-w-[160px]">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="hover:bg-muted hover:text-foreground cursor-pointer">
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-muted hover:text-foreground cursor-pointer">
                                View Activity
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Search className="h-8 w-8 mb-4 opacity-20" />
                          <p className="text-lg font-medium text-foreground">No users found</p>
                          <p className="text-sm">No users match your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-4 flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
              <div>
                Showing <strong>{filteredUsers.length}</strong> of <strong>{usersData.length}</strong> users
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserConfigurationModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
