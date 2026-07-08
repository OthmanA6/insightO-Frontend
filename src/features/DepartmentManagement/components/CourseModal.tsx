import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  BookOpen, Code, Hash, Loader2, CheckCircle2,
  ChevronDown, Users, Search, X, GraduationCap, Check,
} from 'lucide-react';
import type { Course, CreateCoursePayload } from '@/shared/api/courseApi';
import * as userAdminApi from '@/shared/api/userAdminApi';
import type { AdminUser } from '@/shared/api/userAdminApi';
import { toast } from 'sonner';

interface CourseModalProps {
  open: boolean;
  onClose: () => void;
  /** The department this course belongs to — auto-injected into the payload. */
  departmentId: string;
  course?: Course | null;
  onSave: (payload: CreateCoursePayload, studentIds?: string[]) => Promise<void>;
}

/** Helper to handle populated MongoDB fields (_id or id) */
const getSafeId = (val: any) => (typeof val === 'object' && val !== null ? val._id || val.id : val);

/** Safely resolve a user ID from either MongoDB's _id or normalized id */
const resolveUserId = (u: AdminUser): string => getSafeId(u);

/** Safely resolve a user's departmentId, which may be a populated object or string */
const resolveUserDeptId = (u: AdminUser): string | undefined => {
  const raw = (u as any).departmentId ?? (u as any).profile?.data?.departmentId;
  return getSafeId(raw);
};

