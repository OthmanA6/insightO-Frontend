import React from "react"
import { NavLink } from "react-router-dom"
import { LayoutDashboard, FileText, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Forms & Surveys", href: "/dashboard/forms-surveys", icon: FileText },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
      {...props}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          insightO
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  buttonVariants({ variant: isActive ? "outline" : "ghost" }),
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}