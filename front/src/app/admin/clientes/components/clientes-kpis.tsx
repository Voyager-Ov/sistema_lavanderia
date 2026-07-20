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
    let deudores = 0
    let saldoFavor = 0
    let inactivos = 0

    const clientList = clientes || []
    clientList.forEach(c => {
      const saldo = parseFloat(c.saldoCuentaCorriente?.toString() || "0")
      if (saldo > 0) deudores++
      if (saldo < 0) saldoFavor++
      if (!c.activo) inactivos++
    })

    return { deudores, saldoFavor, inactivos }
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
        title="Clientes con Deuda" 
        value={stats.deudores.toString()} 
        description="En la página actual" 
        backMessage="Deben dinero a la lavandería" 
        colorVariant="red" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Clientes con Saldo a Favor" 
        value={stats.saldoFavor.toString()} 
        description="En la página actual" 
        backMessage="Clientes con dinero a favor" 
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
    </div>
  )
}

