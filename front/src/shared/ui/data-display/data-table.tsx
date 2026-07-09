"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Input } from "../forms/input"
import { Button } from "../forms/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../forms/select"
import { Search, Filter, ChevronDown, ArrowUp, ArrowDown, AlertCircle, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { DataTableBulkActions, BulkAction } from "./data-table-bulk-actions"
import { Spinner } from "@/shared/ui/feedback/spinner"
import { cn } from "@/shared/lib/utils"

interface DataTableFilter {
  key: string
  label: string
  options?: { label: string; value: string }[]
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  bulkActions?: BulkAction<TData>[]
  renderMobileCard?: (row: TData) => React.ReactNode
  
  // Custom Toolbar Extras
  toolbarExtras?: React.ReactNode
  
  // Controlled Search
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void

  // Asynchronous States (Loading & Errors)
  loadingRowIds?: string[]
  rowErrors?: Record<string, string>
  onClearRowError?: (rowId: string) => void
  
  // Server-side Pagination
  manualPagination?: boolean
  pageCount?: number
  pagination?: { pageIndex: number; pageSize: number }
  onPaginationChange?: React.Dispatch<React.SetStateAction<{ pageIndex: number; pageSize: number }>>

  // Server-side Sorting
  manualSorting?: boolean
  sorting?: SortingState
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>>

  isFetching?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar por nombre, categoría o código...",
  filters = [],
  bulkActions = [],
  renderMobileCard,
  toolbarExtras,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange: externalOnGlobalFilterChange,
  loadingRowIds = [],
  rowErrors = {},
  onClearRowError,
  manualPagination = false,
  pageCount = -1,
  pagination,
  onPaginationChange,
  manualSorting = false,
  sorting: externalSorting,
  onSortingChange,
  isFetching = false,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const isMobile = useIsMobile()
  const currentPagination = pagination ?? internalPagination
  const handlePaginationChange = onPaginationChange ?? setInternalPagination

  const currentSorting = externalSorting ?? internalSorting
  const handleSortingChange = onSortingChange ?? setInternalSorting

  const currentGlobalFilter = externalGlobalFilter ?? internalGlobalFilter
  const handleGlobalFilterChange = externalOnGlobalFilterChange ?? setInternalGlobalFilter

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: handleSortingChange,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: handleGlobalFilterChange,
    globalFilterFn: "includesString",
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (originalRow: any) => originalRow.id ? String(originalRow.id) : undefined,
    
    // Pagination config
    manualPagination,
    pageCount,
    onPaginationChange: handlePaginationChange,

    // Sorting config
    manualSorting,
    
    state: {
      sorting: currentSorting,
      columnFilters,
      globalFilter: currentGlobalFilter,
      rowSelection,
      columnVisibility,
      pagination: currentPagination,
    },
    // Deshabilitar reset automático de selección para que persista al cambiar de página en paginación manual
    autoResetRowSelection: false,
  })

  // Utilidad para extraer el ID de la fila (asumiendo que los objetos tienen propiedad 'id')
  const getRowId = (rowOriginal: any) => rowOriginal.id ? String(rowOriginal.id) : ""

  // Mantener los objetos de las filas seleccionadas a lo largo de las páginas (para paginación server-side)
  const [selectedRowObjects, setSelectedRowObjects] = React.useState<Record<string, TData>>({})

  React.useEffect(() => {
    setSelectedRowObjects(prev => {
      const next = { ...prev }
      // Eliminar los que ya no están seleccionados
      Object.keys(next).forEach(key => {
        if (!rowSelection[key as keyof typeof rowSelection]) {
          delete next[key]
        }
      })
      // Agregar/Actualizar los seleccionados en la vista actual
      table.getRowModel().rows.forEach(row => {
        if (row.getIsSelected()) {
          next[getRowId(row.original)] = row.original
        }
      })
      return next
    })
  }, [rowSelection, table.getRowModel().rows])

  const selectedRows = Object.values(selectedRowObjects)

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* Controles de Tabla (Búsqueda y Filtros) */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl md:rounded-full border bg-card p-2 md:p-1.5 shadow-sm">
        {/* Búsqueda Global */}
        <div className="relative flex-1 w-full md:max-w-2xl md:ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={currentGlobalFilter ?? ""}
            onChange={(event) => handleGlobalFilterChange(event.target.value)}
            className="pl-10 border md:border-0 bg-transparent shadow-none focus-visible:ring-1 md:focus-visible:ring-0 text-sm h-10 w-full rounded-xl md:rounded-none"
          />
        </div>

        {/* Filtros y Resultados */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 px-1 md:pr-4">
          <div className="flex items-center gap-2">
            {toolbarExtras}
          </div>

          <span className="text-[10px] md:text-xs text-muted-foreground md:ml-3 font-medium whitespace-nowrap">
            {table.getFilteredRowModel().rows.length} res.
          </span>
        </div>
      </div>

      {/* Contenido (Tabla o Tarjetas Móviles) */}
      {isMobile && renderMobileCard ? (
        // Vista de Tarjetas Móviles
        <div className="grid grid-cols-1 gap-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const rowId = getRowId(row.original)
              const isRowLoading = loadingRowIds.includes(rowId)
              const rowError = rowErrors[rowId]

              return (
                <div key={row.id} className="relative flex flex-col">
                  <div className={cn("relative transition-all", isRowLoading && "opacity-60 pointer-events-none")}>
                    {renderMobileCard(row.original)}
                    {isRowLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/30 rounded-2xl z-10 backdrop-blur-[1px]">
                        <Spinner size="lg" className="text-brand-blue" />
                      </div>
                    )}
                  </div>
                  {/* Banner de Error Móvil */}
                  {rowError && (
                    <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-brand-red text-sm font-medium animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex-1">{rowError}</div>
                      {onClearRowError && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 rounded-full hover:bg-red-100 text-brand-red shrink-0"
                          onClick={() => onClearRowError(rowId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="h-32 flex items-center justify-center text-center text-muted-foreground border rounded-xl bg-card">
              No se encontraron resultados para tu búsqueda.
            </div>
          )}
        </div>
      ) : (
        // Vista de Tabla Clásica
        <div className="rounded-2xl md:rounded-3xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-w-[100vw] md:max-w-none">
            <Table className="min-w-[600px] md:min-w-full">
              <TableHeader className="bg-transparent border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-14 align-middle cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {{
                              asc: <ArrowUp className="h-3 w-3" />,
                              desc: <ArrowDown className="h-3 w-3" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className={cn("transition-opacity duration-300", isFetching && "opacity-50 pointer-events-none")}>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const rowId = getRowId(row.original)
                    const isRowLoading = loadingRowIds.includes(rowId)
                    const rowError = rowErrors[rowId]

                    return (
                      <React.Fragment key={row.id}>
                        <TableRow
                          data-state={row.getIsSelected() && "selected"}
                          className={cn(
                            "hover:bg-muted/30 transition-all border-b last:border-0",
                            isRowLoading && "opacity-50 pointer-events-none bg-muted/20"
                          )}
                        >
                          {row.getVisibleCells().map((cell, index) => (
                            <TableCell key={cell.id} className="py-4 text-sm font-medium relative">
                              {/* Spinner on the first cell if loading */}
                              {isRowLoading && index === 0 && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                  <Spinner size="sm" />
                                </div>
                              )}
                              <div className={cn(isRowLoading && index === 0 && "pl-6")}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Fila de Error (Inyectada debajo de la fila original) */}
                        {rowError && (
                          <TableRow className="border-b border-red-100 bg-red-50/50 hover:bg-red-50/80 animate-in fade-in slide-in-from-top-1">
                            <TableCell colSpan={columns.length} className="py-2.5 px-4">
                              <div className="flex items-center justify-between text-brand-red">
                                <div className="flex items-center text-sm font-medium">
                                  <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                                  {rowError}
                                </div>
                                {onClearRowError && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 rounded-full hover:bg-red-100 text-brand-red"
                                    onClick={() => onClearRowError(rowId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                      No se encontraron resultados para tu búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* Footer de Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <span>
            Página <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> de{" "}
            <span className="font-medium text-foreground">{table.getPageCount()}</span>
          </span>
          <span className="hidden sm:inline-block w-px h-4 bg-border"></span>
          <span className="hidden sm:inline-block">
            {table.getFilteredRowModel().rows.length} registros en esta vista
          </span>
        </div>
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(val) => {
                table.setPageSize(Number(val))
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs rounded-md bg-transparent border-input shadow-sm focus:ring-1 focus:ring-ring">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(pageSize => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full flex-1 sm:flex-none"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full flex-1 sm:flex-none"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Acciones Masivas Flotante */}
      {bulkActions.length > 0 && selectedRows.length > 0 && (
        <DataTableBulkActions
          selectedRows={selectedRows}
          actions={bulkActions}
          onClearSelection={() => table.toggleAllRowsSelected(false)}
        />
      )}
    </div>
  )
}
