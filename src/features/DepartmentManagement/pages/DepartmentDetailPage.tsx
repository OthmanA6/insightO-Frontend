import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, BookOpen, Plus, Search, MoreVertical, Trash2,
  Users, GraduationCap, Clock, ChevronRight, Loader2, Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';
import { CourseModal } from '../components/CourseModal';
import * as departmentApi from '@/shared/api/departmentApi';
import * as courseApi from '@/shared/api/courseApi';
import * as userAdminApi from '@/shared/api/userAdminApi';
import type { Department } from '@/shared/api/departmentApi';
import type { Course, CreateCoursePayload } from '@/shared/api/courseApi';
import type { AdminUser } from '@/shared/api/userAdminApi';

/** Helper to handle populated MongoDB fields (_id or id) */
const getSafeId = (val: any) => (typeof val === 'object' && val !== null ? val._id || val.id : val);

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  useEffect(() => {
    // ── Guard: prevent API calls with invalid/undefined departmentId ──
    if (!departmentId || departmentId === 'undefined') {
      toast.error('Invalid department ID');
      navigate('/dashboard/departments');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dept, allCourses, allUsers] = await Promise.all([
          departmentApi.getDepartment(departmentId),
          courseApi.getCourses(),
          userAdminApi.getAllUsers(),
        ]);
        setDepartment(dept);
        setUsers(allUsers);
        // Filter courses belonging to this department
        // Handle populated references: departmentId may be an object { _id, name } or a plain string
        const deptCourses = allCourses.filter((c: any) => {
          const raw = c.departmentId ?? c.department_id;
          const cDeptId =
            typeof raw === 'object' && raw !== null
              ? raw._id || raw.id
              : raw;
          return cDeptId === departmentId;
        });
        setCourses(deptCourses);
      } catch (error) {
        toast.error('Failed to load department data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [departmentId, navigate]);

  const studentsCount = useMemo(
    () =>
      users.filter(
        (u: any) => u.role === 'STUDENT' && getSafeId(u.profile?.data?.departmentId) === departmentId,
      ),
    [users, departmentId],
  );

  const instructorsCount = useMemo(
    () =>
      users.filter(
        (u: any) => u.role === 'INSTRUCTOR' && getSafeId(u.profile?.data?.departmentId) === departmentId,
      ),
    [users, departmentId],
  );

  const hodUser = useMemo(
    () =>
      users.find(
        (u: any) => u.role === 'HOD' && getSafeId(u.profile?.data?.departmentId) === departmentId,
      ),
    [users, departmentId],
  );

  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [courses, searchQuery]);

  const handleDeleteCourse = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this course? All linked tasks and submissions will be affected.',
      )
    ) {
      try {
        await courseApi.deleteCourse(id);
        toast.success('Course removed from system');
        setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
      } catch (error) {
        toast.error('Delete operation failed');
      }
    }
  };

  const handleSaveCourse = async (payload: CreateCoursePayload, studentIds?: string[]) => {
    try {
      const newCourse = await courseApi.createCourse(payload);
      // Enroll students if any were selected
      const courseId = (newCourse as any)._id || newCourse.id;
      if (studentIds && studentIds.length > 0 && courseId) {
        try {
          await courseApi.enrollStudents(courseId, studentIds);
          toast.success(`Course created & ${studentIds.length} student(s) enrolled`);
        } catch {
          toast.success('Course created, but student enrollment failed');
        }
      } else {
        toast.success('Course created successfully');
      }
      setCourses((prev) => [...prev, newCourse]);
      setIsCourseModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <BreadcrumbNav
        items={[
          { label: department?.name || 'Loading...', href: undefined },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-500" />
            {department?.name || 'Department'}
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
            {department?.code || ''} · Courses & Programs
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-xl border-white/10 hover:bg-white/5 text-slate-300 font-bold"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => setIsCourseModalOpen(true)}
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Department Info Card */}
      {department && (
        <div className="p-6 rounded-3xl bg-[#1e1b2e] border border-white/5 shadow-2xl">
          <p className="text-sm text-slate-400 leading-relaxed italic">
            "{department.description || 'No description provided for this academic entity.'}"
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-indigo-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-600 uppercase">Courses</span>
                <span className="text-sm font-bold text-slate-200">{courses.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-600 uppercase">Students</span>
                <span className="text-sm font-bold text-slate-200">{studentsCount.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-600 uppercase">Instructors</span>
                <span className="text-sm font-bold text-slate-200">{instructorsCount.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-600 uppercase">Created</span>
                <span className="text-sm font-bold text-slate-200">
                  {department.createdAt
                    ? new Date(department.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20">
                {hodUser ? `${hodUser.firstName.charAt(0)}${hodUser.lastName.charAt(0)}` : '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Head of Department</span>
                <span className="text-sm font-bold text-slate-200">
                  {hodUser ? `${hodUser.firstName} ${hodUser.lastName}` : 'Not Appointed'}
                </span>
              </div>
            </div>
            <div className="hidden md:block">
               <Badge variant="outline" className="border-white/5 text-slate-500 text-[10px] uppercase font-bold">
                 Sync Status: {isLoading ? 'Updating...' : 'Live'}
               </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#1e1b2e] p-4 rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-full lg:w-96 relative group">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by name or code..."
            className="h-12 rounded-2xl bg-[#0f111a] border-white/5 text-white pl-12 pr-4 font-bold"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <Button
            variant="ghost"
            className="text-slate-400 font-bold hover:text-white hover:bg-white/5"
          >
            <Filter className="mr-2 h-4 w-4" /> All
          </Button>
          <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Courses: {filteredCourses.length}
          </p>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Loading Courses...
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-20">
            <BookOpen className="h-16 w-16 text-slate-500" />
            <p className="text-lg font-bold text-slate-500">
              No courses found in this department
            </p>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const courseId = course._id || course.id;
            return (
              <div
                key={courseId}
                className="group relative rounded-3xl bg-[#1e1b2e] border border-white/5 hover:border-indigo-500/30 shadow-2xl transition-all p-8 flex flex-col gap-6 cursor-pointer"
                onClick={() =>
                  navigate(
                    `/dashboard/departments/${departmentId}/courses/${courseId}`,
                  )
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-white/5">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-white/10 text-slate-500 uppercase"
                        >
                          {course.courseCode}
                        </Badge>
                        {course.credits && (
                          <span className="text-[10px] text-slate-600 uppercase font-black">
                            {course.credits} Credits
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-[10px] uppercase font-black flex items-center gap-1',
                            course.isActive !== false
                              ? 'text-emerald-500'
                              : 'text-red-500',
                          )}
                        >
                          {course.isActive !== false ? '● Active' : '● Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-10 w-10 p-0 rounded-xl hover:bg-white/5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-5 w-5 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#0a0a0f] border-white/5 min-w-[160px]"
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(courseId);
                        }}
                        className="flex items-center gap-2 hover:bg-red-500/10 font-bold py-3 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" /> Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 italic">
                  "{course.description || 'No description provided for this course.'}"
                </p>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-indigo-400">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase">
                        Instructor
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {(() => {
                          const inst = course.instructorId as any;
                          return inst && typeof inst === 'object'
                            ? `${inst.firstName} ${inst.lastName}`
                            : 'Not assigned';
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase">
                        Enrolled
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {
                          users.filter((u) => {
                            if (u.role !== 'STUDENT') return false;
                            const enrolledIds = u.profile?.data?.enrolledCourses?.map(getSafeId) || [];
                            return enrolledIds.includes(courseId);
                          }).length
                        }{' '}
                        Students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    className="h-10 px-4 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest group/btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/dashboard/departments/${departmentId}/courses/${courseId}`,
                      );
                    }}
                  >
                    View Tasks{' '}
                    <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Course Creation Modal */}
      <CourseModal
        open={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        departmentId={departmentId!}
        onSave={handleSaveCourse}
      />
    </div>
  );
}
