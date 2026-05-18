import { useMemo, useState, useEffect } from "react"
import { Search, Plus, Sparkles, Users, BarChart3, ClipboardList, MoreVertical, Loader2, Trash2, Edit3, FileText, Lock, Unlock, Share2 } from "lucide-react"
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
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalResponses, setTotalResponses] = useState<number | null>(null)

  const fetchForms = async () => {
    setIsLoading(true)
    try {
      const data = await formApi.getAllForms()
      setForms(data)

      // Aggregate total responses across all forms
      const counts = await Promise.allSettled(
        data.map((f) => getFormSubmissions(f.id))
      )
      const total = counts.reduce((sum, r) => {
        if (r.status === "fulfilled") return sum + r.value.length
        return sum
      }, 0)
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
    return forms.filter((row) => {
      const matchesTab =
        tab === "all" ||
        (tab === "active" && row.is_active) ||
        (tab === "closed" && !row.is_active)

      const matchesQuery =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)

      return matchesTab && matchesQuery
    })
  }, [tab, query, forms])

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Forms &amp; Surveys
          </h2>
          <p className="text-slate-400 font-medium">Design and manage institutional evaluations and performance reviews.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/builder")}
            className="flex-1 md:flex-none h-12 rounded-xl border-white/10 hover:bg-white/5 text-slate-300 font-bold"
          >
            <Plus className="mr-2 h-5 w-5" />
            Blank Form
          </Button>
          <Button className="flex-1 md:flex-none h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 font-black text-white hover:opacity-90 shadow-xl shadow-indigo-500/20">
            <Sparkles className="mr-2 h-5 w-5" />
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
          <div key={i} className="p-6 rounded-2xl bg-[#1e1b2e] border border-white/5 shadow-lg flex items-center justify-between group hover:border-white/10 transition-all">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-white mt-1">
                {isLoading
                  ? <span className="inline-block h-7 w-12 rounded-md bg-white/5 animate-pulse" />
                  : stat.count}
              </h4>
            </div>
            <div className={cn("p-3 rounded-xl bg-white/5 transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#1e1b2e] p-3 rounded-2xl border border-white/5">
          <div className="flex gap-1 p-1 bg-[#0f111a] rounded-xl border border-white/5 w-full lg:w-auto">
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
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-96">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or description..."
              startIcon={<Search className="h-4 w-4 text-slate-500" />}
              className="h-11 rounded-xl bg-[#0f111a] border-white/10 text-white focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Forms Table */}
        <div className="rounded-2xl border border-white/5 bg-[#1e1b2e] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-8 py-5">Form Architecture</th>
                  <th className="px-6 py-5">Targeting</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Engagement</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Survey Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <ClipboardList className="h-16 w-16 text-slate-500" />
                        <p className="text-lg font-bold text-slate-500">No forms found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110 duration-300",
                            row.is_active ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-500/10 text-slate-500"
                          )}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-lg font-black text-white truncate leading-tight">
                              {row.title}
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-2">
                              By {row.creator_id?.firstName || 'System Admin'}
                              <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                              {new Date(row.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest">
                            {row.subject_role} Subject
                          </Badge>
                          <div className="flex flex-wrap gap-1">
                            {row.evaluator_roles.map(role => (
                              <span key={role} className="text-[8px] font-bold text-slate-500 uppercase">{role}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge
                          variant={row.is_active ? "success" : "secondary"}
                          className="font-black px-3 py-1 text-[10px] uppercase tracking-widest rounded-lg"
                        >
                          {row.is_active ? 'Active' : 'Closed'}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-white">{row.questions?.length ?? 0}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Questions</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/dashboard/forms-results/${row._id || row.id}`)}
                            className="h-10 px-4 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold flex items-center gap-2"
                          >
                            <BarChart3 className="h-4 w-4" /> Results
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5 text-slate-400">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1e1b2e] border-white/5 text-slate-200 min-w-[160px]">
                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-white/5 cursor-pointer font-bold py-3"
                                onClick={() => navigate(`/builder/${row._id || row.id}`)}
                              >
                                <Edit3 className="h-4 w-4 text-indigo-400" /> Edit Form
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-white/5 cursor-pointer font-bold py-3"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/form/${row._id || row.id}`)
                                  toast.success("Share link copied to clipboard")
                                }}
                              >
                                <Share2 className="h-4 w-4 text-sky-400" /> Copy Share Link
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 hover:bg-white/5 cursor-pointer font-bold py-3"
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
