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
    <SidebarProvider className="bg-white dark:bg-neutral-900 p-4 gap-4 transition-colors duration-300">
      <AppSidebar 
        mainMenu={mainMenu}
        accountMenu={accountMenu}
        onLogout={onLogout}
      />
      <main className="flex-1 h-[calc(100vh-2rem)] my-auto bg-[#FAFAFA] dark:bg-neutral-900 rounded-[2rem] shadow-xl dark:shadow-none border border-gray-200 dark:border-neutral-800 overflow-y-auto flex flex-col relative transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
