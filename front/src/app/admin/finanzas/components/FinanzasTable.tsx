"use client"
import React, { useRef } from "react"
import { MovimientoFinanciero } from "@/domains/finanzas/finanzas.api"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { ColumnDef, SortingState } from "@tanstack/react-table"

interface FinanzasTableProps {
  movimientos: MovimientoFinanciero[]
  columns: ColumnDef<MovimientoFinanciero, any>[]
  isTableFetching: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  pagination: { pageIndex: number; pageSize: number }
  setPagination: (val: any) => void
  totalPages: number
  sorting: SortingState
  setSorting: (val: any) => void
  onRowClick?: (movimiento: MovimientoFinanciero) => void
}

export function FinanzasTable({
  movimientos,
  columns,
  isTableFetching,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  totalPages,
  sorting,
  setSorting,
  onRowClick
}: FinanzasTableProps) {
  return (
    <div className="fade-item relative z-0 flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={movimientos}
        onRowClick={onRowClick}
        isFetching={isTableFetching}
        
        searchPlaceholder="Buscar movimientos (ej: Alquiler, Pedido)..."
        globalFilter={searchTerm}
        onGlobalFilterChange={(val) => { setSearchTerm(val); setPagination((p: any) => ({ ...p, pageIndex: 0 })) }}
        
        manualPagination={true}
        pageCount={totalPages}
        pagination={pagination}
        onPaginationChange={setPagination}
        
        manualSorting={true}
        sorting={sorting}
        onSortingChange={setSorting}
        
        manualFiltering={true}
      />
    </div>
  )
}
