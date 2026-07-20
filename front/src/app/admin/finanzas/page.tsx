"use client"
import React, { useState, useMemo } from "react"
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

  const columns = useMemo(() => getFinanzasColumns(), [])

  const handleClearFilters = () => {
    setFechaInicio("")
    setFechaFin("")
    setSearchTerm("")
    setPagination((p: any) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <div className="w-full flex flex-col gap-6">
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

      <FinanzasKPIs 
        data={kpis || { totalIngresos: 0, totalEgresos: 0, balanceNeto: 0, totalNoCobrado: 0 }} 
        isLoading={isKpisLoading} 
      />

      <div className="flex flex-col gap-6 w-full">
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
