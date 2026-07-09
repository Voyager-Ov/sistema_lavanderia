"use client"

import React from "react"
import { AppSidebar, NavItem } from "@/shared/ui/layout/app-sidebar"
import { AppHeader, BreadcrumbItem } from "@/shared/ui/layout/app-header"
import { SidebarProvider } from "@/shared/ui/layout/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  mainMenu?: NavItem[]
  accountMenu?: NavItem[]
  onLogout?: () => void
}

export function AppLayout({
  children,
  title,
  breadcrumbs,
  mainMenu,
  accountMenu,
  onLogout
}: AppLayoutProps) {
  return (
    <SidebarProvider className="bg-white p-4 gap-4">
      <AppSidebar 
        mainMenu={mainMenu}
        accountMenu={accountMenu}
        onLogout={onLogout}
      />
      <main className="flex-1 h-[calc(100vh-2rem)] my-auto bg-[#FAFAFA] rounded-[2rem] shadow-xl border border-gray-200 overflow-y-auto flex flex-col relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Header */}
            <AppHeader breadcrumbs={breadcrumbs} title={title} />
            
            {/* Main Content Area */}
            <div className="flex-1 w-full p-6 sm:p-10 pb-28 md:pb-10">
              {children}
            </div>
      </main>
    </SidebarProvider>
  )
}
