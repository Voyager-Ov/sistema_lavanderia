"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/shared/ui/layout/sidebar"
import { 
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LayoutDashboard, ShoppingCart, Wallet, Utensils, Box, Users, FileText, User, Settings
} from "lucide-react"
import { useTheme } from "next-themes"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/overlays/collapsible"
import { LoadingBars } from "@/shared/ui/feedback/loading-bars"
import { useRouter, usePathname } from "next/navigation"
import { MobileBottomNav } from "./mobile-nav/mobile-bottom-nav"

export interface NavSubItem {
  title: string
  href: string
}

export interface NavItem {
  title: string
  icon: React.ElementType
  href: string
  isActive?: boolean
  children?: NavSubItem[]
}

export interface AppSidebarProps {
  portalName?: string
  portalSubtitle?: string
  mainMenu?: NavItem[]
  accountMenu?: NavItem[]
  onLogout?: () => void
}

// Defaults for demonstration if no props are passed
const defaultMainMenu: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Pedidos", icon: ShoppingCart, href: "/pedidos" },
  { title: "Caja", icon: Wallet, href: "/caja" },
  { title: "Menú y Productos", icon: Utensils, href: "/menu", isActive: true },
  { title: "Insumos", icon: Box, href: "/insumos" },
  { title: "Empleados", icon: Users, href: "/empleados" },
  { 
    title: "Reportes", 
    icon: FileText, 
    href: "/reportes",
    children: [
      { title: "Ventas Diarias", href: "/reportes/ventas" },
      { title: "Rendimiento", href: "/reportes/rendimiento" }
    ]
  }
]

const defaultAccountMenu: NavItem[] = [
  { title: "Mi Perfil", icon: User, href: "/perfil" },
  { title: "Configuración", icon: Settings, href: "/admin/configuraciones" },
]

