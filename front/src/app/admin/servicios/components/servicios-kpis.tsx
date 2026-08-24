import React from "react"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"
import { ServicioStats } from "@/domains/productos/api"

interface ServiciosKpisProps {
  stats: ServicioStats;
  isLoading: boolean;
}

export function ServiciosKpis({ stats, isLoading }: ServiciosKpisProps) {
  return (
    <div className="fade-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKpi 
        isLoading={isLoading} 
        title="Total Servicios" 
        value={stats.total.toString()} 
        description="Registrados en el sistema" 
        backMessage="Ver detalles" 
        colorVariant="blue" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Servicios Activos" 
        value={stats.activos.toString()} 
        description="Disponibles para la venta" 
        backMessage="Gestionar disponibilidad" 
        colorVariant="green" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Categorías" 
        value={stats.categorias.toString()} 
        description="Agrupaciones creadas" 
        backMessage="Editar categorías" 
        colorVariant="purple" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Más Solicitado" 
        value={stats.masSolicitado || "N/A"} 
        description="Servicio más popular" 
        backMessage="Ver historial" 
        colorVariant="orange" 
      />
    </div>
  )
}
