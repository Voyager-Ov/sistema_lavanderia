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
    let conDeuda = 0
    let deudaTotal = 0

    const clientList = clientes || []
    clientList.forEach(c => {
      if (c.activo !== false) activos++
      const saldo = c.saldoDeuda || c.cuentaCorriente?.saldo || 0
      if (saldo > 0) {
        conDeuda++
        deudaTotal += saldo
      }
    })

    return { activos, conDeuda, deudaTotal }
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
        title="Clientes Con Deuda" 
        value={stats.conDeuda.toString()} 
        description="Pedidos impagos activos" 
        backMessage="Clientes con saldo pendiente" 
        colorVariant="orange" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Deuda Total" 
        value={`$${stats.deudaTotal.toLocaleString("es-AR")}`} 
        description="Por cobrar en cuenta corriente" 
        backMessage="Monto acumulado a cobrar" 
        colorVariant="red" 
      />
      <DashboardKpi 
        isLoading={isLoading} 
        title="Clientes Activos" 
        value={stats.activos.toString()} 
        description="Clientes habilitados" 
        backMessage="Clientes en alta activa" 
        colorVariant="green" 
      />
    </div>
  )
}
