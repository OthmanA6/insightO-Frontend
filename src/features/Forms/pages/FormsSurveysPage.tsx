import { useMemo, useState, useEffect } from "react"
import { Search, Plus, Sparkles, Users, BarChart3, ClipboardList, MoreVertical, Loader2, Trash2, Edit3, FileText, Lock, Unlock, Share2, ArrowUpDown, ArrowUp, ArrowDown, Building, Filter, LayoutGrid, BookOpen, Building2, Hospital, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/shared/components/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"
import * as formApi from "@/features/FormBuilder/api/formApi"
import { getFormSubmissions } from "@/shared/api/submissionApi"
import type { Form } from "@/features/FormBuilder/types/form.types"
import { toast } from "sonner"
import { Modal } from "@/shared/components/ui/Modal"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs"

type TabKey = "all" | "active" | "closed"

export default function FormsSurveysPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>("all")
  const [query, setQuery] = useState("")
  const [targetFilter, setTargetFilter] = useState<string>("all")
  const [forms, setForms] = useState<(Form & { responsesCount?: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalResponses, setTotalResponses] = useState<number | null>(null)
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'broad' | 'courses' | 'departments' | 'instructors' | 'facilities'>('broad')
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [sortField, setSortField] = useState<"date" | "status" | "questions" | "responses">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleSort = (field: "date" | "status" | "questions" | "responses") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const SortIcon = ({ field }: { field: "date" | "status" | "questions" | "responses" }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ms-1 opacity-40 group-hover:opacity-100 transition-opacity" />
    return sortOrder === "asc" ? <ArrowUp className="h-3 w-3 ms-1 text-indigo-400" /> : <ArrowDown className="h-3 w-3 ms-1 text-indigo-400" />
  }

  const fetchForms = async () => {
    setIsLoading(true)
    try {
      const rawData = await formApi.getAllForms()
      const data = rawData.filter((f: any) => f.category !== 'QUIZ')
      setForms(data)

      // Aggregate total responses across all forms
      const counts = await Promise.allSettled(
        data.map((f) => getFormSubmissions(f._id || f.id))
      )

      let total = 0
      const enrichedForms = data.map((f, index) => {
        const countResult = counts[index]
        const responsesCount = countResult.status === "fulfilled" ? countResult.value.length : 0
        total += responsesCount
        return { ...f, responsesCount }
      })

      // Sort enrichedForms by createdAt date descending
      enrichedForms.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

      setForms(enrichedForms)
      setTotalResponses(total)
    } catch (error) {
      toast.error("Failed to load forms and surveys")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const handleToggleActive = async (row: Form) => {
    const newStatus = !row.is_active
    try {
      await formApi.updateFormSettings(row._id || row.id, { is_active: newStatus })
      toast.success(newStatus ? "Form reactivated" : "Form closed successfully")
      fetchForms()
    } catch (error) {
      toast.error("Failed to update Form status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) return
    try {
      await formApi.deleteForm(id)
      toast.success("Form deleted successfully")
      fetchForms()
    } catch (error) {
      toast.error("Failed to delete form")
    }
  }

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = forms.filter((row) => {
      const matchesTab =
        tab === "all" ||
        (tab === "active" && row.is_active) ||
        (tab === "closed" && !row.is_active)

      const matchesQuery =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)

      let matchesTarget = true
      if (targetFilter !== "all") {
        if (targetFilter.includes('_')) {
          const [role, id] = targetFilter.split('_')
          if (row.subject_role !== role) {
            matchesTarget = false
          } else {
            if (role === 'COURSE' && (row as any).course_id?._id !== id) matchesTarget = false
            if (role === 'DEPARTMENT' && (row as any).department_id?._id !== id) matchesTarget = false
            if (role === 'INSTRUCTOR' && (row as any).instructor_id?._id !== id) matchesTarget = false
            if (role === 'FACILITY' && (row as any).facility_id?._id !== id) matchesTarget = false
          }
        } else {
          if (targetFilter === 'GENERAL') {
            matchesTarget = row.category === 'GENERAL' || row.subject_role === 'GENERAL'
          } else {
            matchesTarget = row.subject_role === targetFilter
          }
        }
      }

      return matchesTab && matchesQuery && matchesTarget
    })

    return filtered.sort((a, b) => {
      let cmp = 0
      if (sortField === "date") {
        cmp = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      } else if (sortField === "status") {
        cmp = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
      } else if (sortField === "questions") {
        cmp = (b.questions?.length || 0) - (a.questions?.length || 0)
      } else if (sortField === "responses") {
        cmp = (b.responsesCount || 0) - (a.responsesCount || 0)
      }
      return sortOrder === "desc" ? cmp : -cmp
    })
  }, [tab, query, forms, sortField, sortOrder, targetFilter])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [tab, query, targetFilter, sortField, sortOrder])

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return visibleRows.slice(start, start + itemsPerPage)
  }, [visibleRows, currentPage])
  const totalPages = Math.ceil(visibleRows.length / itemsPerPage)

  const specificTargets = useMemo(() => {
    const courses = new Map()
    const depts = new Map()
    const instructors = new Map()
    const facilities = new Map()

    forms.forEach((f: any) => {
      if (f.subject_role === 'COURSE' && f.course_id) courses.set(f.course_id._id, f.course_id.name)
      if (f.subject_role === 'DEPARTMENT' && f.department_id) depts.set(f.department_id._id, f.department_id.name)
      if (f.subject_role === 'INSTRUCTOR' && f.instructor_id) instructors.set(f.instructor_id._id, `${f.instructor_id.firstName} ${f.instructor_id.lastName}`)
      if (f.subject_role === 'FACILITY' && f.facility_id) facilities.set(f.facility_id._id, f.facility_id.name)
    })

    return { courses, depts, instructors, facilities }
  }, [forms])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300 max-w-[1400px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-content flex items-center gap-3">
            Forms &amp; Surveys
          </h2>
          <p className="text-content-muted font-medium">Design and manage institutional evaluations and performance reviews.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/facilities")}
            className="flex-1 md:flex-none h-12 rounded-xl border-panel-hover hover:bg-panel-hover text-content-muted font-bold"
          >
            <Building className="me-2 h-5 w-5" />
            Manage Facilities
          </Button>
          
          <button 
            onClick={() => navigate("/builder")} 
            className="relative inline-flex h-12 overflow-hidden rounded-xl p-[2px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-50 group flex-1 md:flex-none shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ffffff_0%,#393BB2_50%,#ffffff_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="inline-flex h-full w-full items-center justify-center rounded-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 px-6 font-black text-white backdrop-blur-3xl transition-all">
              <Plus className="me-2 h-5 w-5 text-white" />
              New Form
            </span>
          </button>
        </div>
      </div>

      {/* Stats Overview — 2 cards, Completion Rate removed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          {
            label: 'Active Surveys',
            count: isLoading ? '—' : forms.filter(f => f.is_active).length,
            icon: Users,
            color: 'text-indigo-400',
          },
          {
            label: 'Total Responses',
            count: isLoading ? '—' : totalResponses !== null ? totalResponses.toLocaleString() : '0',
            icon: BarChart3,
            color: 'text-emerald-400',
          },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-panel border border-panel shadow-lg flex items-center justify-between group hover:border-panel-hover transition-all">
            <div>
              <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-content mt-1">
                {isLoading
                  ? <span className="inline-block h-7 w-12 rounded-md bg-panel-hover animate-pulse" />
                  : stat.count}
              </h4>
            </div>
            <div className={cn("p-3 rounded-xl bg-panel-hover transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-panel p-3 rounded-2xl border border-panel">
          <div className="flex gap-1 p-1 bg-app rounded-xl border border-panel w-full lg:w-auto">
            {[
              { id: 'all', label: 'All Forms' },
              { id: 'active', label: 'Active' },
              { id: 'closed', label: 'Closed' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as TabKey)}
                className={cn(
                  "flex-1 lg:flex-none px-6 py-2 text-xs font-bold transition-all rounded-lg uppercase tracking-widest",
                  tab === t.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-content-muted hover:text-content-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:w-80">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description..."
                startIcon={<Search className="h-4 w-4 text-content-muted" />}
                className="h-11 rounded-xl bg-app border-panel-hover text-content focus:ring-indigo-500 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFilterModalOpen(true)}
                className={cn("h-11 w-full sm:w-auto rounded-xl bg-app border font-bold px-4 flex items-center justify-between transition-all overflow-hidden", targetFilter !== 'all' ? "border-indigo-500/50 text-indigo-400 shadow-sm" : "border-panel-hover text-content-muted hover:border-indigo-500/50 hover:text-indigo-400")}
              >
                <div className="flex items-center truncate w-full">
                  <Filter className="h-4 w-4 me-2 shrink-0" />
                  <span className="truncate text-left max-w-[120px] sm:max-w-[180px]">
                    {targetFilter === 'all' ? 'All Targets' : 
                     targetFilter === 'FACILITY' ? 'All Facilities' :
                     targetFilter === 'COURSE' ? 'All Courses' :
                     targetFilter === 'DEPARTMENT' ? 'All Departments' :
                     targetFilter === 'INSTRUCTOR' ? 'All Instructors' :
                     targetFilter === 'GENERAL' ? 'General Forms' :
                     targetFilter.startsWith('COURSE_') ? specificTargets.courses.get(targetFilter.replace('COURSE_', '')) || 'Specific Course' :
                     targetFilter.startsWith('DEPARTMENT_') ? specificTargets.depts.get(targetFilter.replace('DEPARTMENT_', '')) || 'Specific Department' :
                     targetFilter.startsWith('INSTRUCTOR_') ? specificTargets.instructors.get(targetFilter.replace('INSTRUCTOR_', '')) || 'Specific Instructor' :
                     targetFilter.startsWith('FACILITY_') ? specificTargets.facilities.get(targetFilter.replace('FACILITY_', '')) || 'Specific Facility' :
                     'Specific Target'}
                  </span>
                </div>
              </Button>
              {targetFilter !== 'all' && (
                <Button
                  variant="ghost"
                  onClick={() => setTargetFilter('all')}
                  className="h-11 w-11 p-0 rounded-xl bg-app border border-panel-hover hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 text-content-muted transition-all"
                  title="Clear Filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Forms Table */}
        <div className="rounded-2xl border border-panel bg-panel overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-panel bg-panel-hover text-[10px] uppercase tracking-widest text-content-muted font-black">
                  <th className="px-4 py-4 cursor-pointer group hover:bg-panel-hover hover:text-content transition-colors select-none whitespace-nowrap" onClick={() => handleSort('date')}>
                    <div className="flex items-center">Form Architecture <SortIcon field="date" /></div>
                  </th>
                  <th className="px-4 py-4 whitespace-nowrap">Targeting</th>
                  <th className="px-4 py-4 cursor-pointer group hover:bg-panel-hover hover:text-content transition-colors select-none whitespace-nowrap" onClick={() => handleSort('status')}>
                    <div className="flex items-center">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer group hover:bg-panel-hover hover:text-content transition-colors select-none whitespace-nowrap" onClick={() => handleSort('questions')}>
                    <div className="flex items-center">Questions <SortIcon field="questions" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer group hover:bg-panel-hover hover:text-content transition-colors select-none whitespace-nowrap" onClick={() => handleSort('responses')}>
                    <div className="flex items-center">Responses <SortIcon field="responses" /></div>
                  </th>
                  <th className="px-4 py-4 text-end whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                        <p className="text-sm font-bold text-content-muted uppercase tracking-widest">Synchronizing Survey Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <ClipboardList className="h-16 w-16 text-content-muted" />
                        <p className="text-lg font-bold text-content-muted">No forms found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id} className="group hover:bg-panel-hover transition-colors">
                      <td className="px-4 py-4 w-[35%]">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110 duration-300",
                            row.is_active ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-500/10 text-content-muted"
                          )}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-lg font-black text-content truncate leading-tight">
                              {row.title}
                            </div>
                            <div className="text-xs font-bold text-content-muted mt-0.5 flex items-center gap-2">
                              By {row.creator_id?.firstName || 'System Admin'}
                              <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                              {new Date(row.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[25%]">
                        <div className="flex flex-col gap-1.5">
                          {row.category === 'GENERAL' ? (
                            <Badge variant="outline" className="w-fit bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest truncate max-w-[120px]">
                              General Form
                            </Badge>
                          ) : row.subject_role === 'COURSE' ? (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest truncate max-w-[120px]">
                              {((row as any).course_id)?.name || 'Course'}
                            </Badge>
                          ) : row.subject_role === 'DEPARTMENT' ? (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest truncate max-w-[120px]">
                              {((row as any).department_id)?.name || 'Department'}
                            </Badge>
                          ) : row.subject_role === 'INSTRUCTOR' ? (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest truncate max-w-[120px]">
                              {((row as any).instructor_id)?.firstName} {((row as any).instructor_id)?.lastName || 'Instructor'}
                            </Badge>
                          ) : row.subject_role === 'FACILITY' ? (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest truncate max-w-[120px]">
                              {((row as any).facility_id)?.name || 'Facility'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest truncate max-w-[120px]">
                              {row.subject_role} Subject
                            </Badge>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {row.evaluator_roles?.map(role => (
                              <span key={role} className="text-[8px] font-bold text-content-muted uppercase">{role}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant={row.is_active ? "success" : "secondary"}
                          className="font-black px-3 py-1 text-[10px] uppercase tracking-widest rounded-lg"
                        >
                          {row.is_active ? 'Active' : 'Closed'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-content">{row.questions?.length ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-emerald-400">{row.responsesCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-end whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/dashboard/forms-results/${row._id || row.id}`)}
                            className="h-9 px-3 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold flex items-center gap-1.5 text-xs"
                          >
                            <BarChart3 className="h-3.5 w-3.5" /> Results
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-panel-hover text-content-muted">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-panel border-panel text-content min-w-[160px]">
                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-panel-hover cursor-pointer font-bold py-3"
                                onClick={() => navigate(`/builder/${row._id || row.id}`)}
                              >
                                <Edit3 className="h-4 w-4 text-indigo-400" /> Edit Form
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-panel-hover cursor-pointer font-bold py-3"
                                onClick={() => {
                                  const linkPath = row.category === 'GENERAL' 
                                    ? `/public/form/${row._id || row.id}`
                                    : `/form/${row._id || row.id}`
                                  navigator.clipboard.writeText(`${window.location.origin}${linkPath}`)
                                  toast.success("Share link copied to clipboard")
                                }}
                              >
                                <Share2 className="h-4 w-4 text-sky-400" /> Copy Share Link
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-panel-hover cursor-pointer font-bold py-3"
                                onClick={() => handleToggleActive(row)}
                              >
                                {row.is_active ? (
                                  <>
                                    <Lock className="h-4 w-4 text-amber-400" /> Close Form
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-4 w-4 text-emerald-400" /> Reactivate Form
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-red-500/10 text-red-400 cursor-pointer font-bold py-3"
                                onClick={() => handleDelete(row._id || row.id)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete Form
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!isLoading && visibleRows.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t border-panel">
              <div className="text-sm text-content-muted font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, visibleRows.length)} of {visibleRows.length} forms
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border-panel-hover hover:bg-panel-hover"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(idx + 1)}
                      className={cn(
                        "h-8 w-8 rounded-lg font-bold p-0",
                        currentPage === idx + 1 
                          ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-300"
                          : "text-content-muted hover:bg-panel-hover hover:text-content"
                      )}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border-panel-hover hover:bg-panel-hover"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Forms by Target"
        size="xl"
      >
        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Sidebar */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-panel-hover p-4 flex flex-col gap-2 bg-app/50 rounded-l-xl">
            <Button
              variant="ghost"
              onClick={() => setActiveModalTab('broad')}
              className={cn("justify-start font-bold", activeModalTab === 'broad' ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300" : "text-content-muted hover:text-content hover:bg-panel-hover")}
            >
              <LayoutGrid className="w-4 h-4 mr-3 opacity-70" /> Broad Filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveModalTab('courses')}
              className={cn("justify-start font-bold", activeModalTab === 'courses' ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300" : "text-content-muted hover:text-content hover:bg-panel-hover")}
            >
              <BookOpen className="w-4 h-4 mr-3 opacity-70" /> Courses
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveModalTab('departments')}
              className={cn("justify-start font-bold", activeModalTab === 'departments' ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300" : "text-content-muted hover:text-content hover:bg-panel-hover")}
            >
              <Building2 className="w-4 h-4 mr-3 opacity-70" /> Departments
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveModalTab('instructors')}
              className={cn("justify-start font-bold", activeModalTab === 'instructors' ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300" : "text-content-muted hover:text-content hover:bg-panel-hover")}
            >
              <Users className="w-4 h-4 mr-3 opacity-70" /> Instructors
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveModalTab('facilities')}
              className={cn("justify-start font-bold", activeModalTab === 'facilities' ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300" : "text-content-muted hover:text-content hover:bg-panel-hover")}
            >
              <Hospital className="w-4 h-4 mr-3 opacity-70" /> Facilities
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 bg-app rounded-r-xl max-h-[500px] overflow-y-auto">
            {activeModalTab === 'broad' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-content-muted uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-indigo-400" /> Broad Categorization
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant={targetFilter === 'all' ? 'default' : 'outline'} 
                    className={cn("h-16 justify-start px-6 rounded-xl font-bold border-panel-hover transition-all", targetFilter === 'all' && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                    onClick={() => { setTargetFilter('all'); setIsFilterModalOpen(false); }}
                  >
                    All Targets
                  </Button>
                  <Button 
                    variant={targetFilter === 'GENERAL' ? 'default' : 'outline'} 
                    className={cn("h-16 justify-start px-6 rounded-xl font-bold border-panel-hover transition-all", targetFilter === 'GENERAL' && "bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-500/20")}
                    onClick={() => { setTargetFilter('GENERAL'); setIsFilterModalOpen(false); }}
                  >
                    General Forms
                  </Button>
                  <Button 
                    variant={targetFilter === 'FACILITY' ? 'default' : 'outline'} 
                    className={cn("h-16 justify-start px-6 rounded-xl font-bold border-panel-hover transition-all", targetFilter === 'FACILITY' && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                    onClick={() => { setTargetFilter('FACILITY'); setIsFilterModalOpen(false); }}
                  >
                    All Facilities
                  </Button>
                  <Button 
                    variant={targetFilter === 'COURSE' ? 'default' : 'outline'} 
                    className={cn("h-16 justify-start px-6 rounded-xl font-bold border-panel-hover transition-all", targetFilter === 'COURSE' && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                    onClick={() => { setTargetFilter('COURSE'); setIsFilterModalOpen(false); }}
                  >
                    All Courses
                  </Button>
                  <Button 
                    variant={targetFilter === 'DEPARTMENT' ? 'default' : 'outline'} 
                    className={cn("h-16 justify-start px-6 rounded-xl font-bold border-panel-hover transition-all", targetFilter === 'DEPARTMENT' && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                    onClick={() => { setTargetFilter('DEPARTMENT'); setIsFilterModalOpen(false); }}
                  >
                    All Departments
                  </Button>
                  <Button 
                    variant={targetFilter === 'INSTRUCTOR' ? 'default' : 'outline'} 
                    className={cn("h-16 justify-start px-6 rounded-xl font-bold border-panel-hover transition-all", targetFilter === 'INSTRUCTOR' && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                    onClick={() => { setTargetFilter('INSTRUCTOR'); setIsFilterModalOpen(false); }}
                  >
                    All Instructors
                  </Button>
                </div>
              </div>
            )}

            {activeModalTab === 'courses' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-content-muted uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> Specific Courses
                </h3>
                {specificTargets.courses.size === 0 ? <p className="text-center text-content-muted py-12 font-medium">No course forms found.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(specificTargets.courses.entries()).map(([id, name]) => (
                      <Button 
                        key={id} variant={targetFilter === `COURSE_${id}` ? 'default' : 'outline'} 
                        onClick={() => { setTargetFilter(`COURSE_${id}`); setIsFilterModalOpen(false); }}
                        className={cn("min-h-[56px] h-auto py-3 px-4 justify-start text-left border-panel-hover overflow-hidden", targetFilter === `COURSE_${id}` && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                      >
                        <span className="whitespace-normal break-words text-left text-sm font-bold w-full line-clamp-2 leading-snug">{name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'departments' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-content-muted uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" /> Specific Departments
                </h3>
                {specificTargets.depts.size === 0 ? <p className="text-center text-content-muted py-12 font-medium">No department forms found.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from(specificTargets.depts.entries()).map(([id, name]) => (
                      <Button 
                        key={id} variant={targetFilter === `DEPARTMENT_${id}` ? 'default' : 'outline'} 
                        onClick={() => { setTargetFilter(`DEPARTMENT_${id}`); setIsFilterModalOpen(false); }}
                        className={cn("min-h-[56px] h-auto py-3 px-4 justify-start text-left border-panel-hover overflow-hidden", targetFilter === `DEPARTMENT_${id}` && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                      >
                        <span className="whitespace-normal break-words text-left text-sm font-bold w-full line-clamp-2 leading-snug">{name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'instructors' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-content-muted uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Specific Instructors
                </h3>
                {specificTargets.instructors.size === 0 ? <p className="text-center text-content-muted py-12 font-medium">No instructor forms found.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(specificTargets.instructors.entries()).map(([id, name]) => (
                      <Button 
                        key={id} variant={targetFilter === `INSTRUCTOR_${id}` ? 'default' : 'outline'} 
                        onClick={() => { setTargetFilter(`INSTRUCTOR_${id}`); setIsFilterModalOpen(false); }}
                        className={cn("min-h-[56px] h-auto py-3 px-4 justify-start text-left border-panel-hover overflow-hidden", targetFilter === `INSTRUCTOR_${id}` && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                      >
                        <span className="whitespace-normal break-words text-left text-sm font-bold w-full line-clamp-2 leading-snug">{name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'facilities' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-content-muted uppercase tracking-widest flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-indigo-400" /> Specific Facilities
                </h3>
                {specificTargets.facilities.size === 0 ? <p className="text-center text-content-muted py-12 font-medium">No facility forms found.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from(specificTargets.facilities.entries()).map(([id, name]) => (
                      <Button 
                        key={id} variant={targetFilter === `FACILITY_${id}` ? 'default' : 'outline'} 
                        onClick={() => { setTargetFilter(`FACILITY_${id}`); setIsFilterModalOpen(false); }}
                        className={cn("min-h-[56px] h-auto py-3 px-4 justify-start text-left border-panel-hover overflow-hidden", targetFilter === `FACILITY_${id}` && "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20")}
                      >
                        <span className="whitespace-normal break-words text-left text-sm font-bold w-full line-clamp-2 leading-snug">{name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