export function AppSidebar({
  portalName = "Alquimia",
  portalSubtitle = "Admin Panel",
  mainMenu = defaultMainMenu,
  accountMenu = defaultAccountMenu,
  onLogout
}: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  // Theme management
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  // Inside AppSidebar:
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavClick = () => {
    setIsNavigating(true)
    setTimeout(() => {
      setIsNavigating(false)
    }, 1000)
  }

  const colors = [
    { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: "text-red-500", dot: "bg-red-500", hover: "hover:bg-red-50 dark:hover:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
    { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", icon: "text-blue-500", dot: "bg-blue-500", hover: "hover:bg-blue-50 dark:hover:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
    { bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", icon: "text-yellow-500", dot: "bg-yellow-500", hover: "hover:bg-yellow-50 dark:hover:bg-yellow-500/10", border: "border-yellow-200 dark:border-yellow-500/20" },
    { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", icon: "text-green-500", dot: "bg-green-500", hover: "hover:bg-green-50 dark:hover:bg-green-500/10", border: "border-green-200 dark:border-green-500/20" },
  ]

  return (
    <>
    <Sidebar 
      collapsible="icon" 
      className="border-none bg-[#FAFAFA] dark:bg-neutral-900 rounded-[2rem] h-[calc(100vh-2rem)] my-auto shadow-xl dark:shadow-none border border-gray-200 dark:border-neutral-800 overflow-hidden transition-colors duration-300"
    >
      <SidebarHeader className="px-4 py-6 border-b border-gray-100 dark:border-neutral-800 flex-shrink-0 transition-colors">
        <div className={`flex items-center h-10 w-full cursor-pointer ${isCollapsed ? 'justify-center' : ''}`} onClick={handleNavClick}>
          {isCollapsed ? (
             <LoadingBars collapsed={true} isLoading={isNavigating} />
          ) : (
            <>
              <LoadingBars collapsed={false} isLoading={isNavigating} />
              <div className="flex flex-col ml-3 justify-center whitespace-nowrap">
                <h2 className="font-extrabold text-gray-900 dark:text-neutral-100 leading-none text-xl transition-colors">{portalName}</h2>
                <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 tracking-widest uppercase mt-1 transition-colors">{portalSubtitle}</p>
              </div>
            </>
          )}
        </div>
      </SidebarHeader>

      <div className="px-3 py-3 border-b border-gray-100 dark:border-neutral-800 flex-shrink-0 transition-colors">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center h-11 px-3 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">Colapsar</span>
            </>
          )}
        </button>
      </div>

      <SidebarContent className="px-3 py-4 flex flex-col flex-1 overflow-hidden">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 flex-shrink-0 transition-none group-data-[collapsible=icon]:!mt-0 group-data-[collapsible=icon]:!opacity-100 ${isCollapsed ? 'text-center flex justify-center' : ''}`}>
            {isCollapsed ? "-" : "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              
              {mainMenu.map((item, index) => {
                const color = colors[index % colors.length]
                const isActive = item.href ? pathname.startsWith(item.href) : item.isActive

                if (item.children && item.children.length > 0) {
                  // Check if any child is active
                  const isChildActive = item.children.some(child => pathname.startsWith(child.href))
                  const isParentActive = isActive || isChildActive

                  return (
                    <Collapsible key={item.title} defaultOpen={isParentActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className={`h-11 rounded-xl flex items-center px-3 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${isCollapsed ? 'justify-center' : 'gap-3 justify-between'}`}>
                            {isCollapsed ? (
                               <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : 'text-gray-400 dark:text-neutral-500'}`} />
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                                  </div>
                                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : 'text-gray-400 dark:text-neutral-500'}`} />
                                  <span className="font-medium whitespace-nowrap">{item.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-neutral-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!isCollapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub className="mr-0 pr-0 border-l-2 ml-[1.6rem] mt-1 border-gray-100 dark:border-neutral-800">
                              {item.children.map(sub => (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton asChild onClick={handleNavClick} className="h-9 rounded-lg text-gray-600 dark:text-neutral-400 font-medium hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <Link href={sub.href}>{sub.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title} 
                      onClick={handleNavClick}
                      className={`h-11 rounded-xl flex items-center px-3 transition-colors ${
                        isActive 
                          ? `${color.bg} ${color.text} shadow-sm border border-transparent` 
                          : `text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 ${color.hover}`
                      } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                    >
                      <Link href={item.href}>
                        {isCollapsed ? (
                           <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : "text-gray-400 dark:text-neutral-500"}`} />
                        ) : (
                          <>
                            <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? color.dot : 'bg-transparent'}`} />
                            </div>
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : "text-gray-400 dark:text-neutral-500"}`} />
                            <span className={`font-medium whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>
                              {item.title}
                            </span>
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />

        <div className="mx-4 my-2 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0 transition-colors" />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 flex-shrink-0 transition-none group-data-[collapsible=icon]:!mt-0 group-data-[collapsible=icon]:!opacity-100 ${isCollapsed ? 'text-center flex justify-center' : ''}`}>
            {isCollapsed ? "-" : "Cuenta"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {/* Toggle de Modo Claro / Oscuro */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip={isDark ? "Modo Claro" : "Modo Oscuro"} 
                  onClick={toggleTheme} 
                  className={`h-11 rounded-xl flex items-center px-3 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${isCollapsed ? 'justify-center' : 'gap-3 justify-between'}`}
                >
                  {isCollapsed ? (
                    isDark ? (
                      <Sun className="h-5 w-5 flex-shrink-0 text-amber-400" />
                    ) : (
                      <Moon className="h-5 w-5 flex-shrink-0 text-indigo-500" />
                    )
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                        </div>
                        {isDark ? (
                          <Sun className="h-5 w-5 flex-shrink-0 text-amber-400" />
                        ) : (
                          <Moon className="h-5 w-5 flex-shrink-0 text-indigo-500" />
                        )}
                        <span className="font-medium whitespace-nowrap">
                          {isDark ? "Modo Claro" : "Modo Oscuro"}
                        </span>
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-gray-300'} flex items-center`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {accountMenu.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} onClick={handleNavClick} className={`h-11 rounded-xl flex items-center px-3 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Link href={item.href}>
                      {isCollapsed ? (
                        <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-neutral-500" />
                      ) : (
                        <>
                          <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                          </div>
                          <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-neutral-500" />
                          <span className="font-medium whitespace-nowrap">{item.title}</span>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0 transition-colors">
        <SidebarMenuButton asChild onClick={(e) => {
          if (onLogout) {
            e.preventDefault();
            onLogout();
          } else {
            handleNavClick();
          }
        }} className={`h-12 rounded-xl flex items-center px-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <a href="#">
            {isCollapsed ? (
              <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
            ) : (
              <>
                <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </div>
                <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
                <span className="font-bold whitespace-nowrap">Cerrar sesión</span>
              </>
            )}
          </a>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
    <MobileBottomNav 
      mainMenu={mainMenu} 
      accountMenu={accountMenu} 
      onLogout={onLogout} 
      colors={colors} 
    />
    </>
  )
}
