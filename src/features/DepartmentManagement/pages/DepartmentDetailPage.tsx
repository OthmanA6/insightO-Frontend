import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, BookOpen, Plus, Search, MoreVertical, Trash2, Edit3,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { EntityInsightsView } from '@/components/EntityInsightsView';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';
import { CourseModal } from '../components/CourseModal';
import { DepartmentAnalyticsDashboard } from '../components/DepartmentAnalyticsDashboard';
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
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const fetchData = useCallback(async () => {
    if (!departmentId || departmentId === 'undefined') return;
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
  }, [departmentId]);

  useEffect(() => {
    // ── Guard: prevent API calls with invalid/undefined departmentId ──
    if (!departmentId || departmentId === 'undefined') {
      toast.error('Invalid department ID');
      navigate('/dashboard/departments');
      return;
    }
    fetchData();
  }, [departmentId, navigate, fetchData]);

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
      let savedCourse: Course;
      const isEditing = !!editingCourse;

      // Inject studentIds into the main payload so the backend handles it in one atomic transaction
      const completePayload = {
        ...payload,
        ...(studentIds !== undefined ? { studentIds } : {})
      };

      if (isEditing) {
        const courseId = getSafeId(editingCourse);
        savedCourse = await courseApi.updateCourse(courseId!, completePayload);
        toast.success('Course updated successfully');
      } else {
        savedCourse = await courseApi.createCourse(completePayload);
        toast.success('Course created successfully');
      }

      setIsCourseModalOpen(false);
      setEditingCourse(null);

      // CRITICAL: Fetch fresh data to pull counts and names (instructor & students)
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${editingCourse ? 'update' : 'create'} course`);
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
          <h2 className="text-4xl font-black tracking-tight text-content flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-500" />
            {department?.name || 'Department'}
          </h2>
          <p className="text-content-muted font-bold uppercase text-[10px] tracking-[0.3em]">
            {department?.code || ''} · Courses & Programs
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          <Button
            onClick={() => {
              setEditingCourse(null);
              setIsCourseModalOpen(true);
            }}
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-indigo-500/20 transition-[border-color,background-color] flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="management" className="w-full">
        <TabsList className="bg-panel border border-panel p-1 mb-8 flex w-fit rounded-2xl">
          <TabsTrigger value="management" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-sm font-bold transition-all">
            Courses & Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-content text-sm font-bold transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0 outline-none">
          <DepartmentAnalyticsDashboard departmentId={departmentId!} />
        </TabsContent>



        <TabsContent value="management" className="mt-0 outline-none space-y-8">
          {/* Department Info Card */}
          {department && (
            <div className="p-6 rounded-3xl bg-panel border border-panel">
              <p className="text-sm text-content-muted leading-relaxed italic">
                "{department.description || 'No description provided for this academic entity.'}"
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-panel">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-panel text-indigo-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Courses</span>
                    <span className="text-sm font-bold text-content">{courses.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-panel text-emerald-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Students</span>
                    <span className="text-sm font-bold text-content">{studentsCount.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-panel text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Created</span>
                    <span className="text-sm font-bold text-content">
                      {department.createdAt
                        ? new Date(department.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-panel flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-content shadow-indigo-500/20">
                    {hodUser ? `${hodUser.firstName.charAt(0)}${hodUser.lastName.charAt(0)}` : '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-content-muted uppercase tracking-widest">Head of Department</span>
                    <span className="text-sm font-bold text-content">
                      {hodUser ? `${hodUser.firstName} ${hodUser.lastName}` : 'Not Appointed'}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Badge variant="outline" className="border-panel text-content-muted text-[10px] uppercase font-bold">
                    Sync Status: {isLoading ? 'Updating...' : 'Live'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Control Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-panel p-4 rounded-3xl border border-panel">
            <div className="w-full lg:w-96 relative group">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by name or code..."
                className="h-12 rounded-2xl bg-app border-panel text-content ps-12 pe-4 font-bold"
              />
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <Button
                variant="ghost"
                className="text-content-muted font-bold hover:text-content hover:bg-panel"
              >
                <Filter className="me-2 h-4 w-4" /> All
              </Button>
              <div className="h-8 w-px bg-panel mx-2 hidden lg:block" />
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
                <p className="text-sm font-bold text-content-muted uppercase tracking-widest">
                  Loading Courses...
                </p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-20">
                <BookOpen className="h-16 w-16 text-content-muted" />
                <p className="text-lg font-bold text-content-muted">
                  No courses found in this department
                </p>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const courseId = course._id || course.id;
                return (
                  <div
                    key={courseId}
                    className="group relative rounded-3xl bg-panel border border-panel hover:border-indigo-500/50 transition-[border-color,background-color] p-8 flex flex-col gap-6 cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/dashboard/departments/${departmentId}/courses/${courseId}`,
                      )
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 border border-panel">
                          <BookOpen className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-content group-hover:text-indigo-400 transition-colors">
                            {course.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] border-panel-hover text-content-muted uppercase"
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
                            className="h-10 w-10 p-0 rounded-xl hover:bg-panel"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-5 w-5 text-content-muted" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-app border-panel min-w-[160px]"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCourse(course);
                              setIsCourseModalOpen(true);
                            }}
                            className="flex items-center gap-2 hover:bg-panel font-bold py-3 text-content-muted cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" /> Edit Course
                          </DropdownMenuItem>

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

                    <p className="text-sm text-content-muted leading-relaxed line-clamp-2 italic">
                      "{course.description || 'No description provided for this course.'}"
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-panel">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-panel text-indigo-400">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-600 uppercase">
                            Instructor
                          </span>
                          <span className="text-xs font-bold text-content">
                            {(() => {
                              const inst = course.instructorId as any;
                              if (inst && typeof inst === 'object') {
                                return `${inst.firstName} ${inst.lastName}`;
                              }
                              const found = users.find((u) => (u._id || u.id) === inst);
                              return found ? `${found.firstName} ${found.lastName}` : 'Not assigned';
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-panel text-purple-400">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-600 uppercase">
                            Enrolled
                          </span>
                          <span className="text-xs font-bold text-content">
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
                        <ChevronRight className="ms-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Creation Modal */}
      <CourseModal
        open={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        course={editingCourse}
        departmentId={departmentId!}
        onSave={handleSaveCourse}
      />
    </div>
  );
}
