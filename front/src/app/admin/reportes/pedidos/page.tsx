"use client"

import React, { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ServiceReportKpi } from "@/shared/ui/dashboard/service-report-kpi"
import { EditorialTrendChart } from "@/shared/ui/dashboard/editorial-trend-chart"
import { GraphicDonutChart } from "@/shared/ui/dashboard/graphic-donut-chart"
import { AllServicesProgress } from "@/shared/ui/dashboard/all-services-progress"
import { PedidosReportHeader } from "./components/pedidos-report-header"
import { PedidosReportTable } from "./components/pedidos-report-table"
import { usePedidosReport } from "./hooks/usePedidosReport"
import { Loader2 } from "lucide-react"

export default function PedidosReportPage() {
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
  } = usePedidosReport()

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
        <p className="text-gray-500 font-medium tracking-tight">Generando reporte de pedidos...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 pb-10">
      
      {/* Header & Global Filters */}
      <PedidosReportHeader 
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        setQuickFilter={handleQuickFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Row 1: The Bold KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Ingresos Totales" 
          value={`$${data.kpis.ingresos.toLocaleString()}`} 
          trendValue="10.2" 
          isPositive={true}
          backMessage="Dinero total generado por pedidos no cancelados en el período seleccionado."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Pendiente de Cobro" 
          value={`$${data.kpis.pendienteCobro.toLocaleString()}`} 
          trendPrefix=""
          trendValue="" 
          trendSuffix=""
          isPositive={false}
          subtitle="Capital retenido"
          backMessage="Monto de pedidos completados o en proceso que aún no han sido cobrados."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Tiempo Entrega" 
          value={data.kpis.tiempoMedioEntrega} 
          trendPrefix=""
          trendValue="" 
          trendSuffix="h"
          isPositive={true}
          subtitle="Promedio histórico"
          backMessage="Promedio de horas transcurridas desde la recepción hasta la entrega al cliente."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Total Pedidos" 
          value={data.kpis.totalPedidos} 
          trendPrefix=""
          trendValue="5.0" 
          trendSuffix="%"
          isPositive={true}
          subtitle="vs Período Anterior"
          backMessage="Cantidad total de pedidos recibidos independientemente de su estado final."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Ticket Promedio" 
          value={`$${data.kpis.ticket}`} 
          trendPrefix=""
          trendValue="1.2" 
          trendSuffix="$"
          isPositive={true}
          subtitle="Promedio por pedido"
          backMessage="El gasto promedio que realiza un cliente por pedido."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Cancelados" 
          value={data.kpis.cancelados} 
          trendValue="" 
          trendPrefix=""
          trendSuffix=""
          isPositive={false}
          subtitle="Pedidos no concretados"
          backMessage="Cantidad de pedidos que fueron cancelados."
        />
      </div>

      {/* Row 2: Trends and Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 stagger-block opacity-0">
          <EditorialTrendChart
            title="Evolución de Pedidos e Ingresos"
            subtitle="Tendencia a lo largo del tiempo"
            data={data.trend}
            dataKeyX="name"
            categories={data.categoriesMetaData}
            className="h-full min-h-[400px]"
          />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-6">
          <GraphicDonutChart 
            title="Distribución por Estado" 
            subtitle="Basado en cantidad de pedidos"
            data={data.donut}
            className="stagger-block opacity-0 h-[400px]"
          />
          <AllServicesProgress
            title="Desempeño por Empleado"
            subtitle="Pedidos gestionados"
            data={data.chartEmpleados.map((e: any, i: number) => ({ id: i, label: e.nombre, value: e.pedidos, displayValue: String(e.pedidos) }))}
            accentColor="#10b981"
            className="stagger-block opacity-0 h-[400px]"
          />
        </div>
      </div>

      {/* Row 3: Table List */}
      <div className="grid grid-cols-1 gap-6">
        <div className="stagger-block opacity-0">
          <PedidosReportTable 
            data={data.table as any}
            className="h-full"
          />
        </div>
      </div>

    </div>
  )
}
