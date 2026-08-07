import React from "react"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"

interface EmpleadosKpisProps {
  stats: any
  isLoading: boolean
}

export function EmpleadosKpis({ stats, isLoading }: EmpleadosKpisProps) {
  return (
    <div className="fade-item grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <DashboardKpi 
        isLoading={isLoading} 
        title="Total Empleados" 
        value={stats.total?.toString() || "0"} 
        description="Registrados en el sistema" 
        backMessage="Número total de empleados" 
        colorVariant="blue" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Empleados Activos" 
        value={stats.activos?.toString() || "0"} 
        description="En la base de datos" 
        backMessage="Empleados actualmente trabajando" 
        colorVariant="green" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Empleados Inactivos" 
        value={stats.inactivos?.toString() || "0"} 
        description="En la base de datos" 
        backMessage="Empleados dados de baja" 
        colorVariant="yellow" 
      />
    </div>
  )
}
