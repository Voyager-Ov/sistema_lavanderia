import React from "react"
import { FinanzasKPIs as KPIsType } from "@/domains/finanzas/finanzas.api"
import { KpiCard } from "@/shared/ui/data-display/kpi-card"

interface FinanzasKPIsProps {
  data: KPIsType
  isLoading: boolean
}

export function FinanzasKPIs({ data, isLoading }: FinanzasKPIsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(val);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
      <KpiCard
        title="Balance Neto"
        value={formatCurrency(data.balanceNeto)}
        description="Ingresos - Egresos"
        backMessage="Este es el resultado final de restar todos tus gastos a los ingresos generados en este periodo."
        colorVariant="blue"
        isLoading={isLoading}
      />
      <KpiCard
        title="Total Ingresos (Cobros)"
        value={formatCurrency(data.totalIngresos)}
        description="Dinero entrante"
        backMessage="Suma de todos los pagos recibidos y cobrados exitosamente a los clientes."
        colorVariant="green"
        isLoading={isLoading}
      />
      <KpiCard
        title="Total Egresos"
        value={formatCurrency(data.totalEgresos)}
        description="Gastos registrados"
        backMessage="Total de dinero que salió de tu caja o negocio para pagar proveedores, servicios, etc."
        colorVariant="red"
        isLoading={isLoading}
      />
      <KpiCard
        title="Pendiente por Cobrar"
        value={formatCurrency(data.totalNoCobrado)}
        description="Pedidos sin abonar"
        backMessage="Suma de pedidos que ya están registrados pero los clientes aún no han pagado."
        colorVariant="orange"
        isLoading={isLoading}
      />
    </div>
  )
}
