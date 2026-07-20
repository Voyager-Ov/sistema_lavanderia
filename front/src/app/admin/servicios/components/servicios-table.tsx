import React, { useMemo, useState } from "react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { BulkAction } from "@/shared/ui/data-display/data-table-bulk-actions"
import { getServicioColumns } from "./servicio-columns"
import { ServiciosBulkPriceModal } from "./servicios-bulk-price-modal"
import { DollarSign, Power, PowerOff, Percent } from "lucide-react"
import { apiClient } from "@/shared/lib/api-client"
import { toast } from "sonner"

export function ServiciosTable({ data, actions, modals, onEdit, onView }: any) {
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false)
  const [bulkPriceMode, setBulkPriceMode] = useState<"percentage" | "individual">("percentage")
  const [selectedForBulk, setSelectedForBulk] = useState<any[]>([])

  const columns = useMemo(() => getServicioColumns({
    onView,
    onEdit,
    onHistory: modals.handleHistory,
    onToggleStatus: actions.handleToggleDisponibilidad,
  }), [onView, onEdit, modals.handleHistory, actions.handleToggleDisponibilidad])

  const bulkActions: BulkAction<any>[] = [
    {
      label: "Ajustar Precios",
      icon: DollarSign,
      type: "dropdown",
      options: [
        {
          label: "Subir / Bajar por %",
          icon: Percent,
          onClick: (rows: any) => {
            setSelectedForBulk(rows)
            setBulkPriceMode("percentage")
            setBulkPriceOpen(true)
          },
        },
        {
          label: "Precio individual",
          icon: DollarSign,
          onClick: (rows: any) => {
            setSelectedForBulk(rows)
            setBulkPriceMode("individual")
            setBulkPriceOpen(true)
          },
        },
      ],
    },
    {
      label: "Activar todos",
      icon: Power,
      colorClass: "bg-green-50/80 text-green-700 hover:bg-green-100/90 border border-green-200 hover:shadow-md backdrop-blur-md",
      onClick: async (rows, clearSelection) => {
        try {
          const ids = rows.map((s: any) => s.id)
          await apiClient.patch("/productos/bulk/disponibilidad", { ids, disponible: true })
          toast.success(`${rows.length} servicio(s) activados`)
          data.fetchServicios()
          clearSelection()
        } catch (e: any) {
          toast.error(`Error: ${e.message}`)
        }
      },
    },
    {
      label: "Pausar todos",
      icon: PowerOff,
      variant: "destructive" as const,
      onClick: async (rows, clearSelection) => {
        try {
          const ids = rows.map((s: any) => s.id)
          await apiClient.patch("/productos/bulk/disponibilidad", { ids, disponible: false })
          toast.success(`${rows.length} servicio(s) pausados`)
          data.fetchServicios()
          clearSelection()
        } catch (e: any) {
          toast.error(`Error: ${e.message}`)
        }
      },
    },
  ]

  return (
    <div className="fade-item relative z-0 flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={data.servicios}
        isFetching={data.isTableFetching}
        searchPlaceholder="Buscar servicio por nombre o categoría..."
        globalFilter={data.searchTerm}
        onGlobalFilterChange={(val) => {
          data.setSearchTerm(val)
          data.setPagination((p: any) => ({ ...p, pageIndex: 0 }))
        }}
        manualPagination={true}
        pageCount={data.totalPages}
        pagination={data.pagination}
        onPaginationChange={data.setPagination}
        manualSorting={true}
        sorting={data.sorting}
        onSortingChange={data.setSorting}
        manualFiltering={true}
        bulkActions={bulkActions}
        filters={[
          {
            key: "estado",
            label: "Estado",
            value: data.activeFilter,
            onChange: (val) => {
              data.setActiveFilter(val)
              data.setPagination((p: any) => ({ ...p, pageIndex: 0 }))
            },
            options: [
              { label: "Todos", value: "ALL" },
              { label: "Activos", value: "true" },
              { label: "Inactivos", value: "false" }
            ]
          },
          {
            key: "categoria",
            label: "Categoría",
            value: data.categoriaFilter,
            onChange: (val) => {
              data.setCategoriaFilter(val)
              data.setPagination((p: any) => ({ ...p, pageIndex: 0 }))
            },
            options: [
              { label: "Todas", value: "ALL" },
              ...data.categorias.map((c: any) => ({ label: c.nombre, value: c.id.toString() }))
            ]
          }
        ]}
      />

      <ServiciosBulkPriceModal
        open={bulkPriceOpen}
        onOpenChange={setBulkPriceOpen}
        selectedServices={selectedForBulk}
        initialMode={bulkPriceMode}
        onSuccess={() => { data.fetchServicios(); data.fetchStats() }}
      />
    </div>
  )
}
