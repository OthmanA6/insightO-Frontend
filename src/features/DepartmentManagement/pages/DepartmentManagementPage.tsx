import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plus, Search, MoreVertical, Edit3, Trash2, 
  Users, UserCheck, BarChart3, ChevronRight, 
  Download, Filter, ArrowUpRight, Loader2
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
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { DepartmentModal } from '../components/DepartmentModal';
import type { Department, CreateDepartmentPayload } from '../types/department.types';

/** Safely resolve a department ID from either MongoDB's _id or the normalized id field. */
const resolveDeptId = (dept: Department): string => (dept as any)._id || dept.id;

import * as departmentApi from '@/shared/api/departmentApi';
import { useEffect } from 'react';

export default function DepartmentManagementPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await departmentApi.getAllDepartments();
      setDepartments(data);
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
          <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-500" />
            Departments
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Institutional Infrastructure</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 hover:bg-white/5 text-slate-300 font-bold">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
          <Button 
            onClick={() => { setEditingDept(null); setIsModalOpen(true); }}
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Department
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Academic Entities', value: departments.length, icon: Building2, color: 'text-indigo-400' },
          { label: 'Total Enrollment', value: '770', icon: Users, color: 'text-emerald-400' },
          { label: 'Faculty Active', value: '42', icon: UserCheck, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-[#1e1b2e] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-white/10 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-3xl font-black text-white mt-1">{stat.value}</h4>
            </div>
            <div className={cn("p-4 rounded-2xl bg-white/5", stat.color)}>
              <stat.icon className="h-7 w-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#1e1b2e] p-4 rounded-3xl border border-white/5">
        <div className="w-full lg:w-96 relative group">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or code..."
            className="h-12 rounded-2xl bg-[#0f111a] border-white/5 text-white pl-12 pr-4 font-bold"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
           <Button variant="ghost" className="text-slate-400 font-bold hover:text-white hover:bg-white/5">
              <Filter className="mr-2 h-4 w-4" /> Filters
           </Button>
           <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block"></div>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total: {filteredDepts.length}</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Department Data...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-20">
            <Building2 className="h-16 w-16 text-slate-500" />
            <p className="text-lg font-bold text-slate-500">No departments found matching your criteria</p>
          </div>
        ) : (
          filteredDepts.map((dept) => (
          <div key={resolveDeptId(dept)} className="group relative rounded-3xl bg-[#1e1b2e] border border-white/5 hover:border-indigo-500/30 shadow-2xl transition-all p-8 flex flex-col gap-6 cursor-pointer" onClick={() => navigate(`/dashboard/departments/${resolveDeptId(dept)}`)}>
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-white/5">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">{dept.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-[10px] border-white/10 text-slate-500">{dept.code}</Badge>
                    <span className="text-[10px] text-slate-600 uppercase font-black">Created {dept.createdAt}</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-5 w-5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-white/5 min-w-[160px]">
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); setEditingDept(dept); setIsModalOpen(true); }}
                    className="flex items-center gap-2 hover:bg-white/5 font-bold py-3 text-indigo-400 cursor-pointer"
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

            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 italic">
              "{dept.description || 'No description provided for this academic entity.'}"
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Students</span>
                <span className="text-lg font-black text-white">{dept.stats?.studentCount}</span>
              </div>
              <div className="flex flex-col gap-1 text-center border-x border-white/5">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Faculty</span>
                <span className="text-lg font-black text-white">{dept.stats?.instructorCount}</span>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Surveys</span>
                <span className="text-lg font-black text-indigo-500">{dept.stats?.activeSurveys}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {dept.hodName?.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter leading-none">Head of Dept</span>
                  <span className="text-[11px] font-bold text-slate-300">{dept.hodName || 'Not Appointed'}</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                className="h-10 px-4 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest group/btn"
                onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/departments/${resolveDeptId(dept)}`); }}
              >
                View Courses <ArrowUpRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </Button>
            </div>
          </div>
        ) ) )}
      </div>

      <DepartmentModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        department={editingDept}
        onSave={handleSave}
      />
    </div>
  );
}
