"use client";

import React from "react";
import { DashboardKpi } from "@/shared/ui/dashboard/dashboard-kpi";
import { Building2, Server, Clock, Activity } from "lucide-react";

interface OverviewStatsGridProps {
  health: any;
  pendientesCount: number;
}

export function OverviewStatsGrid({ health, pendientesCount }: OverviewStatsGridProps) {
  const totalNegocios = health?.centralDatabase?.negociosRegistrados || 0;
  const uptimeMinutes = health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 60)}m` : "Activo";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardKpi
        title="Negocios Registrados"
        value={totalNegocios}
        subtitle="En BD Central Multi-tenant"
        backMessage="Total de empresas de lavanderías registradas en el sistema central multi-tenant."
        variant="active"
        icon={<Building2 className="w-5 h-5 text-brand-blue" />}
        href="/superadmin/negocios"
      />

      <DashboardKpi
        title="Esquemas PostgreSQL"
        value={health?.centralDatabase?.schemasIsolation || "Aislados"}
        subtitle="Aislamiento Neon PG"
        backMessage="Cada negocio posee su propio esquema aislado en la base de datos PostgreSQL Neon para máxima seguridad."
        variant="default"
        icon={<Server className="w-5 h-5 text-purple-500" />}
        href="/superadmin/negocios"
      />

      <DashboardKpi
        title="Solicitudes Pendientes"
        value={pendientesCount}
        subtitle={pendientesCount > 0 ? "Requieren aprobación" : "Al día"}
        backMessage="Solicitudes de apertura de negocios recibidas pendientes de aprobación para sustanciar el esquema."
        variant="default"
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        href="/superadmin/solicitudes"
      />

      <DashboardKpi
        title="Uptime del Servidor"
        value={uptimeMinutes}
        subtitle={health?.status === "HEALTHY" ? "Servidor 100% Saludable" : "Servicio Activo"}
        backMessage="Tiempo de actividad ininterrumpido del servidor backend y sockets de notificaciones."
        variant="default"
        icon={<Activity className="w-5 h-5 text-emerald-500" />}
        href="/superadmin/seguridad"
      />
    </div>
  );
}
