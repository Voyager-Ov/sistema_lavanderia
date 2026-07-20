import React from "react"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"
import { DashboardStatsResponse } from "@/domains/dashboard/api"

interface PedidosKpisProps {
  stats: DashboardStatsResponse | null
  isLoading: boolean
}

export function PedidosKpis({ stats, isLoading }: PedidosKpisProps) {
  return (
    <div className="fade-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKpi 
        isLoading={isLoading} 
        title="Ingresos en Caja (Hoy)" 
        value={`$${(Number(stats?.ingresos?.hoyCobrado) || 0).toLocaleString("es-AR")}`} 
        description="Dinero cobrado hoy" 
        backMessage="Ver reporte de caja" 
        colorVariant="green" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Pedidos Pendientes" 
        value={(stats?.pedidosActivos?.PENDIENTE || 0).toString()} 
        description="A la espera de iniciar" 
        backMessage="Filtrar pendientes" 
        colorVariant="blue" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="En Proceso" 
        value={(stats?.pedidosActivos?.EN_PROCESO || 0).toString()} 
        description="Lavando/Secando ahora" 
        backMessage="Ver operaciones" 
        colorVariant="orange" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Listos para Retirar" 
        value={(stats?.pedidosActivos?.LISTO_PARA_RETIRAR || (stats?.pedidosActivos as any)?.LISTO || 0).toString()} 
        description="Avisar a clientes" 
        backMessage="Notificar" 
        colorVariant="purple" 
      />
    </div>
  )
}
