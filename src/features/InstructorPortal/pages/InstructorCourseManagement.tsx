import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as courseApi from '@/shared/api/courseApi';
import type { Course } from '@/shared/api/courseApi';
import { BookOpen, Users, Building2, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/shared/components/ui/input';
import { toast } from 'sonner';

export default function InstructorCourseManagement() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const allCourses = await courseApi.getCourses();
        const instructorCourses = allCourses.filter(c => {
          const instId = typeof c.instructorId === 'object' ? (c.instructorId as any)._id || (c.instructorId as any).id : c.instructorId;
          return instId === user?.id || instId === user?._id;
        });
        setCourses(instructorCourses);
      } catch (error) {
        toast.error('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] space-y-10">
      {/* Header and Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-content flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-500" />
            Module Directory
          </h2>
          <p className="text-content-muted font-bold uppercase text-[10px] tracking-[0.3em]">
            Manage your assigned courses
          </p>
        </div>

        <div className="w-full lg:w-96 relative group">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course name or code..."
            className="h-12 rounded-2xl bg-app border-panel text-content ps-12 pe-4 font-bold focus:ring-indigo-500"
          />
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <Link to={`/dashboard/courses/${course.id || course._id}`} key={course.id || course._id} className="group rounded-3xl bg-indigo-950/10 backdrop-blur-md border border-panel-hover hover:border-indigo-500/30 shadow-xl transition-all p-8 flex flex-col justify-between relative overflow-hidden block">
             <div className="absolute top-0 end-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
              <BookOpen className="h-32 w-32 text-content" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{course.courseCode}</span>
              <h3 className="text-xl font-bold text-content">{course.name}</h3>
              <p className="text-sm text-content-muted line-clamp-2">{course.description || 'No description provided.'}</p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-panel">
                <div className="flex items-center gap-2 text-xs font-bold text-content-muted">
                  <Users className="h-4 w-4 text-content-muted" />
                  {course.enrolledStudents?.length || 0} Students
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filteredCourses.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl border border-panel-hover border-dashed flex flex-col items-center gap-4">
            <BookOpen className="h-12 w-12 text-content-muted/50" />
            <p className="text-sm font-medium text-content-muted">No modules found for your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
