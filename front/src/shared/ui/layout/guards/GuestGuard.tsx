"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { LoadingBars } from "@/shared/ui/feedback/loading-bars";

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Excepciones: /reset-password y /solicitud-pendiente NUNCA deben ser bloqueadas por GuestGuard
      if (pathname && (pathname.includes("reset-password") || pathname.includes("solicitud-pendiente"))) {
        setIsChecking(false);
        return;
      }

      if (isAuthenticated && user) {
        // Redirigimos según el rol si ya está logueado a una página guest de login/registro
        const userRole = user.rol ? user.rol.toLowerCase().trim() : "";
        if (userRole.includes("super_admin") || userRole.includes("superadmin")) {
          router.replace("/superadmin/dashboard");
        } else if (userRole.includes("admin")) {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/pos/pedidos");
        }
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, router, pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
        <LoadingBars isLoading={true} />
      </div>
    );
  }

  return <>{children}</>;
}