export function CourseModal({ open, onClose, departmentId, course, onSave }: CourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [credits, setCredits] = useState<number | ''>('');

  // ── User fetching ──
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // ── Student selection ──
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [deptFilterOn, setDeptFilterOn] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch users when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await userAdminApi.getAllUsers();
        setAllUsers(users);
      } catch {
        console.error('Failed to fetch users');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (course) {
      setName(course.name);
      setCourseCode(course.courseCode);
      setDescription(course.description || '');
      setInstructorId(getSafeId(course.instructorId) || '');
      setCredits(course.credits ?? '');
      // Selection is handled by the useEffect watching allUsers + course below
    } else {
      setName('');
      setCourseCode('');
      setDescription('');
      setInstructorId('');
      setCredits('');
      setSelectedStudentIds(new Set());
    }
    setStudentSearch('');
  }, [course, open]);

  // ── Pre-select enrolled students based on user profiles ──
  useEffect(() => {
    if (course && allUsers.length > 0) {
      const courseId = getSafeId(course);
      const enrolledIds = allUsers
        .filter((u) => {
          if (u.role !== 'STUDENT') return false;
          const courses = (u as any).profile?.data?.enrolledCourses || [];
          return courses.some((cId: any) => getSafeId(cId) === courseId);
        })
        .map((u) => getSafeId(u));
      setSelectedStudentIds(new Set(enrolledIds));
    }
  }, [course, allUsers]);

  // ── Derived lists ──
  const instructors = useMemo(() => {
    const filtered = allUsers.filter((u) => u.role === 'INSTRUCTOR');
    // Sort: instructors in this department first
    return filtered.sort((a, b) => {
      const aDept = resolveUserDeptId(a) === departmentId ? 0 : 1;
      const bDept = resolveUserDeptId(b) === departmentId ? 0 : 1;
      return aDept - bDept;
    });
  }, [allUsers, departmentId]);

  const filteredStudents = useMemo(() => {
    let students = allUsers.filter((u) => u.role === 'STUDENT');
    if (deptFilterOn) {
      students = students.filter((u) => resolveUserDeptId(u) === departmentId);
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      students = students.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return students;
  }, [allUsers, deptFilterOn, departmentId, studentSearch]);

  const toggleStudent = (uid: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !courseCode) {
      toast.error('Course Name and Code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name,
          courseCode,
          description: description || undefined,
          departmentId,
          instructorId: instructorId || undefined,
          credits: credits !== '' ? Number(credits) : undefined,
          isActive: true,
        },
        Array.from(selectedStudentIds) // Always pass array, even if empty, to trigger un-enrollment
      );
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="xl"
      className="max-w-3xl bg-app border-panel"
    >
      <Modal.Header
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-content tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BookOpen className="h-5 w-5 text-indigo-400" />
              </div>
              {course ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="text-content-muted text-[10px] font-bold uppercase tracking-widest mt-1">
              Academic Program Configuration
            </p>
          </div>
        }
        onClose={onClose}
      />

      <Modal.Body className="p-8 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Name & Code ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
                Course Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Introduction to Programming"
                className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-indigo-500"
                startIcon={<BookOpen className="h-4 w-4 text-content-muted" />}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
                Course Code
              </Label>
              <Input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS101"
                className="bg-app border-panel-hover text-content h-12 rounded-xl font-mono focus:ring-indigo-500"
                startIcon={<Code className="h-4 w-4 text-content-muted" />}
              />
            </div>
          </div>

          {/* ── Instructor Dropdown & Credits ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
                Instructor
              </Label>
              <div className="relative">
                <GraduationCap className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none z-10" />
                {isLoadingUsers ? (
                  <div className="flex items-center gap-3 h-12 px-4 ps-11 rounded-xl bg-app border border-panel-hover text-content-muted text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <>
                    <select
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      className="w-full h-12 ps-11 pe-10 rounded-xl bg-app border border-panel-hover text-content text-sm font-medium appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="" className="bg-app text-content-muted">
                        — Select Instructor —
                      </option>
                      {instructors.map((user) => {
                        const uid = resolveUserId(user);
                        const inDept = resolveUserDeptId(user) === departmentId;
                        return (
                          <option key={uid} value={uid} className="bg-app text-content">
                            {user.firstName} {user.lastName}{inDept ? ' ★' : ''} — {user.email}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                  </>
                )}
              </div>
              {!isLoadingUsers && instructors.some((u) => resolveUserDeptId(u) === departmentId) && (
                <p className="text-[10px] text-indigo-400/60 font-bold ms-1">★ = Instructor in this department</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
                Credits
              </Label>
              <Input
                type="number"
                value={credits}
                onChange={(e) =>
                  setCredits(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="e.g. 3"
                min={0}
                max={12}
                className="bg-app border-panel-hover text-content h-12 rounded-xl focus:ring-indigo-500"
                startIcon={<Hash className="h-4 w-4 text-content-muted" />}
              />
            </div>
          </div>

          {/* ── Description ── */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1">
              Course Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide an overview of the course curriculum and objectives..."
              className="bg-app border-panel-hover text-content min-h-[100px] rounded-2xl focus:ring-indigo-500 p-4"
            />
          </div>

          {/* ── Student Enrollment Multi-Select ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-content-muted ms-1 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Enroll Students
              </Label>
              {/* Department filter toggle */}
              <button
                type="button"
                onClick={() => setDeptFilterOn((prev) => !prev)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg hover:bg-panel-hover"
              >
                <div
                  className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ${
                    deptFilterOn ? 'bg-indigo-600' : 'bg-white/10'
                  }`}
                  style={{ height: '18px' }}
                >
                  <div
                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      deptFilterOn ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className={deptFilterOn ? 'text-indigo-400' : 'text-content-muted'}>
                  This Dept Only
                </span>
              </button>
            </div>

            {/* Selected pills */}
            {selectedStudentIds.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedStudentIds).map((sid) => {
                  const student = allUsers.find((u) => resolveUserId(u) === sid);
                  return (
                    <span
                      key={sid}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-[11px] font-bold border border-indigo-500/20"
                    >
                      {student ? `${student.firstName} ${student.lastName}` : sid}
                      <button
                        type="button"
                        onClick={() => toggleStudent(sid)}
                        className="hover:text-content transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <span className="text-[10px] font-black text-slate-600 uppercase self-center ms-1">
                  {selectedStudentIds.size} selected
                </span>
              </div>
            )}

            {/* Search and Select All */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students by name or email..."
                  className="w-full h-10 ps-9 pe-4 rounded-xl bg-app border border-panel-hover text-content text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>
              {filteredStudents.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4 rounded-xl text-xs font-bold border-panel-hover hover:bg-panel-hover hover:text-content text-content-muted transition-colors"
                  onClick={() => {
                    const filteredIds = filteredStudents.map(s => resolveUserId(s));
                    const allSelected = filteredIds.every(id => selectedStudentIds.has(id));
                    
                    setSelectedStudentIds(prev => {
                      const next = new Set(prev);
                      if (allSelected) {
                        filteredIds.forEach(id => next.delete(id));
                      } else {
                        filteredIds.forEach(id => next.add(id));
                      }
                      return next;
                    });
                  }}
                >
                  {filteredStudents.every(s => selectedStudentIds.has(resolveUserId(s))) ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {/* Student list */}
            <div className="max-h-48 overflow-y-auto rounded-xl bg-app border border-panel divide-y divide-panel custom-scrollbar">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center gap-2 py-8 text-content-muted text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-slate-600 text-xs font-bold">
                  No students found
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const uid = resolveUserId(student);
                  const isSelected = selectedStudentIds.has(uid);
                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => toggleStudent(uid)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-panel-hover ${
                        isSelected ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500'
                            : 'border-white/15 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-content" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-content truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[10px] text-content-muted font-mono truncate">
                          {student.email}
                        </p>
                      </div>
                      {student.academicYear && (
                        <span className="text-[9px] font-black text-slate-600 uppercase">
                          Year {student.academicYear}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="pt-4 border-t border-panel flex justify-end gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              className="h-12 px-6 rounded-xl text-content-muted hover:text-content hover:bg-panel-hover"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {course ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
