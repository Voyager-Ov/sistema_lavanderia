"use client"

import React, { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ServiceReportKpi } from "@/shared/ui/dashboard/service-report-kpi"
import { EditorialTrendChart } from "@/shared/ui/dashboard/editorial-trend-chart"
import { GraphicDonutChart } from "@/shared/ui/dashboard/graphic-donut-chart"
import { EmpleadosReportHeader } from "./components/empleados-report-header"
import { EmpleadosReportTable } from "./components/empleados-report-table"
import { UltimasCajasTable } from "./components/ultimas-cajas-table"
import { useEmpleadosReport } from "./hooks/useEmpleadosReport"
import { Loader2 } from "lucide-react"

export default function EmpleadosReportPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    data,
    isLoading,
    error,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    handleQuickFilter,
    handleClearFilters
  } = useEmpleadosReport()

  gsap.registerPlugin(useGSAP)

  useGSAP(() => {
    if (!isLoading && data) {
      gsap.fromTo(".stagger-block", 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out"
        }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading, data] })

  if (error) {
    return (
      <div className="flex-1 flex flex-col h-[80vh] items-center justify-center">
        <div className="text-red-500 font-medium mb-4">Error: {error}</div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brand-blue text-white rounded-md font-bold">Reintentar</button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-blue mb-4" />
        <p className="text-gray-500 font-medium tracking-tight">Generando reporte de empleados...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 pb-10">
      
      <EmpleadosReportHeader 
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        setQuickFilter={handleQuickFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Row 1: The Bold KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Total Cajas" 
          value={data.kpis.totalCajas} 
          trendValue="" 
          isPositive={true}
          subtitle="Abiertas en el periodo"
          backMessage="Cantidad total de cajas registradoras operadas."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Tasa Cancelación" 
          value={data.kpis.tasaCancelacion} 
          trendPrefix=""
          trendValue="" 
          trendSuffix="%"
          isPositive={parseFloat(data.kpis.tasaCancelacion) < 5}
          subtitle="Pedidos cancelados vs totales"
          backMessage="Porcentaje de pedidos generados que terminaron en cancelación."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Total Recaudado (Cajas)" 
          value={`$${data.kpis.ingresosEfectivo.toLocaleString()}`} 
          trendPrefix=""
          trendValue="" 
          trendSuffix=""
          isPositive={true}
          subtitle="Solo Efectivo"
          backMessage="El flujo total de dinero en efectivo ingresado en las cajas físicas."
        />
      </div>

      {/* Row 2: Trends and Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 stagger-block opacity-0">
          <EditorialTrendChart
            title="Ingresos Diarios Registrados"
            subtitle="Evolución de todos los métodos de pago"
            data={data.trend}
            dataKeyX="name"
            categories={[{ key: "ingresos", name: "Ingresos Totales", color: "#3b82f6" }]}
            className="h-full min-h-[400px]"
          />
        </div>
        <div className="xl:col-span-4 stagger-block opacity-0">
          <GraphicDonutChart 
            title="Métodos de Pago" 
            subtitle="Distribución de la recaudación"
            data={data.donut}
            className="h-full min-h-[400px]"
          />
        </div>
      </div>

      {/* Row 3: Tabla Principal de Empleados */}
      <div className="grid grid-cols-1 gap-6">
        <div className="stagger-block opacity-0">
          <EmpleadosReportTable 
            data={data.tablaEmpleados}
            className="h-full"
          />
        </div>
      </div>

      {/* Row 4: Últimas cajas */}
      <div className="grid grid-cols-1 gap-6">
        <div className="stagger-block opacity-0">
          <UltimasCajasTable 
            data={data.ultimasCajas}
            className="h-full"
          />
        </div>
      </div>

    </div>
  )
}
