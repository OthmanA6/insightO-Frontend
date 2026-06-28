import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import { getTaskSubmissions } from '@/shared/api/taskSubmissionApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import { BookOpen, Loader2, ArrowRight, Clock, Building2, Target, CheckCircle2, LayoutDashboard, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { EntityInsightsView } from '@/components/EntityInsightsView';

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allCourses, allTasks] = await Promise.all([
          courseApi.getCourses(),
          taskApi.getTasks(),
        ]);

        const instructorCourses = allCourses.filter(c => {
          const instId = typeof c.instructorId === 'object' ? (c.instructorId as any)._id || (c.instructorId as any).id : c.instructorId;
          return instId === user?.id || instId === user?._id;
        });
        setCourses(instructorCourses);

        const instructorCourseIds = instructorCourses.map(c => c.id || c._id);
        const instructorTasks = allTasks.filter(t => t.target?.course_id && instructorCourseIds.includes(t.target.course_id));
        setTasks(instructorTasks);

        const submissionsPromises = instructorTasks.map(t => getTaskSubmissions(t.id || t._id as string));
        const submissionsArrays = await Promise.all(submissionsPromises);
        setSubmissions(submissionsArrays.flat());

      } catch (error) {
        console.error('Failed to load instructor data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General Assignment';
    const course = courses.find(c => (c._id || c.id) === courseId);
    return course ? course.name : 'Unknown Course';
  };

  // Metrics Calculation
  const { totalTasks, urgentTasks, pendingReviews } = useMemo(() => {
    const pending = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'AI_GRADED');
    
    const urgent = tasks.filter(t => {
      if (!t.deadline) return false;
      const diffDays = (new Date(t.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 3;
    });

    return {
      totalTasks: tasks.length,
      urgentTasks: urgent.length,
      pendingReviews: pending.length
    };
  }, [submissions, tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4);
  }, [tasks]);

  const submissionsByTaskId = useMemo(() => {
    const map = new Map();
    submissions.forEach(s => {
      const taskId = typeof s.task_id === 'object' ? (s.task_id as any)._id || (s.task_id as any).id : s.task_id;
      if (!map.has(taskId)) map.set(taskId, []);
      map.get(taskId).push(s);
    });
    return map;
  }, [submissions]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Syncing Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] space-y-10">

      {/* Header & Metrics */}
      <section className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Welcome back, Professor {user?.lastName || user?.firstName || 'Instructor'}.
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-[border-color,background-color] duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted">Total Courses</span>
            <span className="text-3xl font-black text-content">{courses.length}</span>
          </div>
          <div className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-[border-color,background-color] duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted">Total Tasks</span>
            <span className="text-3xl font-black text-content">{totalTasks}</span>
          </div>
          <div className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-[border-color,background-color] duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted">Urgent Tasks</span>
            <span className="text-3xl font-black text-rose-500">{urgentTasks}</span>
          </div>
          <div className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-[border-color,background-color] duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted">Tasks Left (Pending)</span>
            <span className="text-3xl font-black text-amber-500">{pendingReviews}</span>
          </div>
        </div>
      </section>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="bg-indigo-950/20 backdrop-blur-md border border-panel-hover p-1 mb-8 flex w-fit rounded-2xl shadow-xl">
          <TabsTrigger value="courses" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-sm font-bold transition-all">
            My Courses & Tasks
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-sm font-bold transition-all">
            Course Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-0 outline-none space-y-8">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id || course._id} className="rounded-[2.5rem] overflow-hidden border border-panel-hover bg-app shadow-2xl relative">
                <div className="absolute top-6 right-8 z-10">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                    {course.courseCode}
                  </span>
                </div>
                <EntityInsightsView entityType="COURSE" entityId={course.id || course._id as string} />
              </div>
            ))
          ) : (
            <div className="rounded-[2.5rem] overflow-hidden border border-panel-hover bg-app shadow-2xl relative p-12 text-center flex flex-col items-center gap-4">
              <BookOpen className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No courses available to show insights.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-0 outline-none space-y-8">
          {/* Middle Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column - Recent Modules (50%) */}
            <section className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Recent Modules
                </h2>
                <Link to="/dashboard/courses" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  Manage Modules <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {courses.slice(0, 3).map(course => (
                  <Link
                    to={`/dashboard/courses`}
                    key={course.id || course._id}
                    className="group p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-[border-color,background-color] duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="absolute top-0 end-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                      <BookOpen className="h-24 w-24 text-content" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 block">{course.courseCode}</span>
                      <h3 className="text-lg font-bold text-content leading-tight">{course.name}</h3>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-content-muted mt-4">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                        <span className="text-[10px]">👥</span>
                      </div>
                      {course.enrolledStudents?.length || 0} Students Enrolled
                    </div>
                  </Link>
                ))}

                {courses.length === 0 && (
                  <div className="p-12 text-center rounded-3xl border border-border border-dashed flex flex-col items-center gap-4">
                    <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">You have not been assigned any modules yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Column - Active Task Feed (70%) */}
            <section className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Target className="h-5 w-5" /> Active Task Feed
                </h2>
              </div>

              <div className="space-y-4">
                {recentTasks.map(task => {
                  const taskSubmissions: TaskSubmission[] = submissionsByTaskId.get(task.id || task._id) || [];
                  const pending = taskSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'AI_GRADED').length;
                  const courseId = task.target?.course_id;

                  return (
                    <div key={task.id || task._id} className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-[border-color,background-color] duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                          </div>
                          <h3 className="text-base font-bold text-content">{task.title}</h3>
                        </div>
                        <p className="text-sm text-content-muted ps-11">{getCourseName(courseId)}</p>
                        <div className="flex flex-wrap items-center gap-2 ms-11">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-content-muted bg-panel-hover w-fit px-3 py-1.5 rounded-lg border border-panel-hover">
                            <Clock className="h-3 w-3" />
                            Due {format(new Date(task.deadline), 'MMM d')}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20">
                            {pending} Pending Reviews
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Link
                          to={`/dashboard/departments/all/courses/${courseId}/tasks/${task.id || task._id}`}
                        >
                          <Button
                            className="w-full md:w-auto h-12 px-6 rounded-xl text-xs font-bold bg-panel-hover text-content-muted hover:bg-indigo-600 hover:text-content transition-colors flex items-center gap-2 border border-panel-hover shadow-none hover:shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                          >
                            <Search className="h-4 w-4" /> View Submissions
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {recentTasks.length === 0 && (
                  <div className="p-12 text-center rounded-3xl border border-border border-dashed flex flex-col items-center gap-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                    <p className="text-sm font-medium text-muted-foreground">You don't have any active tasks right now.</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
