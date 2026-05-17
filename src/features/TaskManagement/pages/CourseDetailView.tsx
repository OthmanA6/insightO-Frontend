import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import { Loader2, ArrowLeft, ClipboardList, Clock, ArrowRight, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { SubmitTaskModal } from '@/features/TaskManagement/components/SubmitTaskModal';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';

export default function CourseDetailView() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToSubmit, setTaskToSubmit] = useState<string | null>(null);

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
      <section className="relative overflow-hidden rounded-3xl bg-indigo-950/10 backdrop-blur-md border border-white/10 p-8 md:p-12 shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Building2 className="h-48 w-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 w-fit px-3 py-1 rounded-lg border border-indigo-500/30">
              {course?.courseCode}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-200 tracking-tight">{course?.name}</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-slate-200">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <User className="h-3 w-3 text-indigo-400" />
              </div>
              {instructorName}
            </div>
            {course?.credits && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-slate-200">
                <span className="font-bold text-indigo-400">{course?.credits}</span> Credits
              </div>
            )}
          </div>

          {course?.description && (
            <p className="max-w-3xl text-sm leading-relaxed text-slate-400 mt-2">
              {course?.description}
            </p>
          )}
        </div>
      </section>

      {/* Tasks Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-200 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            Active Course Tasks
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            {tasks.length} Assignments
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-white/10 bg-indigo-950/10 backdrop-blur-md flex flex-col items-center gap-4">
            <ClipboardList className="h-12 w-12 text-slate-500/50" />
            <p className="text-slate-400 font-medium">No active tasks assigned to this course right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div key={task.id || task._id} className="group p-6 bg-indigo-950/10 backdrop-blur-md border border-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-black tracking-tight text-slate-200 leading-tight">{task.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20">
                    <Clock className="h-3.5 w-3.5" />
                    Due {format(new Date(task.deadline), 'MMM d, h:mm a')}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <Button 
                    onClick={() => setTaskToSubmit(task.id || task._id || '')}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors"
                  >
                    Submit Assignment <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
