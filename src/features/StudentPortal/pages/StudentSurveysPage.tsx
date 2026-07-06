import { useState, useEffect } from 'react';
import { getAllForms } from '@/features/FormBuilder/api/formApi';
import type { Form } from '@/features/FormBuilder/types/form.types';
import { getMyFormSubmissions } from '@/shared/api/submissionApi';
import type { Submission } from '@/shared/api/submissionApi';
import { getCourses } from '@/shared/api/courseApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, FileQuestion, Calendar, ArrowRight, CheckCircle2, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function StudentSurveysPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const [allForms, mySubmissions, enrolledCourses] = await Promise.all([
          getAllForms(),
          getMyFormSubmissions(),
          getCourses()
        ]);
        setSubmissions(mySubmissions);
        
        const enrolledCourseIds = new Set(enrolledCourses.map(c => c.id || c._id));

        // Extract IDs of forms the user has already submitted
        const submittedFormIds = new Set(
          mySubmissions.map(s => {
            if (!s.form_id) return null;
            return typeof s.form_id === 'object' ? (s.form_id as any)._id || (s.form_id as any).id : s.form_id;
          }).filter(Boolean)
        );

        // Filter forms based on type and student enrollment
        const studentForms = allForms.filter(f => {
          const formId = f.id || f._id;
          if (submittedFormIds.has(formId)) return false; // Already submitted

          // 1. Facility Forms: Show to all students (regardless of evaluator_roles)
          if (f.subject_role === 'FACILITY') return f.is_active;

          const isStudentForm = f.is_active && f.evaluator_roles?.includes('STUDENT');
          if (!isStudentForm) return false;

          // 2. Course Forms: Show only if student is enrolled in the course
          if (f.course_id) {
            const courseId = typeof f.course_id === 'object' ? (f.course_id as any)._id || (f.course_id as any).id : f.course_id;
            return enrolledCourseIds.has(courseId);
          }
          
          // 3. Department Forms: Show only if student is in the department
          if (f.department_id) {
            const formDeptId = typeof f.department_id === 'object' ? (f.department_id as any)._id || (f.department_id as any).id : f.department_id;
            const userDeptId = typeof user?.departmentId === 'object' ? (user.departmentId as any)._id || (user.departmentId as any).id : user?.departmentId;
            return formDeptId === userDeptId;
          }
          
          // 4. General Forms (no course, no dept, no facility)
          return true;
        });
        setForms(studentForms);
      } catch (error) {
        console.error('Failed to fetch student forms', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Retrieving Surveys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      
      <Tabs defaultValue="pending" className="w-full">
        {/* TOP HEADER ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-panel-hover pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-content tracking-tight flex items-center gap-3">
              <FileQuestion className="h-8 w-8 text-indigo-500" /> Surveys & Feedback
            </h1>
            <p className="text-sm font-medium text-content-muted">
              View available evaluations or check your submission history.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <TabsList className="bg-indigo-950/20 backdrop-blur-md border border-panel-hover p-1 rounded-xl h-auto shrink-0 shadow-inner">
              <TabsTrigger value="pending" className="rounded-lg px-6 py-2.5 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-content text-content-muted transition-all">
                Pending Surveys
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg px-6 py-2.5 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-content text-content-muted transition-all">
                History
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="pending" className="animate-in fade-in slide-in-from-bottom-2">
          {forms.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-border bg-card flex flex-col items-center gap-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
              <p className="text-sm font-medium text-muted-foreground">You have no pending surveys to complete. Great job!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <div key={form.id || form._id} className="group rounded-3xl bg-card border border-border overflow-hidden shadow-sm hover:border-indigo-500/50 transition-all hover:shadow-md flex flex-col">
                  <div className="p-6 md:p-8 flex flex-col gap-4 flex-1">
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-[10px] uppercase tracking-widest">
                        {form.category}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {form.createdAt ? format(new Date(form.createdAt), 'MMM d, yyyy') : 'Recent'}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground line-clamp-2">{form.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{form.description}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto">
                    <Link 
                      to={`/form/${form.id || form._id}`}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      Take Survey <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2">
          {submissions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-border bg-card flex flex-col items-center gap-4">
              <History className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">You haven't completed any surveys yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => {
                const formObj = submission.form_id as any;
                const formTitle = formObj?.title || 'Unknown Survey';
                const formCategory = formObj?.category || 'SURVEY';
                
                return (
                  <div key={submission.id || (submission as any)._id} className="group rounded-3xl bg-card border border-border overflow-hidden shadow-sm opacity-80 flex flex-col">
                    <div className="p-6 md:p-8 flex flex-col gap-4 flex-1">
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                          {formCategory}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          {submission.createdAt ? format(new Date(submission.createdAt), 'MMM d, yyyy') : 'Completed'}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-foreground line-clamp-2">{formTitle}</h3>
                        <p className="text-sm text-emerald-600/80 font-medium mt-2 flex items-center gap-1.5">
                          Submitted successfully
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
