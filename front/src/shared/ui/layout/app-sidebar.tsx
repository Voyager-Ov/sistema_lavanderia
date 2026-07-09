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
  LayoutDashboard, ShoppingCart, Wallet, Utensils, Box, Users, FileText, User, Settings
} from "lucide-react"
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
  { title: "Configuración", icon: Settings, href: "/configuracion" },
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
    { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500", dot: "bg-red-500", hover: "hover:bg-red-50", border: "border-red-200" },
    { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500", dot: "bg-blue-500", hover: "hover:bg-blue-50", border: "border-blue-200" },
    { bg: "bg-yellow-50", text: "text-yellow-600", icon: "text-yellow-500", dot: "bg-yellow-500", hover: "hover:bg-yellow-50", border: "border-yellow-200" },
    { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500", dot: "bg-green-500", hover: "hover:bg-green-50", border: "border-green-200" },
  ]

  return (
    <>
    <Sidebar 
      collapsible="icon" 
      className="border-none bg-[#FAFAFA] rounded-[2rem] h-[calc(100vh-2rem)] my-auto shadow-xl border border-gray-200 overflow-hidden"
    >
      <SidebarHeader className="px-4 py-6 border-b border-gray-100 flex-shrink-0">
        <div className={`flex items-center h-10 w-full cursor-pointer ${isCollapsed ? 'justify-center' : ''}`} onClick={handleNavClick}>
          {isCollapsed ? (
             <LoadingBars collapsed={true} isLoading={isNavigating} />
          ) : (
            <>
              <LoadingBars collapsed={false} isLoading={isNavigating} />
              <div className="flex flex-col ml-3 justify-center whitespace-nowrap">
                <h2 className="font-extrabold text-gray-900 leading-none text-xl">{portalName}</h2>
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">{portalSubtitle}</p>
              </div>
            </>
          )}
        </div>
      </SidebarHeader>

      <div className="px-3 py-3 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center h-11 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}
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
                          <SidebarMenuButton tooltip={item.title} className={`h-11 rounded-xl flex items-center px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 ${isCollapsed ? 'justify-center' : 'gap-3 justify-between'}`}>
                            {isCollapsed ? (
                               <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : 'text-gray-400'}`} />
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                                  </div>
                                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : 'text-gray-400'}`} />
                                  <span className="font-medium whitespace-nowrap">{item.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!isCollapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub className="mr-0 pr-0 border-l-2 ml-[1.6rem] mt-1 border-gray-100">
                              {item.children.map(sub => (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton asChild onClick={handleNavClick} className="h-9 rounded-lg text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50">
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
                      className={`h-11 rounded-xl flex items-center px-3 ${
                        isActive 
                          ? `${color.bg} ${color.text} shadow-sm border border-transparent` 
                          : `text-gray-600 hover:text-gray-900 ${color.hover}`
                      } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                    >
                      <Link href={item.href}>
                        {isCollapsed ? (
                           <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : "text-gray-400"}`} />
                        ) : (
                          <>
                            <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? color.dot : 'bg-transparent'}`} />
                            </div>
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? color.icon : "text-gray-400"}`} />
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

        <div className="mx-4 my-2 border-t border-gray-100 flex-shrink-0" />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 flex-shrink-0 transition-none group-data-[collapsible=icon]:!mt-0 group-data-[collapsible=icon]:!opacity-100 ${isCollapsed ? 'text-center flex justify-center' : ''}`}>
            {isCollapsed ? "-" : "Cuenta"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {accountMenu.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} onClick={handleNavClick} className={`h-11 rounded-xl flex items-center px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Link href={item.href}>
                      {isCollapsed ? (
                        <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      ) : (
                        <>
                          <div className="w-1.5 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                          </div>
                          <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
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

      <SidebarFooter className="p-4 border-t border-gray-100 flex-shrink-0">
        <SidebarMenuButton asChild onClick={(e) => {
          if (onLogout) {
            e.preventDefault();
            onLogout();
          } else {
            handleNavClick(e);
          }
        }} className={`h-12 rounded-xl flex items-center px-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
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
