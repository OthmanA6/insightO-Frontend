import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, ClipboardList, Sparkles, MoreVertical, Loader2, Trash2, Edit3, FileText, Lock, Unlock, Share2, BarChart3, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '@/shared/api/axiosInstance';
import { toast } from 'sonner';
import { EntityInsightsView } from '@/components/EntityInsightsView';
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/shared/components/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"
import * as formApi from "@/features/FormBuilder/api/formApi"

export default function FacilityViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "forms">("insights");
  const [forms, setForms] = useState<any[]>([]);

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

  const handleToggleActive = async (row: any) => {
    const newStatus = !row.is_active
    try {
      await formApi.updateFormSettings(row._id || row.id, { is_active: newStatus })
      toast.success(newStatus ? "Form reactivated" : "Form closed successfully")
      setForms(forms.map(f => (f._id === row._id || f.id === row.id) ? { ...f, is_active: newStatus } : f))
    } catch (error) {
      toast.error("Failed to update Form status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) return
    try {
      await formApi.deleteForm(id)
      toast.success("Form deleted successfully")
      setForms(forms.filter(f => (f._id !== id && f.id !== id)))
    } catch (error) {
      toast.error("Failed to delete form")
    }
  }

  const sortedForms = [...forms].sort((a, b) => {
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

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/facilities/${id}`);
        setFacility(res.data.data.facility);
      } catch (err) {
        toast.error('Failed to load facility details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchFacility();
  }, [id]);

  useEffect(() => {
    const fetchForms = async () => {
      if (activeTab === "forms" && id) {
        try {
          const res = await api.get(`/v1/form?facility_id=${id}`);
          const fetchedForms = res.data.data || [];
          setForms(fetchedForms);
        } catch (err) {
          console.error(err);
          toast.error('Failed to load forms');
        }
      }
    };
    fetchForms();
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-app">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!facility) {
    return <div className="p-8 text-content">Facility not found.</div>;
  }

  return (
    <div className="min-h-screen bg-app text-content">
      {/* Header */}
      <div className="bg-panel border-b border-panel-hover px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-content-muted mb-4 font-medium">
          <button onClick={() => navigate('/dashboard/forms-surveys')} className="hover:text-content transition-colors">Forms & Surveys</button>
          <span className="text-content-muted/50">/</span>
          <button onClick={() => navigate('/dashboard/facilities')} className="hover:text-content transition-colors">Custom Facilities</button>
          <span className="text-content-muted/50">/</span>
          <span className="text-content">{facility.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <Building className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{facility.name}</h1>
            <p className="text-content/60">{facility.description}</p>
          </div>
          <button
            onClick={() => navigate(`/builder?target=facility&facilityId=${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-panel border border-panel-hover rounded-xl transition-all font-medium text-sm text-content hover:text-indigo-400"
          >
            <ClipboardList className="w-4 h-4" />
            Blank Form
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-8 border-b border-panel-hover">
          <button
            onClick={() => setActiveTab("insights")}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
              activeTab === "insights" ? "text-indigo-400" : "text-content/60 hover:text-content"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </div>
            {activeTab === "insights" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("forms")}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
              activeTab === "forms" ? "text-indigo-400" : "text-content/60 hover:text-content"
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Surveys/Forms
            </div>
            {activeTab === "forms" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === "insights" ? (
          <EntityInsightsView entityType="FACILITY" entityId={id as string} />
        ) : (
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                          <p className="text-sm font-bold text-content-muted uppercase tracking-widest">Loading Forms...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sortedForms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <ClipboardList className="h-16 w-16 text-content-muted" />
                          <p className="text-lg font-bold text-content-muted">No forms found matching your criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedForms.map((row) => (
                      <tr key={row.id || row._id} className="group hover:bg-panel-hover transition-colors">
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
                                {(row.facility_id)?.name || 'Facility'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-fit bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0 font-black text-[9px] uppercase tracking-widest">
                                {row.subject_role} Subject
                              </Badge>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {row.evaluator_roles?.map((role: string) => (
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
        )}
      </div>
    </div>
  );
}
