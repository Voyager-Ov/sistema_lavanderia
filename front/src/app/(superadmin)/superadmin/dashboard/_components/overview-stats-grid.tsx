"use client";

import React from "react";
import { DashboardKpi } from "@/shared/ui/dashboard/dashboard-kpi";
import { Building2, Server, Clock, Activity } from "lucide-react";

interface OverviewStatsGridProps {
  health: any;
  totalNegocios: number;
  pendientesCount: number;
  activosCount: number;
}

export function OverviewStatsGrid({
  health,
  totalNegocios,
  pendientesCount,
  activosCount,
}: OverviewStatsGridProps) {
  const isHealthy = health?.status === "HEALTHY";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardKpi
        title="Negocios Registrados"
        value={totalNegocios}
        subtitle={`${activosCount} activos en plataforma`}
        backMessage="Total de empresas de lavanderías registradas en el sistema central multi-tenant."
        variant="active"
        icon={<Building2 className="w-5 h-5 text-brand-blue" />}
        href="/superadmin/dashboard?tab=negocios"
      />

      <DashboardKpi
        title="Esquemas PostgreSQL"
        value="Aislados"
        subtitle="Aislamiento Neon PG"
        backMessage="Cada negocio posee su propio esquema aislado en la base de datos PostgreSQL Neon para máxima seguridad."
        variant="default"
        icon={<Server className="w-5 h-5 text-purple-500" />}
        href="/superadmin/dashboard?tab=negocios"
      />

      <DashboardKpi
        title="Solicitudes Pendientes"
        value={pendientesCount}
        subtitle={pendientesCount > 0 ? "Requieren aprobación" : "Al día"}
        backMessage="Solicitudes de apertura de negocios recibidas pendientes de aprobación para sustanciar el esquema."
        variant={pendientesCount > 0 ? "active" : "default"}
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        href="/superadmin/dashboard?tab=solicitudes"
      />

      <DashboardKpi
        title="Uptime del Servidor"
        value={isHealthy ? "Activo" : "Degradado"}
        subtitle={isHealthy ? "Servidor 100% Saludable" : "Verificar Servicios"}
        backMessage="Tiempo de actividad ininterrumpido del servidor backend y sockets de notificaciones."
        variant="default"
        icon={<Activity className="w-5 h-5 text-emerald-500" />}
        href="/superadmin/dashboard?tab=seguridad"
      />
    </div>
  );
}
