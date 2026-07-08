import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import { getMySubmissions } from '@/shared/api/taskSubmissionApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import {
  Loader2, ArrowLeft, ClipboardList, Clock, ArrowRight,
  Building2, User, Ban, FileText, Download, CheckCircle2, AlertCircle,
  SendHorizonal
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { SubmitTaskModal } from '@/features/TaskManagement/components/SubmitTaskModal';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';
import { cn } from '@/shared/lib/utils';

export default function CourseDetailView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToSubmit, setTaskToSubmit] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'SUBMITTED' | 'GRADED'>('ALL');

  const getFullUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}/${cleanUrl}`;
  };

  const fetchData = async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const [courseData, allTasks, submissionsData] = await Promise.all([
        courseApi.getCourseById(courseId),
        taskApi.getTasks(),
        getMySubmissions(),
      ]);
      setCourse(courseData);
      const courseTasks = allTasks.filter(
        t => t.status === 'ACTIVE' && t.target?.course_id === courseId
      );
      setTasks(courseTasks);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Failed to load course details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const isExpired = (deadline: string) => deadline ? new Date(deadline) < new Date() : false;

  const handleSubmitTask = (task: Task) => {
    if (isExpired(task.deadline)) {
      toast.error('Deadline Passed', { description: 'The deadline for this assignment has expired.' });
      return;
    }
    const taskId = task.id || task._id || '';
    if (task.task_type === 'QUIZ') {
      navigate(`/dashboard/submit-quiz/${taskId}`);
    } else {
      setTaskToSubmit(taskId);
    }
  };

  // Derive submission status per task
  const submittedTaskIds = useMemo(() =>
    submissions.map(s => {
      const tid = s.task_id;
      return typeof tid === 'object' ? ((tid as any)._id || (tid as any).id) : tid;
    }).filter(Boolean),
    [submissions]
  );

  const gradedTaskIds = useMemo(() =>
    submissions
      .filter(s => s.status === 'FINALIZED')
      .map(s => {
        const tid = s.task_id;
        return typeof tid === 'object' ? ((tid as any)._id || (tid as any).id) : tid;
      }).filter(Boolean),
    [submissions]
  );

  // Categorise tasks
  const openTasks = useMemo(() =>
    tasks.filter(t => !submittedTaskIds.includes(t.id || t._id)),
    [tasks, submittedTaskIds]
  );

  const submittedTasks = useMemo(() =>
    tasks.filter(t => submittedTaskIds.includes(t.id || t._id) && !gradedTaskIds.includes(t.id || t._id)),
    [tasks, submittedTaskIds, gradedTaskIds]
  );

  const gradedTasks = useMemo(() =>
    tasks.filter(t => gradedTaskIds.includes(t.id || t._id)),
    [tasks, gradedTaskIds]
  );

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

  const TaskCard = ({ task, submissionState }: { task: Task; submissionState: 'open' | 'submitted' | 'graded' }) => {
    const expired = isExpired(task.deadline);

    return (
      <div className={cn(
        'group p-6 backdrop-blur-md border transition-all duration-300 shadow-sm rounded-3xl relative overflow-hidden flex flex-col justify-between',
        submissionState === 'open' && !expired
          ? 'bg-white/80 dark:bg-indigo-950/10 border-panel-hover hover:border-indigo-500/30'
          : submissionState === 'submitted'
          ? 'bg-amber-500/5 dark:bg-amber-900/10 border-amber-500/20'
          : submissionState === 'graded'
          ? 'bg-emerald-500/5 dark:bg-emerald-900/10 border-emerald-500/20'
          : 'bg-white/80 dark:bg-indigo-950/10 border-panel-hover opacity-60'
      )}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-black tracking-tight text-content leading-tight">{task.title}</h3>
            {/* Status badge */}
            {submissionState === 'submitted' && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <AlertCircle className="h-3 w-3" /> Under Review
              </span>
            )}
            {submissionState === 'graded' && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Graded
              </span>
            )}
          </div>

          <p className="text-sm text-content-muted line-clamp-3 leading-relaxed">{task.description}</p>

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
                      <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-xs font-medium text-content-muted group-hover:text-content truncate">{att.fileName || `File ${idx + 1}`}</span>
                    </div>
                    <Download className="h-3 w-3 text-content-muted group-hover:text-indigo-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {submissionState !== 'graded' && (
            <div className={cn(
              'flex items-center gap-2 text-xs font-bold w-fit px-3 py-1.5 rounded-lg border mt-2',
              expired ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            )}>
              <Clock className="h-3.5 w-3.5" />
              {expired ? 'Deadline Passed — ' : 'Due '}{format(new Date(task.deadline), 'MMM d, h:mm a')}
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-panel-hover/50">
          {submissionState === 'graded' && (
            <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Graded
            </div>
          )}
          {submissionState === 'submitted' && (
            <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
              <AlertCircle className="h-4 w-4" /> Submission Under Review
            </div>
          )}
          {submissionState === 'open' && (
            expired ? (
              <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-panel border border-panel-hover text-content-muted text-sm cursor-not-allowed">
                <Ban className="h-4 w-4" /> Expired
              </div>
            ) : (
              <Button
                onClick={() => handleSubmitTask(task)}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50 shadow-sm transition-colors"
              >
                Submit Assignment <ArrowRight className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    );
  };

  const SectionHeader = ({
    icon, title, count, color,
  }: { icon: React.ReactNode; title: string; count: number; color: string }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className={cn('text-base font-black tracking-tight flex items-center gap-2.5', color)}>
        {icon} {title}
      </h2>
      <span className="text-xs font-bold text-content-muted bg-panel-hover px-3 py-1 rounded-full border border-panel-hover">
        {count} {count === 1 ? 'Task' : 'Tasks'}
      </span>
    </div>
  );

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
      <section className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-indigo-950/10 backdrop-blur-md border border-panel-hover p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 end-0 p-8 opacity-10">
          <Building2 className="h-48 w-48 text-content" />
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/20 w-fit px-3 py-1 rounded-lg border border-indigo-500/30">
              {course?.courseCode}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-content tracking-tight">{course?.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-content-muted">
            <div className="flex items-center gap-2 bg-panel-hover px-4 py-2 rounded-xl border border-panel-hover text-content">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <User className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              </div>
              {instructorName}
            </div>
            {course?.credits && (
              <div className="flex items-center gap-2 bg-panel-hover px-4 py-2 rounded-xl border border-panel-hover text-content">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{course?.credits}</span> Credits
              </div>
            )}
            {/* Summary badges */}
            <div className="flex items-center gap-2 ms-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-full border border-indigo-500/20">
                {openTasks.length} Open
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1.5 rounded-full border border-amber-500/20">
                {submittedTasks.length} Submitted
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20">
                {gradedTasks.length} Graded
              </span>
            </div>
          </div>

          {course?.description && (
            <p className="max-w-3xl text-sm leading-relaxed text-content-muted mt-2">{course?.description}</p>
          )}
        </div>
      </section>

      {/* ── Filter Bar ─────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {([
            { key: 'ALL', label: 'All Tasks', count: tasks.length, activeClass: 'bg-indigo-600 text-white border-indigo-500 shadow-sm' },
            { key: 'OPEN', label: 'Open', count: openTasks.length, activeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-sm' },
            { key: 'SUBMITTED', label: 'Under Review', count: submittedTasks.length, activeClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-sm' },
            { key: 'GRADED', label: 'Graded', count: gradedTasks.length, activeClass: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30 shadow-sm' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200',
                activeFilter === f.key
                  ? f.activeClass
                  : 'bg-panel text-content-muted border-panel-hover hover:border-indigo-500/30 hover:text-content'
              )}
            >
              {f.label}
              <span className={cn(
                'text-[10px] font-black px-1.5 py-0.5 rounded-md',
                activeFilter === f.key ? 'bg-white/20' : 'bg-panel-hover'
              )}>{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-panel-hover bg-white/80 dark:bg-indigo-950/10 backdrop-blur-md flex flex-col items-center gap-4">
          <ClipboardList className="h-12 w-12 text-content-muted/50" />
          <p className="text-content-muted font-medium">No active tasks assigned to this course right now.</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Open Tasks ──────────────────────────────────── */}
          {openTasks.length > 0 && (activeFilter === 'ALL' || activeFilter === 'OPEN') && (
            <section className="animate-in fade-in duration-300">
              <SectionHeader
                icon={<SendHorizonal className="h-4.5 w-4.5" />}
                title="Open Assignments"
                count={openTasks.length}
                color="text-indigo-400"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openTasks.map(task => (
                  <TaskCard key={task.id || task._id} task={task} submissionState="open" />
                ))}
              </div>
            </section>
          )}

          {/* ── Submitted / Under Review ─────────────────────── */}
          {submittedTasks.length > 0 && (activeFilter === 'ALL' || activeFilter === 'SUBMITTED') && (
            <section className="animate-in fade-in duration-300">
              <SectionHeader
                icon={<AlertCircle className="h-4.5 w-4.5" />}
                title="Under Review"
                count={submittedTasks.length}
                color="text-amber-500"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submittedTasks.map(task => (
                  <TaskCard key={task.id || task._id} task={task} submissionState="submitted" />
                ))}
              </div>
            </section>
          )}

          {/* ── Graded ──────────────────────────────────────── */}
          {gradedTasks.length > 0 && (activeFilter === 'ALL' || activeFilter === 'GRADED') && (
            <section className="animate-in fade-in duration-300">
              <SectionHeader
                icon={<CheckCircle2 className="h-4.5 w-4.5" />}
                title="Graded"
                count={gradedTasks.length}
                color="text-emerald-500"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gradedTasks.map(task => (
                  <TaskCard key={task.id || task._id} task={task} submissionState="graded" />
                ))}
              </div>
            </section>
          )}

          {/* Empty state when a specific filter has no results */}
          {activeFilter !== 'ALL' &&
            ((activeFilter === 'OPEN' && openTasks.length === 0) ||
             (activeFilter === 'SUBMITTED' && submittedTasks.length === 0) ||
             (activeFilter === 'GRADED' && gradedTasks.length === 0)) && (
            <div className="p-16 text-center rounded-3xl border border-panel-hover bg-white/80 dark:bg-indigo-950/10 backdrop-blur-md flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <ClipboardList className="h-10 w-10 text-content-muted/40" />
              <p className="text-content-muted font-medium text-sm">No {activeFilter.toLowerCase()} tasks at the moment.</p>
            </div>
          )}

        </div>
      )}

      {taskToSubmit && (
        <SubmitTaskModal
          taskId={taskToSubmit}
          open={!!taskToSubmit}
          onClose={() => setTaskToSubmit(null)}
          onSuccess={() => {
            setTaskToSubmit(null);
            fetchData(); // Refresh everything to move task to "Submitted"
          }}
        />
      )}
    </div>
  );
}
