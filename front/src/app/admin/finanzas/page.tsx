"use client"
import React, { useState, useMemo, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { FinanzasHeader } from "./components/FinanzasHeader"
import { FinanzasKPIs } from "./components/FinanzasKPIs"
import { FinanzasTable } from "./components/FinanzasTable"
import { FinanzasCharts } from "./components/FinanzasCharts"
import { RegistrarGastoModal } from "../caja/components/registrar-gasto-modal"
import { CategoriasSheet } from "./components/categorias-sheet"
import { MovimientoDetailSheet } from "./components/movimiento-detail-sheet"
import { useFinanzasData } from "./hooks/useFinanzasData"
import { getFinanzasColumns } from "./components/finanzas-columns"
import { toast } from "sonner"

gsap.registerPlugin(useGSAP)

export default function FinanzasPage() {
  const {
    movimientos,
    chartMovimientos,
    kpis,
    isTableFetching,
    isKpisLoading,
    isChartLoading,
    searchTerm,
    setSearchTerm,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    pagination,
    setPagination,
    sorting,
    setSorting,
    totalPages,
    setQuickFilter,
    refreshAll
  } = useFinanzasData()

  const [modalGastoOpen, setModalGastoOpen] = useState(false)
  const [categoriasOpen, setCategoriasOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [selectedMovimiento, setSelectedMovimiento] = useState<any>(null)

  const pageContainerRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => getFinanzasColumns(), [])

  const handleClearFilters = () => {
    setFechaInicio("")
    setFechaFin("")
    setSearchTerm("")
    setPagination((p: any) => ({ ...p, pageIndex: 0 }))
  }

  useGSAP(() => {
    if (!pageContainerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".finanzas-header-item", {
        y: -15,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power3.out"
      });
      gsap.from(".finanzas-kpis-section", {
        y: 20,
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.1,
        ease: "power3.out"
      });
      gsap.from(".finanzas-table-section", {
        y: 25,
        autoAlpha: 0,
        duration: 0.55,
        delay: 0.2,
        ease: "power3.out"
      });
    }, pageContainerRef);

    return () => ctx.revert();
  }, { scope: pageContainerRef });

  return (
    <div ref={pageContainerRef} className="w-full flex flex-col gap-6">
      <div className="finanzas-header-item">
        <FinanzasHeader 
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          setQuickFilter={setQuickFilter}
          onClearFilters={handleClearFilters}
          onOpenGasto={() => setModalGastoOpen(true)}
          onOpenCategorias={() => setCategoriasOpen(true)}
        />
      </div>

      <div className="finanzas-kpis-section">
        <FinanzasKPIs 
          data={kpis || { totalIngresos: 0, totalEgresos: 0, balanceNeto: 0, totalNoCobrado: 0 }} 
          isLoading={isKpisLoading} 
        />
      </div>

      <div className="finanzas-table-section flex flex-col gap-6 w-full">
        <FinanzasTable 
          movimientos={movimientos}
          columns={columns}
          isTableFetching={isTableFetching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pagination={pagination}
          setPagination={setPagination}
          totalPages={totalPages}
          sorting={sorting}
          setSorting={setSorting}
          onRowClick={(mov) => {
            setSelectedMovimiento(mov)
            setDetalleOpen(true)
          }}
        />

        <FinanzasCharts 
          movimientos={chartMovimientos} 
          isLoading={isChartLoading} 
        />
      </div>

      <RegistrarGastoModal 
        open={modalGastoOpen}
        onOpenChange={setModalGastoOpen}
        onSuccess={() => refreshAll()}
      />
      <CategoriasSheet
        open={categoriasOpen}
        onOpenChange={setCategoriasOpen}
      />
      <MovimientoDetailSheet
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        movimiento={selectedMovimiento}
      />
    </div>
  )
}
