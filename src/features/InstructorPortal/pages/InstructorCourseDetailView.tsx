import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as courseApi from '@/shared/api/courseApi';
import * as taskApi from '@/features/TaskManagement/api/taskApi';
import { getTaskSubmissions } from '@/shared/api/taskSubmissionApi';
import type { Course } from '@/shared/api/courseApi';
import type { Task } from '@/features/TaskManagement/api/taskApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import { TaskModal } from '@/features/TaskManagement/components/TaskModal';
import { TaskTypeSelectorModal } from '@/features/TaskManagement/components/TaskTypeSelectorModal';
import { BreadcrumbNav } from '@/shared/components/ui/BreadcrumbNav';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  BookOpen, Loader2, Plus, Target, CheckCircle2, Clock, Users, FileText, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function InstructorCourseDetailView() {
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const courseData = await courseApi.getCourseById(courseId);
        setCourse(courseData);

        const allTasks = await taskApi.getTasks();
        const courseTasks = allTasks.filter(t => t.target?.course_id === courseId);
        setTasks(courseTasks);

        const submissionsPromises = courseTasks.map(t => getTaskSubmissions(t.id || t._id as string));
        const submissionsArrays = await Promise.all(submissionsPromises);
        setSubmissions(submissionsArrays.flat());
      } catch (error) {
        toast.error('Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleCreateTask = async (payload: taskApi.CreateTaskPayload) => {
    try {
      const savedTask = await taskApi.createTask(payload);
      toast.success('Task created successfully');
      // Refresh tasks
      const allTasks = await taskApi.getTasks();
      setTasks(allTasks.filter(t => t.target?.course_id === courseId));
      return savedTask;
    } catch (error) {
      toast.error('Failed to create task');
      throw error;
    }
  };



  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] space-y-8">
<BreadcrumbNav 
  homeItem={{ label: 'Command Center', href: '/dashboard' }}
  items={[
    { label: 'Module Directory', href: '/dashboard/courses' },
    { label: course?.name || 'Course Details' }
  ]}
/>

      {/* Majestic Glassmorphism Header */}
      <div className="relative rounded-3xl overflow-hidden bg-indigo-950/20 border border-panel-hover p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute -top-24 -end-24 h-64 w-64 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 h-64 w-64 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-indigo-400 border border-panel-hover shadow-inner">
              <BookOpen className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-black tracking-widest uppercase">
                  {course?.courseCode}
                </Badge>
                <span className="text-xs font-bold text-content-muted uppercase tracking-widest">
                  {course?.credits} Credits
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-content">{course?.name}</h1>
              <p className="text-content-muted mt-2 max-w-2xl">{course?.description || 'No description available for this module.'}</p>
            </div>
          </div>

          <Button 
            onClick={() => setIsSelectorOpen(true)}
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Provision Task
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="tasks" className="w-full space-y-8">
        <TabsList className="bg-indigo-950/20 border border-panel p-1 h-14 rounded-2xl">
          <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-content-muted font-bold px-8 h-full flex items-center gap-2">
            <Target className="h-4 w-4" /> Active Tasks
          </TabsTrigger>
          <TabsTrigger value="students" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-content text-content-muted font-bold px-8 h-full flex items-center gap-2">
            <Users className="h-4 w-4" /> Student Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => {
              const taskSubmissions = submissions.filter(s => {
                const subTaskId = typeof s.task_id === 'object' ? (s.task_id as any)._id || (s.task_id as any).id : s.task_id;
                return subTaskId === task.id || subTaskId === task._id;
              });
              
              return (
                <div key={task.id || task._id} className="group rounded-3xl bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 shadow-xl transition-all p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Target className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className={task.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-content-muted border-slate-500/20'}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-black text-content mb-2">{task.title}</h3>
                  <p className="text-sm text-content-muted line-clamp-2 mb-6 flex-1">{task.description}</p>
                  
                  <div className="space-y-4 pt-4 border-t border-panel mt-auto">
                    <div className="flex items-center justify-between text-xs font-bold text-content-muted">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Deadline</span>
                      <span className="text-content">{format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-content-muted">
                      <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Submissions</span>
                      <span className="text-content">{taskSubmissions.length} Received</span>
                    </div>
                    <Link to={`/dashboard/courses/${courseId}/tasks/${task.id || task._id}`}>
                      <Button className="w-full h-10 mt-2 bg-panel-hover hover:bg-indigo-600 text-white-muted hover:text-content transition-all font-bold rounded-xl border border-panel-hover hover:border-indigo-500">
                        View Submissions <ArrowRight className="ms-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
            
            {tasks.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-3xl border border-panel-hover border-dashed flex flex-col items-center gap-4">
                <Target className="h-12 w-12 text-content-muted/50" />
                <p className="text-sm font-medium text-content-muted">No tasks have been assigned to this module yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="students" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-3xl bg-indigo-950/10 backdrop-blur-md border border-panel-hover shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm text-content-muted">
                <thead className="bg-panel-hover text-xs uppercase font-black text-content-muted border-b border-panel-hover">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Task Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Final Grade</th>
                    <th className="px-6 py-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panel">
                  {submissions.map((sub) => {
                    const student = sub.submitter_id as any;
                    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown';
                    const taskName = tasks.find(t => (t.id || t._id) === (typeof sub.task_id === 'object' ? (sub.task_id as any)._id : sub.task_id))?.title || 'Unknown Task';
                    
                    return (
                      <tr key={sub.id || sub._id} className="hover:bg-panel-hover transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400">
                              {student?.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-content">{studentName}</span>
                              <span className="text-[10px] text-content-muted font-mono">{student?.email || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-content-muted">{taskName}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            sub.status === 'FINALIZED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-black' :
                            sub.status === 'AI_GRADED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] uppercase font-black' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] uppercase font-black'
                          }>
                            {sub.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {sub.final_grade !== undefined ? (
                            <span className="font-black text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {sub.final_grade}%
                            </span>
                          ) : (
                            <span className="text-content-muted text-xs italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-end">
                          <Link to={`/dashboard/courses/${courseId}/tasks/${typeof sub.task_id === 'object' ? (sub.task_id as any)._id : sub.task_id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-xs">
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-content-muted">
                        No submissions recorded for this module yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TaskTypeSelectorModal
        open={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectAttachment={() => setIsTaskModalOpen(true)}
        courseId={courseId}
      />
      {isTaskModalOpen && (
        <TaskModal 
          open={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleCreateTask}
          contextCourseId={courseId}
        />
      )}
    </div>
  );
}
