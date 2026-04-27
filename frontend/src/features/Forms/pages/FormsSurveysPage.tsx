import React, { useMemo, useState } from "react"
import { Search, Plus, Sparkles, Users, Megaphone, ClipboardList, MoreVertical } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/lib/utils"

type FormType = "Internal" | "External"
type FormStatus = "Active" | "Closed"

type FormRow = {
  id: string
  name: string
  createdBy: string
  type: FormType
  status: FormStatus
  responses: number
  total?: number
  lastUpdated: string
  icon: React.ReactNode
  iconClassName: string
}

const FORMS: FormRow[] = [
  {
    id: "q1-360",
    name: "Q1 Manager 360 Review",
    createdBy: "Created by HR Dept",
    type: "Internal",
    status: "Active",
    responses: 142,
    total: 150,
    lastUpdated: "2 hours ago",
    icon: <Users className="h-5 w-5" />,
    iconClassName: "bg-indigo-500/10 text-indigo-400",
  },
  {
    id: "tech-summit",
    name: "Annual Tech Summit Feedback",
    createdBy: "Created by Marketing",
    type: "External",
    status: "Active",
    responses: 856,
    lastUpdated: "Yesterday",
    icon: <Megaphone className="h-5 w-5" />,
    iconClassName: "bg-purple-500/10 text-purple-400",
  },
  {
    id: "onboarding",
    name: "New Employee Onboarding Survey",
    createdBy: "Created by HR Dept",
    type: "Internal",
    status: "Closed",
    responses: 45,
    lastUpdated: "Oct 12, 2025",
    icon: <ClipboardList className="h-5 w-5" />,
    iconClassName: "bg-slate-500/10 text-slate-400",
  },
]

type TabKey = "all" | "internal" | "external"

export default function FormsSurveysPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>("all")
  const [query, setQuery] = useState("")

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FORMS.filter((row) => {
      const matchesTab =
        tab === "all" ||
        (tab === "internal" && row.type === "Internal") ||
        (tab === "external" && row.type === "External")

      const matchesQuery =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        row.createdBy.toLowerCase().includes(q)

      return matchesTab && matchesQuery
    })
  }, [tab, query])

  return (
    <div className="min-h-full">
      <div className="flex flex-col gap-1 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Forms &amp; Surveys
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage internal evaluations and external feedback.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="outline"
              onClick={() => navigate("/builder")}
              className="h-10 rounded-xl bg-white/60 dark:bg-surface-dark/60 backdrop-blur-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Blank Form
            </Button>
            <Button className="h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-5 font-bold text-white hover:from-purple-400 hover:to-indigo-400">
              <Sparkles className="mr-2 h-4 w-4" />
              Create with AI
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-surface-dark md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-bg-dark">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors rounded-md",
                tab === "all"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-surface-dark dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              All Forms
            </button>
            <button
              type="button"
              onClick={() => setTab("internal")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors rounded-md",
                tab === "internal"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-surface-dark dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Internal (Employees)
            </button>
            <button
              type="button"
              onClick={() => setTab("external")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors rounded-md",
                tab === "external"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-surface-dark dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              External (Public)
            </button>
          </div>

          <div className="w-full md:w-80">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search forms..."
              startIcon={<Search className="h-4 w-4" />}
              className="h-9 rounded-lg bg-white dark:bg-bg-dark"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-surface-dark/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Form Name</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Responses</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {visibleRows.map((row) => {
                  const isClosed = row.status === "Closed"
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50 dark:hover:bg-white/5",
                        isClosed && "opacity-75"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg",
                              row.iconClassName
                            )}
                          >
                            {row.icon}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-900 dark:text-white">
                              {row.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              {row.createdBy}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            row.type === "Internal"
                              ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                              : "border-purple-500/20 bg-purple-500/10 text-purple-400"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              row.type === "Internal" ? "bg-indigo-400" : "bg-purple-400"
                            )}
                          />
                          {row.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            row.status === "Active"
                              ? "bg-green-500/10 text-green-500 dark:text-green-400"
                              : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {row.responses}
                          </span>
                          {typeof row.total === "number" && (
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              / {row.total}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {row.lastUpdated}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="mr-3 font-semibold text-primary hover:text-slate-900 dark:text-primary dark:hover:text-white transition-colors"
                        >
                          Results
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                        >
                          <MoreVertical className="h-5 w-5" />
                          <span className="sr-only">More</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

