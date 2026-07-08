import { Link } from "react-router-dom"
import { Search, Bell, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { buttonVariants } from "@/shared/components/ui/button"
// 1️⃣ استيراد الـ Hook الذكي والـ Auth المصلح
import { useAuth } from "@/features/auth/hooks/useAuth"

export function Navbar() {
  // 2️⃣ استخراج دالة الـ logout وبيانات اليوزر الحالية
  const { logout, user } = useAuth()

  // حساب الحروف الأولى للاسم للـ Fallback (مثلاً Amr Khaled -> AK)
  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}` : 'JD'
  const userFullName = user ? `${user.firstName} ${user.lastName}` : 'My Account'

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">

      {/* Left side: Search */}
      <div className="flex w-full max-w-sm items-center">
        <Input
          type="search"
          placeholder="Search..."
          startIcon={<Search className="h-4 w-4" />}
          className="bg-background/50 backdrop-blur-sm"
        />
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-4">



        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
            <Avatar className="h-9 w-9 border border-border cursor-pointer">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="@user" />
              {/* 3️⃣ جعل الـ Fallback ديناميكي باسم الطالب أو الدكتور الحقيقي */}
              <AvatarFallback className="bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">{userInitials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-panel border-panel text-content">
            {/* 4️⃣ عرض اسم المستخدم الفعلي المسجل حالياً في الـ SaaS */}
            <DropdownMenuLabel className="font-bold text-content-muted">{userFullName}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-panel-hover" />
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-panel-hover">
              <Link to="/dashboard/profile" className="w-full flex items-center">
                <User className="me-2 h-4 w-4 text-content-muted" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-panel-hover" />

            {/* 5️⃣ السحر هنا: ربط حدث الـ onClick بالدالة القوية المصلحة فوراً */}
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-bold"
            >
              <LogOut className="me-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}