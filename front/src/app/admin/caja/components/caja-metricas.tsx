import { KpiCard } from "@/shared/ui/data-display/kpi-card"
import { formatCurrency } from "@/shared/lib/utils"

interface CajaMetricasProps {
  montoInicial: number;
  totalIngresosEfectivo: number;
  totalIngresosDigitales: number;
  efectivoEsperado: number;
}

export function CajaMetricas({
  montoInicial,
  totalIngresosEfectivo,
  totalIngresosDigitales,
  efectivoEsperado
}: CajaMetricasProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="metric-card">
        <KpiCard
          title="Físico Esperado"
          value={formatCurrency(efectivoEsperado)}
          description="Efectivo en caja"
          backMessage="Monto de efectivo esperado al sumar el fondo de caja inicial más todos los cobros y restando los gastos."
          colorVariant="green"
        />
      </div>
      <div className="metric-card">
        <KpiCard
          title="Monto Inicial"
          value={formatCurrency(montoInicial)}
          description="Base de apertura"
          backMessage="Dinero físico con el que se abrió el turno de caja actual."
          colorVariant="blue"
        />
      </div>
      <div className="metric-card">
        <KpiCard
          title="Ingresos Efectivo"
          value={`+${formatCurrency(totalIngresosEfectivo)}`}
          description="Cobros en papel"
          backMessage="Total de cobros realizados utilizando efectivo físico."
          colorVariant="yellow"
        />
      </div>
      <div className="metric-card">
        <KpiCard
          title="Ingresos Digitales"
          value={`+${formatCurrency(totalIngresosDigitales)}`}
          description="Transferencias y tarjetas"
          backMessage="Suma de cobros registrados mediante transferencias bancarias, mercado pago o tarjetas."
          colorVariant="red"
        />
      </div>
    </div>
  )
}
