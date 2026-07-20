"use client"

import React, { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ServiceReportKpi } from "@/shared/ui/dashboard/service-report-kpi"
import { RadialSegmentedGauge } from "@/shared/ui/dashboard/radial-segmented-gauge"
import { AllServicesProgress } from "@/shared/ui/dashboard/all-services-progress"
import { EditorialTrendChart } from "@/shared/ui/dashboard/editorial-trend-chart"
import { GraphicDonutChart } from "@/shared/ui/dashboard/graphic-donut-chart"
import { ServicesReportTable } from "@/shared/ui/dashboard/services-report-table"
import { ServiciosReportHeader } from "./components/servicios-report-header"
import { useServiciosReport } from "./hooks/useServiciosReport"
import { Loader2 } from "lucide-react"

export default function ServiciosReportPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    data,
    isLoading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    handleQuickFilter,
    handleClearFilters
  } = useServiciosReport()

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

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-blue mb-4" />
        <p className="text-gray-500 font-medium">Generando reporte de servicios...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 pb-10">
      
      {/* Header & Global Filters */}
      <ServiciosReportHeader 
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        setQuickFilter={handleQuickFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Row 1: The Bold KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Ingresos Totales" 
          value={`$${data.kpis.ingresos.toLocaleString()}`} 
          trendValue="12.5" 
          isPositive={true}
          backMessage="Dinero total generado por todos los servicios procesados en el período seleccionado."
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Ticket Promedio" 
          value={`$${data.kpis.ticket}`} 
          trendPrefix=""
          trendValue="0.8" 
          trendSuffix="$"
          isPositive={true}
          subtitle="vs Mes Anterior"
          backMessage="El gasto promedio que realiza un cliente cada vez que usa un servicio."
        />
        <RadialSegmentedGauge
          className="stagger-block opacity-0"
          title="Capacidad"
          subtitle="Uso de Maquinaria"
          value={data.kpis.capacidad}
          accentColor="#3b82f6"
        />
        <ServiceReportKpi 
          className="stagger-block opacity-0"
          title="Cancelados" 
          value={data.kpis.cancelados} 
          trendValue="" 
          trendPrefix=""
          trendSuffix=""
          isPositive={false}
          subtitle="Servicios no completados"
          backMessage="Cantidad de servicios que fueron solicitados pero se cancelaron antes de cobrar."
        />
      </div>

      {/* Row 2: Trends and Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 stagger-block opacity-0">
          <EditorialTrendChart
            title="Ingresos por Categoría"
            subtitle="Evolución temporal del rendimiento"
            data={data.trend}
            dataKeyX="name"
            categories={data.categoriesMetaData}
            className="h-full min-h-[400px]"
          />
        </div>
        <div className="xl:col-span-4 stagger-block opacity-0">
          <GraphicDonutChart 
            title="Distribución" 
            subtitle="Por Servicio (Volumen)"
            data={data.donut}
            className="h-full"
          />
        </div>
      </div>

      {/* Row 3: All Services and Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 stagger-block opacity-0 h-[500px]">
          <AllServicesProgress
            title="Todos los Servicios"
            subtitle="Por volumen de ventas"
            data={data.servicesList}
            accentColor="#3b82f6"
            className="h-full"
          />
        </div>
        <div className="xl:col-span-8 stagger-block opacity-0">
          <ServicesReportTable 
            data={data.table as any}
            className="h-full"
          />
        </div>
      </div>

    </div>
  )
}
