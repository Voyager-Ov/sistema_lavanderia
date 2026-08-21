"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Activity, ShieldCheck, Key } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { OverviewStatsGrid } from "./_components/overview-stats-grid";

function DashboardContent() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const getApiUrl = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/superadmin/login");
        return;
      }

      const apiUrl = getApiUrl();
      const [dashRes, healthRes, solicitudesRes] = await Promise.all([
        fetch(`${apiUrl}/api/superadmin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/health-check`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/solicitudes`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (dashRes.status === 401 || healthRes.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }

      const dashData = await dashRes.json();
      const healthData = await healthRes.json();
      const solicitudesData = await solicitudesRes.json();

      setData(dashData);
      setHealth(healthData);
      setSolicitudes(solicitudesData.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
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
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const resData = await res.json();
      if (res.ok) {
        toast.success(`🔑 Enlace seguro enviado a ${targetEmail}`);
      } else {
        toast.error("Error al solicitar enlace", { description: resData.message });
      }
    } catch (e) {
      toast.error("Error de conexión al solicitar restablecimiento");
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
            <Activity className="text-blue-500" size={24} /> Monitoreo Central & Salud del Sistema
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Estado de esquemas PostgreSQL Neon, uptime y solicitudes entrantes
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
