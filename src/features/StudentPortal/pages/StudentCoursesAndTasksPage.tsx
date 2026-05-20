import { useState, useEffect } from 'react';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import { getMySubmissions } from '@/shared/api/taskSubmissionApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import { BookOpen, Loader2, ArrowRight, Clock, Building2, CheckCircle2, Search, LayoutGrid, List as ListIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { SubmitTaskModal } from '@/features/TaskManagement/components/SubmitTaskModal';

type ViewMode = 'GRID' | 'LIST';
type TaskFilter = 'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED';

export default function StudentCoursesAndTasksPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToSubmit, setTaskToSubmit] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursesData, tasksData, submissionsData] = await Promise.all([
          courseApi.getCourses(),
          taskApi.getTasks(),
          getMySubmissions()
        ]);
        setCourses(coursesData);
        setTasks(tasksData.filter(t => t.status === 'ACTIVE'));
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Failed to load student data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCourseName = (courseId?: any) => {
    if (!courseId) return 'General Assignment';
    const idString = courseId._id || courseId.id || courseId;
    const course = courses.find(c => (c._id || c.id) === idString);
    return course ? course.name : 'Unknown Course';
  };


  // Compute Task States
  const submittedTaskIds = submissions.map(s => s.task_id ? (typeof s.task_id === 'object' ? ((s.task_id as any)._id || (s.task_id as any).id) : s.task_id) : null).filter(Boolean);
  const gradedTaskIds = submissions.filter(s => s.status === 'FINALIZED').map(s => s.task_id ? (typeof s.task_id === 'object' ? ((s.task_id as any)._id || (s.task_id as any).id) : s.task_id) : null).filter(Boolean);

  // Filters
  const filteredCourses = courses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const filteredTasks = tasks.filter(t => {
    const id = t.id || t._id;
    const matchesSearch = (t.title?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (taskFilter === 'ALL') return true;
    if (taskFilter === 'PENDING') return !submittedTaskIds.includes(id);
    if (taskFilter === 'SUBMITTED') return submittedTaskIds.includes(id) && !gradedTaskIds.includes(id);
    if (taskFilter === 'GRADED') return gradedTaskIds.includes(id);
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Directory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] space-y-8">
      
      <Tabs defaultValue="courses" className="w-full">
        {/* TOP SEGMENTED CONTROL & HEADER ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Academic Directory
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Manage your enrolled modules and complete pending assignments.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shrink-0">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'GRID' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'LIST' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>

            <TabsList className="bg-indigo-950/20 backdrop-blur-md border border-white/10 p-1 rounded-xl h-auto shrink-0 shadow-inner">
              <TabsTrigger value="courses" className="rounded-lg px-6 py-2.5 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400 transition-all">
                My Courses
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg px-6 py-2.5 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400 transition-all">
                Task Center
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* SEARCH & FILTERS ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name, code, or title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-12 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <TabsContent value="tasks" className="m-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {['ALL', 'PENDING', 'SUBMITTED', 'GRADED'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter as TaskFilter)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all border shrink-0 ${
                    taskFilter === filter 
                      ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </TabsContent>
        </div>

        {/* COURSES TAB */}
        <TabsContent value="courses" className="outline-none m-0">
          {filteredCourses.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-border bg-card flex flex-col items-center gap-4">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No courses found matching your criteria.</p>
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map(course => {
                const inst = course.instructorId as any;
                const instructorName = inst?.firstName ? `${inst.firstName} ${inst.lastName}` : 'Unassigned Instructor';
                
                return (
                  <Link 
                    to={`/dashboard/student-courses/${course.id || course._id}`} 
                    key={course.id || course._id} 
                    className="group p-6 bg-indigo-950/10 backdrop-blur-md border border-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                      <Building2 className="h-24 w-24 text-white" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{course?.courseCode}</span>
                        <h3 className="text-lg font-black tracking-tight text-slate-200 leading-tight">{course?.name}</h3>
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                          <span className="text-[8px]">🎓</span>
                        </div>
                        {instructorName}
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-[#0f111a] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-card/50 text-xs uppercase tracking-wider font-black text-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Course Details</th>
                      <th className="px-6 py-4">Instructor</th>
                      <th className="px-6 py-4">Credits</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCourses.map(course => {
                      const inst = course.instructorId as any;
                      const instructorName = inst?.firstName ? `${inst.firstName} ${inst.lastName}` : 'Unassigned Instructor';
                      return (
                        <tr key={course.id || course._id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">{course.courseCode}</div>
                                <div className="font-bold text-foreground group-hover:text-primary transition-colors">{course.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">{instructorName}</td>
                          <td className="px-6 py-4 font-medium">{course.credits || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              to={`/dashboard/student-courses/${course.id || course._id}`}
                              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-card border border-border text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                            >
                              View Portal
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="outline-none m-0">
          {filteredTasks.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-border bg-card flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No tasks found matching your criteria.</p>
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => {
                const taskId = task.id || task._id;
                const isPending = !submittedTaskIds.includes(taskId);
                const isGraded = gradedTaskIds.includes(taskId);
                const isSubmitted = submittedTaskIds.includes(taskId) && !isGraded;

                return (
                  <div key={taskId} className="p-6 bg-indigo-950/10 backdrop-blur-md border border-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col justify-between min-h-[180px] relative overflow-hidden group">
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black tracking-tight text-slate-200 leading-snug">{task.title}</h3>
                      </div>
                      <p className="text-xs font-medium text-slate-400 truncate border-l-2 border-indigo-500/50 pl-2 py-0.5">
                        {getCourseName(task.target?.course_id)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 w-fit px-2.5 py-1 rounded-md border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        Due {format(new Date(task.deadline), 'MMM d, yy')}
                      </div>
                    </div>

                    <div className="mt-6 relative z-10">
                      {isPending && (
                        <Button 
                          onClick={() => {
                            if (task.task_type === 'QUIZ') {
                              navigate(`/dashboard/submit-quiz/${taskId}`);
                            } else {
                              setTaskToSubmit(taskId || '');
                            }
                          }}
                          className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors"
                        >
                          Submit Assignment <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      )}
                      {isSubmitted && (
                        <div className="w-full h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                          <AlertCircle className="h-3.5 w-3.5 mr-2" /> Under Review
                        </div>
                      )}
                      {isGraded && (
                        <div className="w-full h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Graded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-[#0f111a] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-card/50 text-xs uppercase tracking-wider font-black text-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Assignment Task</th>
                      <th className="px-6 py-4">Course Module</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTasks.map(task => {
                      const taskId = task.id || task._id;
                      const isPending = !submittedTaskIds.includes(taskId);
                      const isGraded = gradedTaskIds.includes(taskId);
                      const isSubmitted = submittedTaskIds.includes(taskId) && !isGraded;

                      return (
                        <tr key={taskId} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4 font-bold text-foreground">{task.title}</td>
                          <td className="px-6 py-4 font-medium">{getCourseName(task.target?.course_id)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded-md text-foreground border border-border">
                              {format(new Date(task.deadline), 'MMM d, h:mm a')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isPending && <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending</span>}
                            {isSubmitted && <span className="text-[10px] font-bold uppercase text-amber-500">Under Review</span>}
                            {isGraded && <span className="text-[10px] font-bold uppercase text-emerald-500">Graded</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPending && (
                              <Button 
                                onClick={() => {
                                  if (task.task_type === 'QUIZ') {
                                    navigate(`/dashboard/submit-quiz/${taskId}`);
                                  } else {
                                    setTaskToSubmit(taskId || '');
                                  }
                                }}
                                size="sm"
                                className="h-8 rounded-lg text-[10px] px-3"
                              >
                                Submit
                              </Button>
                            )}
                            {(isSubmitted || isGraded) && (
                              <span className="text-[10px] text-muted-foreground italic">Locked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {taskToSubmit && (
        <SubmitTaskModal 
          taskId={taskToSubmit}
          open={!!taskToSubmit}
          onClose={() => setTaskToSubmit(null)}
          onSuccess={() => {
            Promise.all([taskApi.getTasks(), getMySubmissions()]).then(([tasksData, submissionsData]) => {
              setTasks(tasksData.filter(t => t.status === 'ACTIVE'));
              setSubmissions(submissionsData);
            });
          }}
        />
      )}
    </div>
  );
}
