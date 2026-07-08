import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, MoreVertical, Edit3, Trash2,
  Users, UserCheck, BarChart3, ChevronRight,
  Download, Filter, ArrowUpRight, Loader2, BookOpen
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { DepartmentModal } from '../components/DepartmentModal';
import { GlobalDepartmentAnalyticsDashboard } from '../components/GlobalDepartmentAnalyticsDashboard';
import type { Department, CreateDepartmentPayload } from '../types/department.types';

/** Safely resolve a department ID from either MongoDB's _id or the normalized id field. */
const resolveDeptId = (dept: Department): string => (dept as any)._id || dept.id;

import * as departmentApi from '@/shared/api/departmentApi';


export default function DepartmentManagementPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, { students: number, courses: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const [data, analytics] = await Promise.all([
        departmentApi.getAllDepartments(),
        departmentApi.getGlobalAnalytics()
      ]);
      setDepartments(data);
      
      const map: Record<string, { students: number, courses: number }> = {};
      if (analytics?.comparisons) {
        analytics.comparisons.forEach(c => {
          map[c.departmentId] = { students: c.enrollmentCount, courses: c.courseCount };
        });
      }
      setAnalyticsMap(map);
    } catch (error) {
      toast.error('Failed to synchronize department data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepts = useMemo(() => {
    return departments.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  const handleSave = async (payload: CreateDepartmentPayload) => {
    try {
      if (editingDept) {
        await departmentApi.updateDepartment(resolveDeptId(editingDept), payload);
        toast.success('Department updated successfully');
      } else {
        await departmentApi.createDepartment(payload);
        toast.success('New department provisioned');
      }
      fetchDepartments();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? All linked profiles will lose their department association.')) {
      try {
        await departmentApi.deleteDepartment(id);
        toast.success('Entity purged from system');
        fetchDepartments();
      } catch (error) {
        toast.error('Purge failed');
      }
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-content flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-500" />
            Departments
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          <Button
            onClick={() => { setEditingDept(null); setIsModalOpen(true); }}
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Department
          </Button>
        </div>
      </div>

      <Tabs defaultValue="management" className="w-full space-y-8">
        <TabsList className="bg-panel border border-panel p-1 rounded-2xl">
          <TabsTrigger value="management" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2 inline-block" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Global Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <GlobalDepartmentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="management" className="space-y-8">
          {/* Control Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-panel p-4 rounded-3xl border border-panel">
        <div className="w-full lg:w-96 relative group">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or code..."
            className="h-12 rounded-2xl bg-app border-panel text-content ps-12 pe-4 font-bold"
          />
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <Button variant="ghost" className="text-content-muted font-bold hover:text-content hover:bg-panel-hover">
            <Filter className="me-2 h-4 w-4" /> Filters
          </Button>
          <div className="h-8 w-px bg-panel-hover mx-2 hidden lg:block"></div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total: {filteredDepts.length}</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-content-muted uppercase tracking-widest">Synchronizing Department Data...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-20">
            <Building2 className="h-16 w-16 text-content-muted" />
            <p className="text-lg font-bold text-content-muted">No departments found matching your criteria</p>
          </div>
        ) : (
          filteredDepts.map((dept) => (
            <div key={resolveDeptId(dept)} className="group relative rounded-3xl bg-panel border border-panel hover:border-indigo-500/30 shadow-sm transition-all p-8 flex flex-col gap-6 cursor-pointer" onClick={() => navigate(`/dashboard/departments/${resolveDeptId(dept)}`)}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-panel">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-content group-hover:text-indigo-400 transition-colors">{dept.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-[10px] border-panel-hover text-content-muted">{dept.code}</Badge>
                      <span className="text-[10px] text-slate-600 uppercase font-black">Created {dept.createdAt}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-panel-hover" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-5 w-5 text-content-muted" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-app border-panel min-w-[160px]">
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setEditingDept(dept); setIsModalOpen(true); }}
                      className="flex items-center gap-2 hover:bg-panel-hover font-bold py-3 text-indigo-400 cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleDelete(resolveDeptId(dept)); }}
                      className="flex items-center gap-2 hover:bg-red-500/10 font-bold py-3 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Purge Entity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-content-muted leading-relaxed line-clamp-2 italic">
                "{dept.description || 'No description provided for this academic entity.'}"
              </p>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-panel">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-content-muted group-hover:text-indigo-400 transition-colors">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-bold">{analyticsMap[resolveDeptId(dept)]?.students || 0} Students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-content-muted group-hover:text-indigo-400 transition-colors">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-bold">{analyticsMap[resolveDeptId(dept)]?.courses || 0} Courses</span>
                  </div>
                </div>

                <div className="flex items-center text-indigo-400 font-bold text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Explore <ChevronRight className="h-4 w-4 ms-1" />
                </div>
              </div>
            </div>
          )))}
      </div>

      <DepartmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        department={editingDept}
        onSave={handleSave}
      />
        </TabsContent>
      </Tabs>
    </div>
  );
}
