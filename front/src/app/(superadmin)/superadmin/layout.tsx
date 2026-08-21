"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/shared/ui/layout/app-layout";
import { 
  Activity, 
  Building2, 
  Clock, 
  Megaphone, 
  ShieldCheck, 
  Key 
} from "lucide-react";
import { NavItem } from "@/shared/ui/layout/app-sidebar";

const superAdminMainMenu: NavItem[] = [
  { title: "Vista General", icon: Activity, href: "/superadmin/dashboard" },
  { title: "Gestión de Negocios", icon: Building2, href: "/superadmin/negocios" },
  { title: "Solicitudes", icon: Clock, href: "/superadmin/solicitudes" },
  { title: "Mensajería Broadcast", icon: Megaphone, href: "/superadmin/mensajes" },
  { title: "Auditoría de Seguridad", icon: ShieldCheck, href: "/superadmin/seguridad" },
];

const superAdminAccountMenu: NavItem[] = [
  { title: "Cambiar Contraseña", icon: Key, href: "#" }
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginPage = pathname === "/superadmin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem("superadmin_token");
    if (!token || token === "null" || token === "undefined") {
      setIsAuthenticated(false);
      router.push("/superadmin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    router.push("/superadmin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-zinc-300 font-sans">
        Cargando portal Super Admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    if (label.toLowerCase() === "superadmin") label = "Super Admin";
    const href = "/" + segments.slice(0, index + 1).join("/");
    return { label, href };
  });

  return (
    <AppLayout
      title="Consola Super Admin"
      breadcrumbs={breadcrumbs}
      mainMenu={superAdminMainMenu}
      accountMenu={superAdminAccountMenu}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
}
