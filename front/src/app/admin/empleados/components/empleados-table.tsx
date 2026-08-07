import React from "react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { ColumnDef, SortingState } from "@tanstack/react-table"

interface EmpleadosTableProps {
  empleados: any[]
  columns: ColumnDef<any>[]
  isTableFetching: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  pagination: { pageIndex: number; pageSize: number }
  setPagination: (val: any) => void
  totalPages: number
  sorting: SortingState
  setSorting: (val: any) => void
}

export function EmpleadosTable({
  empleados,
  columns,
  isTableFetching,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  totalPages,
  sorting,
  setSorting,
}: EmpleadosTableProps) {
  return (
    <div className="fade-item relative z-0 flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={empleados}
        isFetching={isTableFetching}
        
        searchPlaceholder="Buscar por nombre o email..."
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
