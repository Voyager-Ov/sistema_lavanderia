"use client"

import React, { useRef } from "react"
import { GlobalSearch } from "@/shared/ui/overlays/global-search"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { SidebarTrigger } from "@/shared/ui/layout/sidebar"
import { Breadcrumbs, BreadcrumbItemType as BreadcrumbItem } from "@/shared/ui/navigation/breadcrumbs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/overlays/dropdown-menu"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { useAuthStore } from "@/shared/store/useAuthStore"

export type { BreadcrumbItem }

interface AppHeaderProps {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({ title, breadcrumbs }: AppHeaderProps) {
  const headerRef = useRef<HTMLHeadingElement>(null)
  const { user, logout } = useAuthStore()
  
  gsap.registerPlugin(useGSAP)

  useGSAP(() => {
    // Animar la entrada de los elementos del header (solo carga inicial)
    gsap.fromTo(".gsap-header-item", 
      { y: -15, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        ease: "back.out(1.2)",
        duration: 0.6,
        delay: 0.1
      }
    )
  }, { scope: headerRef })

  const { contextSafe } = useGSAP({ scope: headerRef })

  const onBellHover = contextSafe((e: React.MouseEvent) => {
    gsap.to(e.currentTarget, {
      rotation: 15,
      yoyo: true,
      repeat: 3,
      duration: 0.1,
      ease: "power1.inOut"
    })
  })

  const onProfileHover = contextSafe((e: React.MouseEvent) => {
    const avatar = e.currentTarget.querySelector('.avatar-circle')
    if (avatar) {
      gsap.to(avatar, {
        scale: 1.1,
        boxShadow: "0 4px 15px rgba(66, 133, 244, 0.4)",
        duration: 0.3,
        ease: "back.out(2)"
      })
    }
  })

  const onProfileLeave = contextSafe((e: React.MouseEvent) => {
    const avatar = e.currentTarget.querySelector('.avatar-circle')
    if (avatar) {
      gsap.to(avatar, {
        scale: 1,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        duration: 0.3,
        ease: "power2.out"
      })
    }
  })

  // Mock current date for the header
  const currentDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date())

  // Cálculos para el perfil del usuario
  const userName = user?.nombre || "Usuario"
  const userEmail = user?.email || "correo@ejemplo.com"
  const userRole = user?.rol || "Invitado"
  
  // Obtenemos las iniciales, ej: "Juan Pérez" -> "JP", "Admin" -> "A"
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const initials = getInitials(userName);

  return (
    <header ref={headerRef} className="h-20 w-full flex items-center justify-between px-8 border-b border-gray-200/80 shrink-0 bg-white/95 backdrop-blur-xl shadow-sm sticky top-0 z-40 transition-all">
      
      {/* Left side: Breadcrumbs or Title */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumbs items={breadcrumbs} />
        ) : (
          <h1 className="gsap-header-item text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
        )}
      </div>

      {/* Right side: Search, Notifications, Profile */}
      <div className="flex items-center gap-5">
        
        {/* Global Search Component */}
        <div className="gsap-header-item hidden md:block w-64 lg:w-80 transition-all">
          <GlobalSearch />
        </div>

        {/* Date Display */}
        <div className="gsap-header-item hidden lg:flex items-center text-sm font-medium text-gray-400 capitalize px-2 border-r border-gray-200 pr-5">
          {currentDate}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              onMouseEnter={onBellHover}
              className="gsap-header-item relative p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-white"></span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-xl p-2 border-gray-100">
            <DropdownMenuLabel className="font-bold text-gray-900">Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <div className="flex flex-col gap-1">
                <div className="p-3 hover:bg-brand-blue/5 rounded-xl transition-colors cursor-pointer flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-brand-blue mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nuevo cliente registrado</p>
                    <p className="text-xs text-gray-500 mt-0.5">Juan Pérez se ha registrado en el sistema.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Hace 5 min</p>
                  </div>
                </div>
                <div className="p-3 hover:bg-brand-blue/5 rounded-xl transition-colors cursor-pointer flex gap-3 items-start opacity-70">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Actualización del sistema</p>
                    <p className="text-xs text-gray-500 mt-0.5">La versión 2.4 ya está disponible.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Hace 2 horas</p>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <button className="w-full text-center text-xs font-medium text-brand-blue py-2 hover:bg-brand-blue/5 rounded-lg transition-colors">
              Marcar todas como leídas
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Thumbnail */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div 
              onMouseEnter={onProfileHover}
              onMouseLeave={onProfileLeave}
              className="gsap-header-item flex items-center gap-3 cursor-pointer group focus:outline-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-brand-blue transition-colors truncate max-w-[120px]">{userName}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">{userRole}</p>
              </div>
              <div className="relative">
                <div className="avatar-circle w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-blue to-blue-400 text-white flex items-center justify-center font-bold shadow-sm">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brand-green rounded-full border-[2.5px] border-white"></div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl p-2 border-gray-100">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900">{userName}</span>
                <span className="text-xs font-normal text-gray-500 truncate">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-brand-blue/5 focus:bg-brand-blue/5 focus:text-brand-blue transition-colors">
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-brand-blue/5 focus:bg-brand-blue/5 focus:text-brand-blue transition-colors">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-xl text-brand-red focus:bg-brand-red/10 focus:text-brand-red transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
