import { useState, useEffect } from 'react';
import { getAllForms } from '@/features/FormBuilder/api/formApi';
import type { Form } from '@/features/FormBuilder/types/form.types';
import { getMyFormSubmissions } from '@/shared/api/submissionApi';
import type { Submission } from '@/shared/api/submissionApi';
import { getCourses } from '@/shared/api/courseApi';
import { getProfile } from '@/features/auth/api/authApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Input } from '@/shared/components/ui/input';
import { Loader2, FileQuestion, Calendar, ArrowRight, CheckCircle2, History, Search, Filter, SortDesc } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function StudentSurveysPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const { user } = useAuth();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const [allForms, mySubmissions, enrolledCourses, myProfile] = await Promise.all([
          getAllForms(),
          getMyFormSubmissions(),
          getCourses(),
          getProfile()
        ]);
        setSubmissions(mySubmissions);
        
        const enrolledCourseIds = new Set(enrolledCourses.map(c => c.id || c._id));

        // Extract IDs of forms the user has already submitted
        const submittedFormIds = new Set(
          mySubmissions.map(s => {
            if (!s.form_id) return null;
            const id = typeof s.form_id === 'object' ? (s.form_id as any)._id || (s.form_id as any).id : s.form_id;
            return id ? String(id) : null;
          }).filter(Boolean)
        );

        // Filter forms based on type and student enrollment
        const studentForms = allForms.filter(f => {
          const formId = String(f.id || f._id);
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
            const userDeptId = typeof myProfile?.departmentId === 'object' ? (myProfile.departmentId as any)._id || (myProfile.departmentId as any).id : myProfile?.departmentId;
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

  const filteredAndSortedForms = forms
    .filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()) || (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase())))
    .filter(f => categoryFilter === 'ALL' || f.category === categoryFilter)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

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
            <TabsList className="bg-slate-100/80 dark:bg-indigo-950/20 backdrop-blur-md border border-panel-hover p-1 rounded-xl h-auto shrink-0">
              <TabsTrigger value="pending" className="rounded-lg px-6 py-2.5 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-content text-content-muted transition-all">
                Pending Surveys
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg px-6 py-2.5 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-content text-content-muted transition-all">
                History
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="pending" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          {/* Controls Bar */}
          {forms.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-panel p-4 rounded-3xl border border-panel">
              <div className="relative w-full md:w-96 group">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search surveys..."
                  className="h-12 rounded-2xl bg-app border-panel text-content ps-12 pe-4 font-bold"
                />
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                <div className="flex items-center gap-2 bg-app p-1.5 rounded-2xl border border-panel">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-transparent text-xs font-bold text-content-muted outline-none cursor-pointer appearance-none pe-8 relative"
                    style={{ background: `url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>') no-repeat right 8px center/12px` }}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="GENERAL">General</option>
                    <option value="SPECIALIZED">Specialized</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                </div>
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-app border border-panel hover:border-indigo-500/30 text-xs font-bold text-content-muted transition-colors whitespace-nowrap"
                >
                  <SortDesc className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                </button>
              </div>
            </div>
          )}

          {filteredAndSortedForms.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-border bg-card flex flex-col items-center gap-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
              <p className="text-sm font-medium text-muted-foreground">{forms.length === 0 ? 'You have no pending surveys to complete. Great job!' : 'No surveys match your filters.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedForms.map((form) => (
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
