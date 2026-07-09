"use client";

import React from "react";
import { AppLayout } from "@/shared/ui/layout/app-layout";
import { RoleGuard } from "@/shared/ui/layout/guards/RoleGuard";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Building,
  FileText,
  User,
  Wallet
} from "lucide-react";

const adminMainMenu = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "Pedidos", icon: FileText, href: "/admin/pedidos" },
  { title: "Caja", icon: Wallet, href: "/admin/caja" },
  { title: "Clientes", icon: Users, href: "/admin/clientes" },
  { title: "Servicios", icon: Building, href: "/admin/servicios" }, // Consider changing icon to something like Sparkles or Layers if needed
  { 
    title: "Finanzas", 
    icon: FileText, 
    href: "/admin/finanzas",
    children: [
      { title: "Reportes", href: "/admin/finanzas/reportes" },
      { title: "Movimientos", href: "/admin/finanzas/movimientos" }
    ]
  }
];

const adminAccountMenu = [
  { title: "Mi Perfil", icon: User, href: "/admin/perfil" },
  { title: "Configuración", icon: Settings, href: "/admin/configuracion" },
];

import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore();
  const pathname = usePathname();
  
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    if (label.toLowerCase() === "admin") label = "Admin";
    const href = "/" + segments.slice(0, index + 1).join("/");
    return { label, href };
  });

  return (
    <RoleGuard allowedRoles={["admin", "superadmin"]} redirectTo="/login">
      <AppLayout
        title="Admin Dashboard"
        breadcrumbs={breadcrumbs}
        mainMenu={adminMainMenu}
        accountMenu={adminAccountMenu}
        onLogout={logout}
      >
        {children}
      </AppLayout>
    </RoleGuard>
  );
}
