import { useMemo, useState, useEffect } from "react"
import { Search, Plus, Sparkles, Users, BarChart3, ClipboardList, MoreVertical, Loader2, Trash2, Edit3, FileText, Lock, Unlock, Share2, ArrowUpDown, ArrowUp, ArrowDown, Building, Filter } from "lucide-react"
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

type TabKey = "all" | "active" | "closed"

export default function FormsSurveysPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>("all")
  const [query, setQuery] = useState("")
  const [targetFilter, setTargetFilter] = useState<string>("all")
  const [forms, setForms] = useState<(Form & { responsesCount?: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalResponses, setTotalResponses] = useState<number | null>(null)

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
      const data = await formApi.getAllForms()
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

      const matchesTarget = targetFilter === "all" || row.subject_role === targetFilter

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
          <Button
            variant="outline"
            onClick={() => navigate("/builder")}
            className="flex-1 md:flex-none h-12 rounded-xl border-panel-hover hover:bg-panel-hover text-content-muted font-bold"
          >
            <Plus className="me-2 h-5 w-5" />
            Blank Form
          </Button>
          <Button className="flex-1 md:flex-none h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 font-black text-content hover:opacity-90 shadow-xl shadow-indigo-500/20">
            <Sparkles className="me-2 h-5 w-5" />
            Create with AI
          </Button>
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
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-content-muted" />
              </div>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="h-11 w-full sm:w-auto rounded-xl bg-app border border-panel-hover text-content-muted focus:ring-indigo-500 focus:border-indigo-500 pl-10 pr-8 text-sm outline-none transition-colors appearance-none cursor-pointer hover:border-indigo-500/50"
              >
                <option value="all">All Targets</option>
                <option value="FACILITY">Facilities</option>
                <option value="COURSE">Courses</option>
                <option value="DEPARTMENT">Departments</option>
                <option value="INSTRUCTOR">Instructors</option>
              </select>
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
                  visibleRows.map((row) => (
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
                          {row.subject_role === 'FACILITY' ? (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest">
                              {((row as any).facility_id)?.name || 'Facility'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest">
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
                                  navigator.clipboard.writeText(`${window.location.origin}/form/${row._id || row.id}`)
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
        </div>
      </div>
    </div>
  )
}
