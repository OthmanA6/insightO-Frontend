import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, FileText, BarChart3, Settings, 
  Users, Building2, Building, Calendar, ShieldCheck, BookOpen, ClipboardCheck, FileQuestion, Zap
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { useAuth } from '@/features/auth/hooks/useAuth'

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { user } = useAuth();

  const adminNavGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Surveys & Evaluation",
      items: [
        { name: "Forms & Templates", href: "/dashboard/forms-surveys", icon: FileText },
      ]
    },
    {
      title: "Administration",
      items: [
        { name: "User Management", href: "/dashboard/users", icon: Users },
        { name: "Academic Entities", href: "/dashboard/departments", icon: Building2 },
      ]
    },
    {
      title: "System",
      items: [
        { name: "Security & Logs", href: "/dashboard/settings", icon: ShieldCheck },
        { name: "AI Token Usage", href: "/dashboard/ai-usage-dashboard", icon: Zap },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ]
    }
  ];

  const studentNavGroups = [
    {
      title: "My Portal",
      items: [
        { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Courses & Tasks", href: "/dashboard/courses-tasks", icon: BookOpen },
        { name: "My Evaluations", href: "/dashboard/student-evaluations", icon: ClipboardCheck },
        { name: "Pending Surveys", href: "/dashboard/student-surveys", icon: FileQuestion },
      ]
    }
  ];

  const instructorNavGroups = [
    {
      title: "Teaching Hub",
      items: [
        { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Courses", href: "/dashboard/courses", icon: BookOpen },
        { name: "Students Directory", href: "/dashboard/directory", icon: Users },
        { name: "AI Quota", href: "/dashboard/ai-usage-dashboard", icon: Zap },
      ]
    }
  ];

  const navGroups = user?.role === 'STUDENT' ? studentNavGroups : user?.role === 'INSTRUCTOR' ? instructorNavGroups : adminNavGroups;

  return (
    <aside
      className={cn(
        "flex h-screen w-72 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
      {...props}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-8">
        <div className="flex items-center gap-3 font-black text-xl tracking-tighter text-sidebar-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          insightO
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4 py-8">
        <nav className="flex flex-col gap-8">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-content-muted mb-4">{group.title}</h4>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        buttonVariants({ variant: isActive ? "outline" : "ghost" }),
                        "w-full justify-start gap-4 h-11 px-4 rounded-xl transition-all font-bold text-xs",
                        isActive 
                          ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20" 
                          : "text-content-muted hover:text-content hover:bg-panel-hover"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
