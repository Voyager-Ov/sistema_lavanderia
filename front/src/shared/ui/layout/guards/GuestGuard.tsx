"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { LoadingBars } from "@/shared/ui/feedback/loading-bars";

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // Redirigimos según el rol si ya está logueado
        const userRole = user.rol.toLowerCase().trim();
        if (userRole === "admin" || userRole === "superadmin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/pos/pedidos");
        }
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
        <LoadingBars isLoading={true} />
      </div>
    );
  }

  return <>{children}</>;
}
