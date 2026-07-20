import React from "react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { Cliente } from "@/domains/clientes/api"
import { SortingState } from "@tanstack/react-table"
import { ColumnDef } from "@tanstack/react-table"
import { BulkAction } from "@/shared/ui/data-display/data-table-bulk-actions"

interface ClientesTableProps {
  clientes: Cliente[]
  columns: ColumnDef<Cliente, any>[]
  isTableFetching: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  pagination: { pageIndex: number; pageSize: number }
  setPagination: (val: any) => void
  totalPages: number
  sorting: SortingState
  setSorting: (val: any) => void
  bulkActions?: BulkAction<Cliente>[]
}

export function ClientesTable({
  clientes,
  columns,
  isTableFetching,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  totalPages,
  sorting,
  setSorting,
  bulkActions,
}: ClientesTableProps) {
  return (
    <div className="fade-item relative z-0 flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={clientes}
        isFetching={isTableFetching}
        
        searchPlaceholder="Buscar por nombre, teléfono o email..."
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
        bulkActions={bulkActions}
      />
    </div>
  )
}

