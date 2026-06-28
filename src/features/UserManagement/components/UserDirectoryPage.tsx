import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, User, Loader2, AlertTriangle, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

// We import the getAllUsers as a placeholder. In a real scenario, this might be 
// replaced with getAuthorizedUsers() for non-Admin roles (HOD/Instructor).
import { getAllUsers, type AdminUser } from '@/shared/api/userAdminApi';

export const UserDirectoryPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch the user directory');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(lowerQuery) || 
        user.lastName.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      );
    }

    if (roleFilter !== 'ALL') {
      result = result.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Loading User Directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 text-destructive">
        <AlertTriangle className="w-12 h-12" />
        <p className="font-semibold text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Directory</h2>
          <p className="text-muted-foreground mt-1">Browse and search for academic staff and students.</p>
        </div>
      </div>

      <Card className="bg-panel text-card-foreground border-panel shadow-xl">
        <CardHeader className="pb-4 border-b border-panel">
          <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Input
                type="search"
                placeholder="Search users by name or email..."
                className="w-full bg-app border-panel-hover text-content placeholder:text-content-muted ps-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="h-4 w-4 text-content-muted absolute start-3 top-3" />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-content-muted" />
              <select 
                className="bg-app border-panel-hover text-content-muted text-sm rounded-md h-10 px-3 focus:ring-1 focus:ring-indigo-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="INSTRUCTOR">Instructors</option>
              <option value="HOD">HODs</option>
            </select>
          </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">

      {/* User Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="relative group rounded-3xl bg-gradient-to-br from-[#12131f] to-[#0f111a] border border-panel hover:border-indigo-500/30 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-1">
              <div className="absolute -end-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />
              <Link to={`/dashboard/users/${user.id}/profile`} className="block h-full relative z-10">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-[#13151f] border border-indigo-500/20 shadow-lg group-hover:border-indigo-500/40 transition-colors">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-400 font-bold">
                          {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-black text-lg text-content group-hover:text-indigo-400 transition-colors tracking-tight">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-content-muted truncate w-40 sm:w-48 font-medium">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-panel-hover border border-panel group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-colors">
                      <ChevronRight className="w-4 h-4 text-content-muted group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-panel pt-4">
                    <div className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${
                      user.role === 'STUDENT' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {user.role}
                    </div>
                    
                    {user.departmentId && (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-content-muted font-bold">
                        <Briefcase className="w-3.5 h-3.5" /> Dept Included
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 rounded-3xl bg-panel/50 border border-panel border-dashed">
          <div className="p-4 rounded-2xl bg-panel-hover w-fit mx-auto mb-4">
            <User className="w-8 h-8 text-content-muted" />
          </div>
          <h3 className="text-lg font-black text-content">No users found</h3>
          <p className="text-sm text-content-muted mt-2">Try adjusting your search query or filters.</p>
        </div>
      )}
      </CardContent>
      </Card>
    </div>
  );
};
