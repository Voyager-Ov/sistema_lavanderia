import React from "react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { Button } from "@/shared/ui/forms/button"
import { XCircle } from "lucide-react"
import { Pedido } from "@/domains/pedidos/api"
import { BulkAction } from "@/shared/ui/data-display/data-table-bulk-actions"
import { SortingState } from "@tanstack/react-table"
import { ColumnDef } from "@tanstack/react-table"

interface PedidosTableProps {
  pedidos: Pedido[]
  columns: ColumnDef<Pedido, any>[]
  loadingRowIds: string[]
  rowErrors: Record<string, string>
  onClearRowError: (id: string) => void
  onClearAllErrors: () => void
  isTableFetching: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  activeFilter: string
  setActiveFilter: (val: string) => void
  pagination: { pageIndex: number; pageSize: number }
  setPagination: (val: any) => void
  totalPages: number
  sorting: SortingState
  setSorting: (val: any) => void
  bulkActions: BulkAction<Pedido>[]
}

export function PedidosTable({
  pedidos,
  columns,
  loadingRowIds,
  rowErrors,
  onClearRowError,
  onClearAllErrors,
  isTableFetching,
  searchTerm,
  setSearchTerm,
  activeFilter,
  setActiveFilter,
  pagination,
  setPagination,
  totalPages,
  sorting,
  setSorting,
  bulkActions
}: PedidosTableProps) {
  return (
    <div className="fade-item relative z-0 flex flex-col gap-4">
      {Object.keys(rowErrors).length > 0 && (
        <div className="flex justify-end animate-in fade-in slide-in-from-top-2 duration-300">
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8 rounded-full shadow-sm text-xs"
            onClick={onClearAllErrors}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Limpiar todos los errores ({Object.keys(rowErrors).length})
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={pedidos}
        loadingRowIds={loadingRowIds}
        rowErrors={rowErrors}
        onClearRowError={onClearRowError}
        isFetching={isTableFetching}
        
        searchPlaceholder="Buscar por cliente o ticket..."
        globalFilter={searchTerm}
        onGlobalFilterChange={(val) => { setSearchTerm(val); setPagination((p: any) => ({ ...p, pageIndex: 0 })) }}
        
        filters={[
          {
            key: "estado",
            label: "Estado",
            value: activeFilter,
            onChange: (val) => { setActiveFilter(val); setPagination((p: any) => ({ ...p, pageIndex: 0 })) },
            options: [
              { label: "Todos", value: "TODOS" },
              { label: "Pendiente", value: "PENDIENTE" },
              { label: "En Proceso", value: "EN_PROCESO" },
              { label: "Listo", value: "LISTO_PARA_RETIRAR" },
              { label: "Entregado", value: "ENTREGADO" },
              { label: "Cancelado", value: "CANCELADO" },
            ]
          }
        ]}

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
