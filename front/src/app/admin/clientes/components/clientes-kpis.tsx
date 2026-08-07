import React, { useMemo } from "react"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"
import { Cliente } from "@/domains/clientes/api"

interface ClientesKpisProps {
  clientes: Cliente[]
  totalItems: number
  isLoading: boolean
}

export function ClientesKpis({ clientes, totalItems, isLoading }: ClientesKpisProps) {
  
  const stats = useMemo(() => {
    let activos = 0
    let inactivos = 0
    let conTelefono = 0

    const clientList = clientes || []
    clientList.forEach(c => {
      if (c.activo) activos++
      else inactivos++
      if (c.telefono) conTelefono++
    })

    return { activos, inactivos, conTelefono }
  }, [clientes])

  return (
    <div className="fade-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <DashboardKpi 
        isLoading={isLoading} 
        title="Total Clientes" 
        value={totalItems} 
        description="Registrados en el sistema" 
        backMessage="Número total de clientes" 
        colorVariant="blue" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Clientes Activos" 
        value={stats.activos.toString()} 
        description="En la página actual" 
        backMessage="Clientes habilitados" 
        colorVariant="green" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Clientes Inactivos" 
        value={stats.inactivos.toString()} 
        description="En la página actual" 
        backMessage="Clientes dados de baja" 
        colorVariant="yellow" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Con Teléfono" 
        value={stats.conTelefono.toString()} 
        description="En la página actual" 
        backMessage="Clientes con contacto registrado" 
        colorVariant="purple" 
      />
    </div>
  )
}
