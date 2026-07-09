"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { LoadingBars } from "@/shared/ui/feedback/loading-bars";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // e.g. ["admin", "superadmin"]
  redirectTo?: string; // Where to go if unauthorized
}

export function RoleGuard({ children, allowedRoles, redirectTo = "/login" }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for zustand persist to load on client side
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace("/login");
      } else {
        // Normalizar los roles para la comparación (minúsculas y sin espacios)
        const userRole = user.rol.toLowerCase().trim();
        const allowed = allowedRoles.map(r => r.toLowerCase().trim());

        if (!allowed.includes(userRole)) {
          // Si el usuario no tiene permiso, lo mandamos al login o a una pantalla default
          router.replace(redirectTo);
        } else {
          setIsChecking(false);
        }
      }
    }, 100); // Pequeño delay para hidratación de zustand

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
