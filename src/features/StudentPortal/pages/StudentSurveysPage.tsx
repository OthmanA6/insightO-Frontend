import { useState, useEffect } from 'react';
import { getAllForms } from '@/features/FormBuilder/api/formApi';
import type { Form } from '@/features/FormBuilder/types/form.types';
import { Loader2, FileQuestion, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function StudentSurveysPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const allForms = await getAllForms();
        // Filter forms that are active and assigned to STUDENT
        const studentForms = allForms.filter(f => 
          f.is_active && 
          f.evaluator_roles?.includes('STUDENT')
        );
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
      
      <section className="flex flex-col gap-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
          <FileQuestion className="h-8 w-8 text-indigo-500" /> Pending Surveys
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Active evaluations, feedback forms, and surveys assigned to you.
        </p>
      </section>

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
    </div>
  );
}
