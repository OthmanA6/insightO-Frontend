import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import { getMySubmissions } from '@/shared/api/taskSubmissionApi';
import { getAllForms } from '@/features/FormBuilder/api/formApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import { BookOpen, Loader2, ArrowRight, Clock, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { SubmitTaskModal } from '@/features/TaskManagement/components/SubmitTaskModal';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [assignedSurveys, setAssignedSurveys] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToSubmit, setTaskToSubmit] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursesData, tasksData, submissionsData, allForms] = await Promise.all([
          courseApi.getCourses(),
          taskApi.getTasks(),
          getMySubmissions(),
          getAllForms()
        ]);
        setCourses(coursesData);
        setTasks(tasksData.filter(t => t.status === 'ACTIVE'));
        setSubmissions(submissionsData);
        
        // Filter forms that are active, assigned to STUDENT, and match department
        const studentForms = allForms.filter(f => {
          const isStudentForm = f.is_active && f.evaluator_roles?.includes('STUDENT');
          if (!isStudentForm) return false;
          
          if (f.department_id) {
            const formDeptId = typeof f.department_id === 'object' ? (f.department_id as any)._id || (f.department_id as any).id : f.department_id;
            const userDeptId = typeof user?.departmentId === 'object' ? (user.departmentId as any)._id || (user.departmentId as any).id : user?.departmentId;
            return formDeptId === userDeptId;
          }
          
          return true; // No department assigned means it's a general survey
        });
        setAssignedSurveys(studentForms.length);
      } catch (error) {
        console.error('Failed to load student data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General Assignment';
    const course = courses.find(c => (c._id || c.id) === courseId);
    return course ? course.name : 'Unknown Course';
  };


  // Metrics Calculation
  const finalizedSubmissions = submissions.filter(s => s.status === 'FINALIZED' && s.final_grade !== undefined);
  const averageGrade = finalizedSubmissions.length > 0
    ? finalizedSubmissions.reduce((acc, sub) => acc + (sub.final_grade || 0), 0) / finalizedSubmissions.length
    : 0;

  const isExpired = (deadline: string) => deadline ? new Date(deadline) < new Date() : false;

  const submittedTaskIds = submissions.map(s => s.task_id ? (typeof s.task_id === 'object' ? ((s.task_id as any)._id || (s.task_id as any).id) : s.task_id) : null).filter(Boolean);
  const pendingTasks = tasks.filter(t => !submittedTaskIds.includes(t.id || t._id));

  // Sorting for urgency - only include tasks that haven't expired
  const urgentTasks = pendingTasks
    .filter(t => !isExpired(t.deadline))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Syncing Dashboard...</span>
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
            Welcome back, {user?.firstName || 'Student'}.
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link to="/dashboard/courses-tasks" className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 hover:bg-indigo-950/20 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2 cursor-pointer group">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted group-hover:text-content transition-colors">Total Courses</span>
            <span className="text-3xl font-black text-content">{courses.length}</span>
          </Link>
          <Link to="/dashboard/student-surveys" className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 hover:bg-indigo-950/20 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2 cursor-pointer group">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted group-hover:text-content transition-colors">Assigned Surveys</span>
            <span className="text-3xl font-black text-purple-500">{assignedSurveys}</span>
          </Link>
          <Link to="/dashboard/courses-tasks" className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 hover:bg-indigo-950/20 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2 cursor-pointer group">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted group-hover:text-content transition-colors">Pending Tasks</span>
            <span className="text-3xl font-black text-amber-500">{pendingTasks.filter(t => !isExpired(t.deadline)).length}</span>
          </Link>
          <Link to="/dashboard/student-evaluations" className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 hover:bg-indigo-950/20 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2 cursor-pointer group">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted group-hover:text-content transition-colors">Completed Tasks</span>
            <span className="text-3xl font-black text-emerald-500">{submissions.length}</span>
          </Link>
          <div className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-content-muted">Average Grade</span>
            <span className="text-3xl font-black text-blue-500">{averageGrade.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* Middle Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Urgent Tasks (Left Column - 60%) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Urgent Tasks
            </h2>
            <Link to="/dashboard/courses-tasks" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {urgentTasks.map(task => (
              <div key={task.id || task._id} className="p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-content">{task.title}</h3>
                  </div>
                  <p className="text-sm text-content-muted ps-11">{getCourseName(task.target?.course_id)}</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20 ms-11">
                    <Clock className="h-3 w-3" />
                    Due {format(new Date(task.deadline), 'MMM d, h:mm a')}
                  </div>
                </div>
                <div className="shrink-0">
                  <Button 
                    onClick={() => {
                      const taskId = task.id || task._id || '';
                      if (task.task_type === 'QUIZ') {
                        navigate(`/dashboard/submit-quiz/${taskId}`);
                      } else {
                        setTaskToSubmit(taskId);
                      }
                    }}
                    className="w-full md:w-auto h-12 px-6 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2 border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                    Submit Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
            
            {urgentTasks.length === 0 && (
              <div className="p-12 text-center rounded-3xl border border-border border-dashed flex flex-col items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                <p className="text-sm font-medium text-muted-foreground">You are completely caught up on your assignments!</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Courses (Right Column - 40%) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Recent Courses
            </h2>
            <Link to="/dashboard/courses-tasks" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View Directory <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {courses.slice(0, 3).map(course => {
              const inst = course.instructorId as any;
              const instructorName = inst?.firstName ? `${inst.firstName} ${inst.lastName}` : 'Unassigned Instructor';
              
              return (
                <Link 
                  to={`/dashboard/student-courses/${course.id || course._id}`} 
                  key={course.id || course._id} 
                  className="group p-6 bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                >
                  <div className="absolute top-0 end-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Building2 className="h-24 w-24 text-content" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 block">{course.courseCode}</span>
                    <h3 className="text-lg font-bold text-content leading-tight">{course.name}</h3>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-content-muted mt-4">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                      <span className="text-[10px]">🎓</span>
                    </div>
                    {instructorName}
                  </div>
                </Link>
              );
            })}
            
            {courses.length === 0 && (
              <div className="p-12 text-center rounded-3xl border border-border border-dashed flex flex-col items-center gap-4">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">You are not enrolled in any courses.</p>
              </div>
            )}
          </div>
        </section>

      </div>

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
