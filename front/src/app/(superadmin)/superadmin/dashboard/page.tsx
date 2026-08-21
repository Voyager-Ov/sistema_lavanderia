"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Activity, Key } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { OverviewStatsGrid } from "./_components/overview-stats-grid";
import { NotificationsFeedCard } from "./_components/notifications-feed-card";
import { apiClient } from "@/shared/lib/api-client";

function DashboardContent() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/superadmin/login");
        return;
      }

      const [dashRes, healthRes, solicitudesRes, notifRes]: any[] = await Promise.all([
        apiClient.get("/superadmin/dashboard").catch(() => null),
        apiClient.get("/superadmin/health-check").catch(() => null),
        apiClient.get("/superadmin/solicitudes").catch(() => null),
        apiClient.get("/superadmin/notificaciones").catch(() => null)
      ]);

      if (dashRes) setData(dashRes);
      if (healthRes) setHealth(healthRes);
      if (solicitudesRes) setSolicitudes(solicitudesRes.data || []);
      if (notifRes) setNotifications(notifRes.data || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data", error);
      if (error?.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }
      toast.error("Error al cargar datos del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleResetPasswordRequest = async () => {
    const targetEmail = "octavio.velo2022@gmail.com";
    if (!confirm(`¿Enviar enlace seguro con token para cambiar contraseña a ${targetEmail}?`)) return;

    try {
      await apiClient.post("/auth/forgot-password", { email: targetEmail });
      toast.success(`🔑 Enlace seguro enviado a ${targetEmail}`);
    } catch (e: any) {
      toast.error("Error al solicitar restablecimiento", { description: e.message });
    }
  };

  const pendientesCount = solicitudes.filter(s => s.estado === "PENDIENTE").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
        <RefreshCw className="animate-spin mr-2" size={24} /> Cargando métricas generales...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" size={24} /> Monitoreo Central & Vista General
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Métricas de infraestructura, solicitudes de negocios y centro de notificaciones central
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => fetchDashboardData()}>
            <RefreshCw size={14} className="mr-1.5" /> Refrescar
          </Button>
          <Button size="sm" variant="warning" onClick={handleResetPasswordRequest}>
            <Key size={14} className="mr-1.5" /> Cambiar Contraseña
          </Button>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <OverviewStatsGrid health={health} pendientesCount={pendientesCount} />

      {/* Feed de Notificaciones y Alertas Centrales */}
      <NotificationsFeedCard notifications={notifications} />
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
