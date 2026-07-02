import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import { Loader2, ArrowLeft, ClipboardList, Clock, ArrowRight, Building2, User, Ban, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { SubmitTaskModal } from '@/features/TaskManagement/components/SubmitTaskModal';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';

export default function CourseDetailView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToSubmit, setTaskToSubmit] = useState<string | null>(null);

  const getFullUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}/${cleanUrl}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const [courseData, allTasks] = await Promise.all([
          courseApi.getCourseById(courseId),
          taskApi.getTasks()
        ]);
        setCourse(courseData);
        // Filter tasks to only show active tasks for this specific course
        const courseTasks = allTasks.filter(
          t => t.status === 'ACTIVE' && t.target?.course_id === courseId
        );
        setTasks(courseTasks);
      } catch (error) {
        console.error('Failed to load course details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const isExpired = (deadline: string) => deadline ? new Date(deadline) < new Date() : false;

  const handleSubmitTask = (task: Task) => {
    if (isExpired(task.deadline)) {
      toast.error('Deadline Passed', { description: 'The deadline for this assignment has expired. Submissions are no longer accepted.' });
      return;
    }
    const taskId = task.id || task._id || '';
    if (task.task_type === 'QUIZ') {
      navigate(`/dashboard/submit-quiz/${taskId}`);
    } else {
      setTaskToSubmit(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Course Module...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background gap-4">
        <h2 className="text-xl font-bold text-foreground">Course Not Found</h2>
        <Link to="/dashboard" className="text-primary hover:text-primary/80 text-sm font-bold flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const inst = course?.instructorId as any;
  const instructorName = inst?.firstName ? `${inst?.firstName} ${inst?.lastName}` : 'Unassigned Instructor';

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <BreadcrumbNav 
          homeItem={{ label: 'Overview', href: '/dashboard' }}
          items={[
            { label: 'My Courses', href: '/dashboard/courses-tasks' },
            { label: course?.name || 'Course Details' }
          ]} 
        />
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-950/10 backdrop-blur-md border border-panel-hover p-8 md:p-12 shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
        <div className="absolute top-0 end-0 p-8 opacity-10">
          <Building2 className="h-48 w-48 text-content" />
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 w-fit px-3 py-1 rounded-lg border border-indigo-500/30">
              {course?.courseCode}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-content tracking-tight">{course?.name}</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-content-muted">
            <div className="flex items-center gap-2 bg-panel-hover px-4 py-2 rounded-xl border border-panel-hover text-content">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <User className="h-3 w-3 text-indigo-400" />
              </div>
              {instructorName}
            </div>
            {course?.credits && (
              <div className="flex items-center gap-2 bg-panel-hover px-4 py-2 rounded-xl border border-panel-hover text-content">
                <span className="font-bold text-indigo-400">{course?.credits}</span> Credits
              </div>
            )}
          </div>

          {course?.description && (
            <p className="max-w-3xl text-sm leading-relaxed text-content-muted mt-2">
              {course?.description}
            </p>
          )}
        </div>
      </section>

      {/* Tasks Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-content flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            Active Course Tasks
          </h2>
          <span className="text-xs font-bold text-content-muted bg-panel-hover px-3 py-1.5 rounded-full border border-panel-hover">
            {tasks.length} Assignments
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-panel-hover bg-indigo-950/10 backdrop-blur-md flex flex-col items-center gap-4">
            <ClipboardList className="h-12 w-12 text-content-muted/50" />
            <p className="text-content-muted font-medium">No active tasks assigned to this course right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => {
              const expired = isExpired(task.deadline);
              return (
              <div key={task.id || task._id} className={`group p-6 bg-indigo-950/10 backdrop-blur-md border transition-all duration-300 shadow-xl rounded-3xl relative overflow-hidden flex flex-col justify-between ${
                expired
                  ? 'border-panel-hover opacity-60'
                  : 'border-panel-hover hover:border-indigo-500/30 hover:shadow-indigo-500/10'
              }`}>
                <div className="space-y-4">
                  <h3 className="text-lg font-black tracking-tight text-content leading-tight">{task.title}</h3>
                  <p className="text-sm text-content-muted line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                  
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-panel-hover/50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">Attachments</p>
                      <div className="flex flex-col gap-2">
                        {task.attachments.map((att: any, idx: number) => (
                          <a 
                            key={idx} 
                            href={getFullUrl(att.url)} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/20 border border-panel-hover hover:border-indigo-500/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0"/>
                              <span className="text-xs font-medium text-content-muted group-hover:text-content truncate">{att.fileName || `File ${idx + 1}`}</span>
                            </div>
                            <Download className="h-3 w-3 text-content-muted group-hover:text-indigo-400 transition-colors shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center gap-2 text-xs font-bold w-fit px-3 py-1.5 rounded-lg border mt-2 ${
                    expired
                      ? 'text-red-400 bg-red-500/10 border-red-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    {expired ? 'Deadline Passed — ' : 'Due '}{format(new Date(task.deadline), 'MMM d, h:mm a')}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-panel-hover">
                  {expired ? (
                    <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-panel border border-panel-hover text-content-muted text-sm cursor-not-allowed">
                      <Ban className="h-4 w-4" /> Expired
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSubmitTask(task)}
                      className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors"
                    >
                      Submit Assignment <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {taskToSubmit && (
        <SubmitTaskModal 
          taskId={taskToSubmit}
          open={!!taskToSubmit}
          onClose={() => setTaskToSubmit(null)}
          onSuccess={() => {
            // Re-fetch tasks after submission to potentially update status if needed
            taskApi.getTasks().then(allTasks => {
              const courseTasks = allTasks.filter(
                t => t.status === 'ACTIVE' && t.target?.course_id === courseId
              );
              setTasks(courseTasks);
            });
          }}
        />
      )}
    </div>
  );
}
