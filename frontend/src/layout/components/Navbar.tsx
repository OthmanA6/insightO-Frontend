import React from "react"
import { Search, Bell, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
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

export function Navbar() {
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
        
        {/* Notification Bell */}
        <button className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "relative h-9 w-9 p-0 rounded-full")}>
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500"></span>
          <span className="sr-only">Notifications</span>
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
            <Avatar className="h-9 w-9 border border-border cursor-pointer">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="@user" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}