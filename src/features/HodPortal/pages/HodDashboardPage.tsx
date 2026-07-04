import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as authApi from "@/features/auth/api/authApi";
import * as courseApi from "@/shared/api/courseApi";
import * as userAdminApi from "@/shared/api/userAdminApi";
import * as formApi from "@/features/FormBuilder/api/formApi";
import * as formAiApi from "@/features/Forms/api/formAiApi";
import * as profileApi from "@/shared/api/profileApi";
import {
  Loader2, BookOpen, FileText, ArrowRight,
  Users, GraduationCap, BarChart3, Star,
  TrendingUp, AlertCircle, Building2, ChevronRight,
  Plus, BrainCircuit, Activity, LayoutDashboard, CheckCircle2,
  X, Trash2, Edit, Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import type { Course } from "@/shared/api/courseApi";
import type { AdminUser } from "@/shared/api/userAdminApi";
import type { FormDeepAnalysisPayload } from "@/features/Forms/api/formAiApi";

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
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "instructors" | "forms">("overview");

  // HOD Context (Supports multiple departments)
  const [hodDeptIds, setHodDeptIds] = useState<string[]>([]);

  // Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<AdminUser[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [forms, setForms] = useState<any[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals & Sub-forms
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", courseCode: "", instructorId: "", departmentId: "" });
  
  const [isCreatingInstructor, setIsCreatingInstructor] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ firstName: "", lastName: "", email: "", password: "", nationalId: "", departmentId: "" });

  const [insightModal, setInsightModal] = useState<{ isOpen: boolean, title: string, data: any, loading: boolean } | null>(null);

  // Form & AI Analytics State (Legacy Forms Tab)
  const [aiAnalytics, setAiAnalytics] = useState<Record<string, FormDeepAnalysisPayload>>({});
  const [analyzingForms, setAnalyzingForms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const errs: string[] = [];
      let deptIds: string[] = [];

      // ── Step 1: Get HOD profile to know their department(s) ──────────
      try {
        const profile = await authApi.getProfile();
        // Backend now returns departmentIds array for HOD
        const deptIdsRaw = (profile as any).departmentIds;
        const deptIdSingle = (profile as any).departmentId;

        if (Array.isArray(deptIdsRaw) && deptIdsRaw.length > 0) {
          deptIds = deptIdsRaw.map(resolveId).filter(Boolean);
        } else if (deptIdSingle) {
          deptIds = [resolveId(deptIdSingle)].filter(Boolean);
        }

        setHodDeptIds(deptIds);

        // Defaults for dropdowns
        if (deptIds.length > 0) {
          setNewCourse(p => ({ ...p, departmentId: deptIds[0] }));
          setNewInstructor(p => ({ ...p, departmentId: deptIds[0] }));
        }
      } catch (err: any) {
        console.error("Profile error:", err);
        errs.push("Failed to load HOD profile & department scope.");
      }

      // ── Step 2: Fetch courses, users, forms in parallel ─────────────
      // NOTE: The backend already filters all three by HOD's department(s)
      // so we do NOT need to filter again on the frontend.
      const [coursesRes, usersRes, formsRes] = await Promise.allSettled([
        courseApi.getCourses(),
        userAdminApi.getAllUsers(),
        formApi.getAllForms(),
      ]);

      // Courses — backend returns only courses in HOD's department
      if (coursesRes.status === "fulfilled") {
        setCourses(coursesRes.value);
      } else {
        console.error("Courses error:", coursesRes.reason);
        errs.push("Failed to load department courses.");
      }

      // Users — backend returns students + instructors in HOD's departments
      if (usersRes.status === "fulfilled") {
        const all = usersRes.value;
        setInstructors(all.filter((u: any) => u.role === "INSTRUCTOR"));
        setStudents(all.filter((u: any) => u.role === "STUDENT"));
      } else {
        console.error("Users error:", usersRes.reason);
        errs.push("Failed to load department faculty and students.");
      }

      // Forms — backend returns forms scoped to HOD's departments
      if (formsRes.status === "fulfilled") {
        setForms(formsRes.value);
      } else {
        console.warn("Forms fetch failed:", formsRes.reason);
      }

      setErrors(errs);
      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  // ── Derived Data ────────────────────────────────────────────────────────────
  const courseInsights = useMemo(() =>
    courses.slice(0, 6).map(course => {
      // Backend populates instructorId as an object {_id, firstName, lastName, email}
      const inst = (course as any).instructorId;
      const instObj = (typeof inst === 'object' && inst !== null) ? inst : course.instructor;
      return {
        ...course,
        instructorName: instObj
          ? `${instObj.firstName} ${instObj.lastName}`
          : "Unassigned",
        enrolledCount: course.enrolledStudents?.length ?? 0,
      };
    }),
    [courses]
  );

  const instructorInsights = useMemo(() => {
    return instructors.map(instructor => ({
      ...instructor,
      courseCount: courses.filter(c => {
        const instId = typeof (c as any).instructorId === 'object'
          ? resolveId((c as any).instructorId)
          : (c as any).instructorId;
        return instId === instructor.id;
      }).length,
    }));
  }, [instructors, courses]);

  const maxEnrolled = useMemo(() =>
    Math.max(...courseInsights.map(c => c.enrolledCount), 1),
    [courseInsights]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create-course");
    setErrors([]);
    try {
      const created = await courseApi.createCourse({
        name: newCourse.name,
        courseCode: newCourse.courseCode,
        departmentId: newCourse.departmentId || hodDeptIds[0],
        instructorId: newCourse.instructorId || undefined,
        isActive: true,
      });
      setCourses(prev => [...prev, created]);
      setNewCourse({ name: "", courseCode: "", instructorId: "", departmentId: hodDeptIds[0] || "" });
      setIsCreatingCourse(false);
    } catch (err: any) {
      setErrors(prev => [...prev, "Failed to create new course. Ensure all fields are valid."]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setActionLoading(`delete-course-${courseId}`);
    try {
      await courseApi.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => (c.id || c._id) !== courseId));
    } catch (err: any) {
      setErrors(prev => [...prev, "Failed to delete course."]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create-instructor");
    setErrors([]);
    try {
      // Endpoint requires ADMIN, but if HOD is authorized it will pass.
      const payload = {
        firstName: newInstructor.firstName,
        lastName: newInstructor.lastName,
        email: newInstructor.email,
        password: newInstructor.password || "Password@123",
        nationalId: newInstructor.nationalId || "00000000000000",
        role: "INSTRUCTOR",
        departmentId: newInstructor.departmentId || hodDeptIds[0]
      };
      const created = await userAdminApi.createAdminUser(payload);
      setInstructors(prev => [...prev, created]);
      setNewInstructor({ firstName: "", lastName: "", email: "", password: "", nationalId: "", departmentId: hodDeptIds[0] || "" });
      setIsCreatingInstructor(false);
    } catch (err: any) {
      setErrors(prev => [...prev, err?.response?.data?.message || "Failed to create instructor. Endpoint might be restricted to ADMIN only."]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;
    setActionLoading(`delete-form-${formId}`);
    try {
      await formApi.deleteForm(formId);
      setForms(prev => prev.filter(f => (f.id || f._id) !== formId));
    } catch (err: any) {
      setErrors(prev => [...prev, "Failed to delete form."]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCourseInsights = async (courseId: string, courseName: string) => {
    setInsightModal({ isOpen: true, title: `Course Insights: ${courseName}`, data: null, loading: true });
    try {
      const data = await courseApi.getCourseInsights(courseId);
      setInsightModal({ isOpen: true, title: `Course Insights: ${courseName}`, data, loading: false });
    } catch (err) {
      setInsightModal({ isOpen: true, title: `Course Insights: ${courseName}`, data: { error: "Failed to load insights or no data available." }, loading: false });
    }
  };

  const handleViewInstructorInsights = async (instructorId: string, name: string) => {
    setInsightModal({ isOpen: true, title: `Instructor Insights: ${name}`, data: null, loading: true });
    try {
      const data = await profileApi.getInstructorInsights(instructorId);
      setInsightModal({ isOpen: true, title: `Instructor Insights: ${name}`, data, loading: false });
    } catch (err) {
      setInsightModal({ isOpen: true, title: `Instructor Insights: ${name}`, data: { error: "Failed to load insights or no data available." }, loading: false });
    }
  };

  const handleRunAiAudit = async (formId: string) => {
    setAnalyzingForms(prev => ({ ...prev, [formId]: true }));
    try {
      const result = await formAiApi.analyzeFormDeep(formId);
      setAiAnalytics(prev => ({ ...prev, [formId]: result }));
    } catch (error) {
      setErrors(prev => [...prev, `AI Audit failed for form ID: ${formId}`]);
    } finally {
      setAnalyzingForms(prev => ({ ...prev, [formId]: false }));
    }
  };

  // ── Loading State ────────────────────────────────────────────────────────────
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
    <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] space-y-8 relative">

      {/* Header & Context */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Welcome, {user?.firstName || "HOD"}.
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-sm font-bold text-indigo-300 shadow-inner">
            <Building2 className="h-4 w-4" />
            Managing {hodDeptIds.length} Department{hodDeptIds.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold mb-1">System Alerts:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-400/80">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
          <button onClick={() => setErrors([])} className="text-red-400 hover:text-red-300"><X className="h-5 w-5" /></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-panel border border-panel-border rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "overview" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-md" : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab("instructors")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "instructors" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md" : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <GraduationCap className="h-4 w-4" /> Instructor Management
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "courses" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md" : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <BookOpen className="h-4 w-4" /> Course Management
        </button>
        <button
          onClick={() => setActiveTab("forms")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "forms" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-md" : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <BrainCircuit className="h-4 w-4" /> Forms & Feedback
        </button>
      </div>

      {/* ─── TAB: OVERVIEW ──────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Dept Courses" value={courses.length} icon={BookOpen} accent="indigo" />
              <StatCard label="Active Faculty" value={instructors.length} icon={GraduationCap} accent="emerald" />
              <StatCard label="Enrolled Students" value={students.length} icon={Users} accent="amber" />
              <StatCard label="Active Forms" value={forms.length} icon={FileText} accent="violet" />
            </div>
          </section>

          <section>
            <SectionHeader title="Course Insights — Department Overview" icon={BarChart3} />
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
                      </div>
                      <div className="space-y-1.5 text-xs text-content-muted">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-medium">{course.instructorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-amber-400" />
                          <span>{course.enrolledCount} student{course.enrolledCount !== 1 ? "s" : ""} enrolled</span>
                        </div>
                      </div>
                      <div className="space-y-1 mt-auto">
                        <div className="flex items-center justify-between text-[10px] font-bold text-content-muted">
                          <span>Enrollment Activity</span>
                          <span>{course.enrolledCount}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-panel-hover overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-700"
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
        </div>
      )}

      {/* ─── TAB: INSTRUCTOR MANAGEMENT ───────────────────────────────────────────── */}
      {activeTab === "instructors" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-panel p-5 rounded-2xl border border-panel-border shadow-md">
            <div>
              <h2 className="text-lg font-black text-content">Instructor Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Add faculty and view AI-driven insights for your instructors.</p>
            </div>
            <button
              onClick={() => setIsCreatingInstructor(!isCreatingInstructor)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              {isCreatingInstructor ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isCreatingInstructor ? "Cancel" : "Add Instructor"}
            </button>
          </div>

          {isCreatingInstructor && (
            <div className="p-6 bg-panel border border-emerald-500/20 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2">
              <h3 className="text-base font-bold text-content mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" /> Register New Instructor
              </h3>
              <form onSubmit={handleCreateInstructor} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">First Name</label>
                  <input type="text" required value={newInstructor.firstName} onChange={(e) => setNewInstructor(p => ({ ...p, firstName: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Last Name</label>
                  <input type="text" required value={newInstructor.lastName} onChange={(e) => setNewInstructor(p => ({ ...p, lastName: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                  <input type="email" required value={newInstructor.email} onChange={(e) => setNewInstructor(p => ({ ...p, email: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Assign to Department</label>
                  <select value={newInstructor.departmentId} onChange={(e) => setNewInstructor(p => ({ ...p, departmentId: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500">
                    {hodDeptIds.map(id => <option key={id} value={id}>Dept: {id.slice(-4)}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === "create-instructor"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70 flex justify-center items-center h-[42px] md:col-start-3"
                >
                  {actionLoading === "create-instructor" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Instructor"}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {instructorInsights.length === 0 ? (
               <div className="col-span-full"><EmptyState icon={Users} message="No instructors found in your department." /></div>
            ) : (
              instructorInsights.map(instructor => (
                <div key={instructor.id} className="p-6 bg-emerald-950/10 border border-panel-hover hover:border-emerald-500/30 transition-all duration-300 shadow-xl hover:shadow-emerald-500/10 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-black text-white shadow-lg ring-2 ring-emerald-500/20">
                        {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-content truncate">{instructor.firstName} {instructor.lastName}</h3>
                        <p className="text-[10px] text-content-muted truncate mt-0.5">{instructor.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                      {instructor.courseCount} Modules
                    </span>
                    <button
                      onClick={() => handleViewInstructorInsights(instructor.id, `${instructor.firstName} ${instructor.lastName}`)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Lightbulb className="h-3.5 w-3.5" /> View Insights
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: COURSE MANAGEMENT ───────────────────────────────────────────────── */}
      {activeTab === "courses" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-panel p-5 rounded-2xl border border-panel-border shadow-md">
            <div>
              <h2 className="text-lg font-black text-content">Department Courses</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage, update, and review AI insights for courses.</p>
            </div>
            <button
              onClick={() => setIsCreatingCourse(!isCreatingCourse)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              {isCreatingCourse ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isCreatingCourse ? "Cancel" : "Add New Course"}
            </button>
          </div>

          {isCreatingCourse && (
            <div className="p-6 bg-panel border border-amber-500/20 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2">
              <h3 className="text-base font-bold text-content mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-500" /> Create New Course
              </h3>
              <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Course Name</label>
                  <input type="text" required value={newCourse.name} onChange={(e) => setNewCourse(p => ({ ...p, name: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Course Code</label>
                  <input type="text" required value={newCourse.courseCode} onChange={(e) => setNewCourse(p => ({ ...p, courseCode: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Assign Instructor</label>
                  <select value={newCourse.instructorId} onChange={(e) => setNewCourse(p => ({ ...p, instructorId: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500">
                    <option value="">Unassigned</option>
                    {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.firstName} {inst.lastName}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                  <select value={newCourse.departmentId} onChange={(e) => setNewCourse(p => ({ ...p, departmentId: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500">
                    {hodDeptIds.map(id => <option key={id} value={id}>Dept: {id.slice(-4)}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === "create-course"}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70 flex justify-center items-center h-[42px] md:col-start-4"
                >
                  {actionLoading === "create-course" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Course"}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.length === 0 ? (
               <div className="col-span-full"><EmptyState icon={BookOpen} message="No courses available." /></div>
            ) : (
              courses.map(course => {
                const cId = course.id || (course as any)._id;
                return (
                  <div key={cId} className="p-5 bg-panel border border-panel-border hover:border-amber-500/30 transition-all duration-300 rounded-2xl flex flex-col gap-3 group relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">{course.courseCode}</span>
                        <h3 className="text-base font-bold text-content leading-tight mt-0.5">{course.name}</h3>
                        <p className="text-xs text-content-muted font-medium mt-1">
                          {(() => { const inst = (course as any).instructorId; return (typeof inst === 'object' && inst) ? `${inst.firstName} ${inst.lastName}` : (course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : "Unassigned"); })()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleDeleteCourse(cId)} disabled={actionLoading === `delete-course-${cId}`} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                          {actionLoading === `delete-course-${cId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                        {course.enrolledStudents?.length ?? 0} Students
                      </span>
                      <button
                        onClick={() => handleViewCourseInsights(cId, course.name)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Lightbulb className="h-3.5 w-3.5" /> AI Insights
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: FORMS & FEEDBACK AUDIT ──────────────────────────────────────────── */}
      {activeTab === "forms" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-panel p-5 rounded-2xl border border-panel-border shadow-md">
            <div>
              <h2 className="text-lg font-black text-content">Instructor Feedback Forms</h2>
              <p className="text-sm text-muted-foreground mt-1">Review feedback surveys and utilize AI-driven sentiment analysis.</p>
            </div>
            <Link to="/dashboard/forms-surveys" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Plus className="h-4 w-4" /> Form Builder
            </Link>
          </div>

          <div className="space-y-5">
            {forms.length === 0 ? (
               <EmptyState icon={FileText} message="No forms active in your department." />
            ) : (
              forms.map(form => {
                const formId = form._id || form.id;
                const isAnalyzing = analyzingForms[formId];
                const analytics = aiAnalytics[formId];

                return (
                  <div key={formId} className="bg-panel border border-panel-border rounded-2xl overflow-hidden shadow-lg transition-all hover:border-violet-500/30">
                    <div className="p-5 flex items-center justify-between gap-4 border-b border-border bg-violet-950/5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-content">{form.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{form.description || "Evaluation Form"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRunAiAudit(formId)}
                          disabled={isAnalyzing}
                          className="flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        >
                          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                          <span className="hidden sm:inline">{isAnalyzing ? "Analyzing..." : "AI Audit"}</span>
                        </button>
                        <button onClick={() => handleDeleteForm(formId)} disabled={actionLoading === `delete-form-${formId}`} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                          {actionLoading === `delete-form-${formId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* AI Insights Result Panel */}
                    {analytics && (
                      <div className="p-6 bg-gradient-to-br from-violet-950/20 to-purple-900/10 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-4">
                          <BrainCircuit className="h-5 w-5 text-violet-400" />
                          <h4 className="text-sm font-black uppercase tracking-widest text-violet-400">AI Executive Summary</h4>
                        </div>
                        <p className="text-sm text-content-muted leading-relaxed mb-6">
                          {analytics.global?.overall_summary || "No global summary available."}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(analytics.tags || {}).slice(0, 3).map(([tagId, data]) => (
                            <div key={tagId} className="bg-panel/50 border border-border p-4 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-content uppercase">{tagId}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  data.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  data.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {data.sentiment}
                                </span>
                              </div>
                              <p className="text-xs text-content-muted line-clamp-3">{data.summary}</p>
                              {data.action_items && data.action_items.length > 0 && (
                                <ul className="mt-3 space-y-1">
                                  <li className="text-[10px] text-violet-300/80 flex items-start gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{data.action_items[0]}</span>
                                  </li>
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── INSIGHTS MODAL ──────────────────────────────────────────────────────── */}
      {insightModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-panel border border-border rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 flex items-center justify-between border-b border-border bg-background/50">
              <h3 className="text-lg font-black text-content flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-500" />
                {insightModal.title}
              </h3>
              <button onClick={() => setInsightModal(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="h-5 w-5 text-content-muted" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {insightModal.loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-sm font-bold text-content-muted animate-pulse">Running AI Synthesis...</p>
                </div>
              ) : insightModal.data?.error ? (
                <div className="py-20 text-center text-red-400">
                  <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                  <p className="font-bold">{insightModal.data.error}</p>
                </div>
              ) : insightModal.data?.ai_status === "no_data" ? (
                <div className="py-20 text-center text-content-muted">
                  <Activity className="h-10 w-10 mx-auto mb-4 opacity-50" />
                  <p className="font-bold">No evaluation data available yet to generate insights.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Executive Summary */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Executive Summary</h4>
                    <p className="text-sm text-content leading-relaxed p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      {insightModal.data?.aiInsights?.overall_summary || insightModal.data?.aiInsights?.trend_analysis || "Analysis synthesized successfully."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    {insightModal.data?.aiInsights?.core_strengths && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" /> Core Strengths
                        </h4>
                        <ul className="space-y-2">
                          {insightModal.data.aiInsights.core_strengths.map((str: string, i: number) => (
                            <li key={i} className="text-xs text-content-muted flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Weaknesses / Issues */}
                    {(insightModal.data?.aiInsights?.persistent_issues || insightModal.data?.aiInsights?.persistent_weaknesses) && (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Persistent Issues
                        </h4>
                        <ul className="space-y-2">
                          {(insightModal.data.aiInsights.persistent_issues || insightModal.data.aiInsights.persistent_weaknesses).map((iss: string, i: number) => (
                            <li key={i} className="text-xs text-content-muted flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                              <span>{iss}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Plan */}
                  {insightModal.data?.aiInsights?.action_plan && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Recommended Action Plan
                      </h4>
                      <div className="space-y-2">
                        {insightModal.data.aiInsights.action_plan.map((act: string, i: number) => (
                          <div key={i} className="p-3 bg-panel border border-border rounded-xl text-xs text-content">
                            {act}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
