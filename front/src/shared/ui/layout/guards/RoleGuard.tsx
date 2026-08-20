"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { LoadingBars } from "@/shared/ui/feedback/loading-bars";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // e.g. ["admin", "superadmin"]
  redirectTo?: string; // Ruta de retorno opcional si no está autorizado
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Pequeña espera para asegurar que zustand persist se hidrate en el cliente
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user || !user.rol) {
        router.replace("/login");
        return;
      }

      // Normalizar el rol del usuario (minúsculas, sin espacios ni guiones bajos)
      const userRole = user.rol.toLowerCase().trim().replace("_", "");
      const allowedNormalized = allowedRoles.map(r => r.toLowerCase().trim().replace("_", ""));

      // Verificar si el rol del usuario coincide con alguno de los roles permitidos
      const hasPermission = allowedNormalized.some(allowed => {
        if (allowed === "admin" && (userRole === "admin" || userRole.includes("admin"))) {
          return true;
        }
        if (allowed === "superadmin" && (userRole === "superadmin" || userRole.includes("superadmin"))) {
          return true;
        }
        return userRole === allowed;
      });

      if (!hasPermission) {
        toast.error("Acceso denegado", {
          description: "Se requieren permisos de Administrador para acceder a esta sección.",
        });
        // Si el usuario ya está autenticado pero no tiene permisos, dirigirlo al portal POS
        const targetRoute = redirectTo || "/pos/pedidos";
        router.replace(targetRoute);
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, allowedRoles, redirectTo, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <LoadingBars isLoading={true} />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Verificando accesos...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

