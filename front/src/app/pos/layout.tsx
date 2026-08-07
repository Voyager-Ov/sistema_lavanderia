"use client";

import React from "react";
import { AppLayout } from "@/shared/ui/layout/app-layout";
import { usePathname } from "next/navigation";
import { RoleGuard } from "@/shared/ui/layout/guards/RoleGuard";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Wallet,
  Utensils,
  Box,
  User,
  Settings
} from "lucide-react";

const posMainMenu = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/pos/dashboard" },
  { title: "POS", icon: LayoutDashboard, href: "/pos/terminal" },
  { title: "Caja", icon: Wallet, href: "/pos/caja" },
  { title: "Pedidos", icon: ShoppingCart, href: "/pos/pedidos" },
  { title: "Clientes", icon: User, href: "/pos/clientes" },
  { title: "Servicios", icon: Utensils, href: "/pos/servicios" },
];

const posAccountMenu = [
  { title: "Mi Perfil", icon: User, href: "/pos/perfil" },
  { title: "Configuración", icon: Settings, href: "/pos/configuracion" },
];

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore();
  const pathname = usePathname();
  
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment: string, index: number) => {
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    if (label.toLowerCase() === "pos") label = "POS";
    const href = "/" + segments.slice(0, index + 1).join("/");
    return { label, href };
  });

  return (
    <RoleGuard allowedRoles={["empleado", "cajero", "admin", "superadmin"]} redirectTo="/login">
      <AppLayout
        title="POS"
        breadcrumbs={breadcrumbs}
        mainMenu={posMainMenu}
        accountMenu={posAccountMenu}
        onLogout={logout}
      >
        {children}
      </AppLayout>
    </RoleGuard>
  );
}
