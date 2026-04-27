import React from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./components/Sidebar"
import { Navbar } from "./components/Navbar"

export function MainLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      
      {/* Sidebar Component */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Navbar Component */}
        <Navbar />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        
      </div>
    </div>
  )
}