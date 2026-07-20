import React from "react"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"

export function ServiciosKpis({ stats, isLoading }: { stats: any, isLoading: boolean }) {
  return (
    <div className="fade-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKpi 
        isLoading={isLoading} 
        title="Total Servicios" 
        value={(stats?.total || 0).toString()} 
        description="Registrados en el sistema" 
        backMessage="Ver detalles" 
        colorVariant="blue" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Servicios Activos" 
        value={(stats?.activos || 0).toString()} 
        description="Disponibles para la venta" 
        backMessage="Gestionar disponibilidad" 
        colorVariant="green" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Categorías" 
        value={(stats?.categorias || 0).toString()} 
        description="Agrupaciones creadas" 
        backMessage="Editar categorías" 
        colorVariant="purple" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Más Solicitado" 
        value={stats?.masSolicitado ? stats.masSolicitado.nombre : "N/A"} 
        description={stats?.masSolicitado ? `${stats.masSolicitado.cantidad} ventas este mes` : "Sin datos"} 
        backMessage="Ver historial" 
        colorVariant="orange" 
      />
    </div>
  )
}
