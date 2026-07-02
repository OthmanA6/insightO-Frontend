import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as authApi from "@/features/auth/api/authApi";
import * as courseApi from "@/shared/api/courseApi";
import * as userAdminApi from "@/shared/api/userAdminApi";
import * as formApi from "@/features/FormBuilder/api/formApi";
import {
  Loader2, BookOpen, FileText, ArrowRight,
  Users, GraduationCap, BarChart3, Star,
  TrendingUp, AlertCircle, Building2, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import type { Course } from "@/shared/api/courseApi";
import type { AdminUser } from "@/shared/api/userAdminApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveId(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj._id || obj.id || "";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent = "indigo" }: { label: string; value: number | string; icon: any; accent?: string }) {
  const map: Record<string, { bg: string; border: string; hover: string; text: string }> = {
    indigo: { bg: "bg-indigo-950/10", border: "border-indigo-500/20", hover: "hover:border-indigo-500/40 hover:shadow-indigo-500/10", text: "text-indigo-400" },
    violet: { bg: "bg-violet-950/10", border: "border-violet-500/20", hover: "hover:border-violet-500/40 hover:shadow-violet-500/10", text: "text-violet-400" },
    emerald: { bg: "bg-emerald-950/10", border: "border-emerald-500/20", hover: "hover:border-emerald-500/40 hover:shadow-emerald-500/10", text: "text-emerald-400" },
    amber: { bg: "bg-amber-950/10", border: "border-amber-500/20", hover: "hover:border-amber-500/40 hover:shadow-amber-500/10", text: "text-amber-400" },
  };
  const c = map[accent] || map.indigo;
  return (
    <div className={`p-6 backdrop-blur-md border ${c.bg} ${c.border} ${c.hover} transition-all duration-300 shadow-xl rounded-3xl flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-content-muted">{label}</span>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <span className="text-4xl font-black text-content">{value}</span>
    </div>
  );
}

function SectionHeader({ title, icon: Icon, linkTo, linkLabel }: { title: string; icon: any; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Icon className="h-5 w-5" /> {title}
      </h2>
      {linkTo && (
        <Link to={linkTo} className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          {linkLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="p-10 text-center rounded-3xl border border-border border-dashed flex flex-col items-center gap-4">
      <Icon className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HodDashboardPage() {
  const { user } = useAuth();

  const [hodDeptId, setHodDeptId] = useState<string>("");
  const [hodDeptName, setHodDeptName] = useState<string>("");
  const [hodDeptCode, setHodDeptCode] = useState<string>("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<AdminUser[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [forms, setForms] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const errs: string[] = [];

      // Step 1: get HOD profile to extract real departmentId
      let deptId = "";
      try {
        const profile = await authApi.getProfile();
        const deptObj = (profile as any).departmentId;
        deptId = resolveId(deptObj);
        if (deptObj && typeof deptObj === "object") {
          setHodDeptName(deptObj.name || "");
          setHodDeptCode(deptObj.code || "");
        }
        setHodDeptId(deptId);
      } catch (err) {
        errs.push("Failed to load your profile & department");
        console.error("Profile error:", err);
      }

      // Step 2: fetch all data in parallel
      const [coursesRes, usersRes, formsRes] = await Promise.allSettled([
        courseApi.getCourses(),
        userAdminApi.getAllUsers(),
        formApi.getAllForms(),
      ]);

      if (coursesRes.status === "fulfilled") {
        const all = coursesRes.value;
        // Filter courses to HOD department
        setCourses(deptId ? all.filter(c => resolveId(c.departmentId) === deptId) : all);
      } else {
        errs.push("Failed to load courses");
        console.error("Courses error:", coursesRes.reason);
      }

      if (usersRes.status === "fulfilled") {
        const all = usersRes.value;
        // Filter instructors & students to HOD department via their profile data
        // The profile.data object contains departmentId
        const deptInstructors = all.filter((u: any) => {
          if (u.role !== "INSTRUCTOR") return false;
          const profDeptId = resolveId(u.profile?.data?.departmentId);
          return !deptId || profDeptId === deptId;
        });
        const deptStudents = all.filter((u: any) => {
          if (u.role !== "STUDENT") return false;
          const profDeptId = resolveId(u.profile?.data?.departmentId);
          return !deptId || profDeptId === deptId;
        });
        setInstructors(deptInstructors);
        setStudents(deptStudents);
      } else {
        errs.push("Failed to load users");
        console.error("Users error:", usersRes.reason);
      }

      if (formsRes.status === "fulfilled") {
        // Show only forms created by the HOD (current user)
        const hodId = resolveId(user);
        const all = formsRes.value;
        setForms(hodId ? all.filter((f: any) => resolveId(f.createdBy || f.creator || f.owner) === hodId) : all);
      } else {
        console.warn("Forms fetch failed (non-critical):", formsRes.reason);
      }

      setErrors(errs);
      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const recentCourses = useMemo(() =>
    [...courses].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 4),
    [courses]
  );

  const recentForms = useMemo(() =>
    [...forms].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 4),
    [forms]
  );

  const courseInsights = useMemo(() =>
    courses.slice(0, 6).map(course => ({
      ...course,
      instructorName: course.instructor
        ? `${course.instructor.firstName} ${course.instructor.lastName}`
        : "Unassigned",
      enrolledCount: course.enrolledStudents?.length ?? 0,
    })),
    [courses]
  );

  const instructorInsights = useMemo(() => {
    return instructors.map(instructor => ({
      ...instructor,
      courseCount: courses.filter(c =>
        resolveId((c as any).instructorId || c.instructor?._id) === instructor.id
      ).length,
    }));
  }, [instructors, courses]);

  const maxEnrolled = useMemo(() =>
    Math.max(...courseInsights.map(c => c.enrolledCount), 1),
    [courseInsights]
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] space-y-12">

      {/* Error Banner */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold mb-1">Some data could not be loaded:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-400/80">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Header */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Welcome, {user?.firstName || "HOD"}.
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          {hodDeptName && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-sm font-bold text-indigo-300">
              <Building2 className="h-4 w-4" />
              {hodDeptName} {hodDeptCode && `(${hodDeptCode})`}
            </div>
          )}
        </div>
      </section>

      {/* Stat Cards */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Dept Courses" value={courses.length} icon={BookOpen} accent="indigo" />
          <StatCard label="Dept Instructors" value={instructors.length} icon={GraduationCap} accent="violet" />
          <StatCard label="Dept Students" value={students.length} icon={Users} accent="emerald" />
          <StatCard label="My Forms" value={forms.length} icon={FileText} accent="amber" />
        </div>
      </section>

      {/* Courses + Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Courses */}
        <section>
          <SectionHeader title="Recent Courses" icon={BookOpen} linkTo="/dashboard/courses" linkLabel="Manage Courses" />
          <div className="space-y-3">
            {recentCourses.length === 0
              ? <EmptyState icon={BookOpen} message="No courses found in your department." />
              : recentCourses.map(course => (
                <div key={course.id || (course as any)._id}
                  className="p-5 bg-indigo-950/10 border border-panel-hover hover:border-indigo-500/30 transition-all duration-300 shadow-lg rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{course.courseCode}</span>
                    <h3 className="text-sm font-bold text-content leading-tight truncate">{course.name}</h3>
                    {course.instructor && (
                      <p className="text-xs text-content-muted mt-0.5">{course.instructor.firstName} {course.instructor.lastName}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold">
                      {course.credits ?? "—"} Credits
                    </span>
                    <span className="text-[10px] text-content-muted">{course.enrolledStudents?.length ?? 0} students</span>
                  </div>
                </div>
              ))
            }
          </div>
        </section>

        {/* Recent Forms */}
        <section>
          <SectionHeader title="My Recent Forms" icon={FileText} linkTo="/dashboard/forms-surveys" linkLabel="Manage Forms" />
          <div className="space-y-3">
            {recentForms.length === 0
              ? <EmptyState icon={FileText} message="No forms created yet." />
              : recentForms.map(form => (
                <div key={form._id || form.id}
                  className="p-5 bg-amber-950/10 border border-panel-hover hover:border-amber-500/30 transition-all duration-300 shadow-lg rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                      <FileText className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-content truncate">{form.title}</h3>
                      {form.category && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">{form.category}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-content-muted flex-shrink-0" />
                </div>
              ))
            }
          </div>
        </section>
      </div>

      {/* Course Insights */}
      <section>
        <SectionHeader title="Course Insights — Department Overview" icon={BarChart3} linkTo="/dashboard/courses" linkLabel="View All" />
        {courseInsights.length === 0
          ? <EmptyState icon={BarChart3} message="No course data available for insights." />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {courseInsights.map(course => (
                <div key={course.id || (course as any)._id}
                  className="p-6 bg-indigo-950/10 border border-panel-hover hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">{course.courseCode}</span>
                      <h3 className="text-base font-bold text-content leading-snug">{course.name}</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-bold flex-shrink-0">
                      {course.credits ?? "—"} Cr
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-content-muted">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-violet-400" />
                      <span className="font-medium">{course.instructorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{course.enrolledCount} student{course.enrolledCount !== 1 ? "s" : ""} enrolled</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-content-muted">
                      <span>Enrollment</span>
                      <span>{course.enrolledCount}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-panel-hover overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (course.enrolledCount / maxEnrolled) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section>

      {/* Instructor Insights */}
      <section>
        <SectionHeader title="Instructor Insights — Department Faculty" icon={Star} />
        {instructorInsights.length === 0
          ? <EmptyState icon={GraduationCap} message="No instructors found in your department yet." />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {instructorInsights.map(instructor => (
                <div key={instructor.id}
                  className="p-6 bg-violet-950/10 border border-panel-hover hover:border-violet-500/30 transition-all duration-300 shadow-xl hover:shadow-violet-500/10 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-black text-white shadow-lg ring-2 ring-violet-500/20 flex-shrink-0">
                      {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-content truncate">{instructor.firstName} {instructor.lastName}</h3>
                      <p className="text-[10px] text-content-muted truncate mt-0.5">{instructor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-violet-500/10">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-2xl font-black text-content">{instructor.courseCount}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                        Course{instructor.courseCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">Active</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Status</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section>

    </div>
  );
}
