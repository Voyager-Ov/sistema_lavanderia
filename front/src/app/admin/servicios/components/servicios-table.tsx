import React, { useMemo, useState } from "react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { BulkAction } from "@/shared/ui/data-display/data-table-bulk-actions"
import { getServicioColumns } from "./servicio-columns"
import { ServiciosBulkPriceModal } from "./servicios-bulk-price-modal"
import { DollarSign, Power, PowerOff, Percent } from "lucide-react"
import { Servicio, actualizarDisponibilidadMasiva } from "@/domains/productos/api"
import { Categoria } from "@/domains/categorias/api"
import { toast } from "sonner"
import { SortingState } from "@tanstack/react-table"

interface ServiciosTableProps {
  data: {
    servicios: Servicio[];
    categorias: Categoria[];
    isTableFetching: boolean;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    activeFilter: string;
    setActiveFilter: (val: string) => void;
    categoriaFilter: string;
    setCategoriaFilter: (val: string) => void;
    pagination: { pageIndex: number; pageSize: number };
    setPagination: React.Dispatch<React.SetStateAction<{ pageIndex: number; pageSize: number }>>;
    sorting: SortingState;
    setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
    totalPages: number;
    fetchServicios: () => void;
    fetchStats: () => void;
  };
  actions: {
    handleToggleDisponibilidad: (id: number, disponible: boolean) => Promise<void>;
  };
  modals: {
    handleHistory: (servicio: Servicio) => void;
  };
  onEdit: (servicio: Servicio) => void;
  onView: (servicio: Servicio) => void;
}

export function ServiciosTable({ data, actions, modals, onEdit, onView }: ServiciosTableProps) {
  const [bulkPriceOpen, setBulkPriceOpen] = useState<boolean>(false)
  const [bulkPriceMode, setBulkPriceMode] = useState<"percentage" | "individual">("percentage")
  const [selectedForBulk, setSelectedForBulk] = useState<Servicio[]>([])
  const [clearSelectionFn, setClearSelectionFn] = useState<(() => void) | null>(null)

  const columns = useMemo(() => getServicioColumns({
    onView,
    onEdit,
    onHistory: modals.handleHistory,
    onToggleStatus: actions.handleToggleDisponibilidad,
  }), [onView, onEdit, modals.handleHistory, actions.handleToggleDisponibilidad])

  const bulkActions: BulkAction<Servicio>[] = [
    {
      label: "Ajustar Precios",
      icon: DollarSign,
      type: "dropdown",
      options: [
        {
          label: "Subir / Bajar por %",
          icon: Percent,
          onClick: (rows: Servicio[], clearSelection: () => void) => {
            setSelectedForBulk(rows)
            setClearSelectionFn(() => clearSelection)
            setBulkPriceMode("percentage")
            setTimeout(() => {
              setBulkPriceOpen(true)
            }, 100)
          },
        },
        {
          label: "Precio individual",
          icon: DollarSign,
          onClick: (rows: Servicio[], clearSelection: () => void) => {
            setSelectedForBulk(rows)
            setClearSelectionFn(() => clearSelection)
            setBulkPriceMode("individual")
            setTimeout(() => {
              setBulkPriceOpen(true)
            }, 100)
          },
        },
      ],
    },
    {
      label: "Activar todos",
      icon: Power,
      colorClass: "bg-green-50/80 text-green-700 hover:bg-green-100/90 border border-green-200 hover:shadow-md backdrop-blur-md",
      onClick: async (rows: Servicio[], clearSelection: () => void) => {
        try {
          const ids = rows.map((s: Servicio) => s.id)
          await actualizarDisponibilidadMasiva(ids, true)
          toast.success(`${rows.length} servicio(s) activados`)
          data.fetchServicios()
          clearSelection()
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Error al activar servicios"
          toast.error(`Error: ${msg}`)
        }
      },
    },
    {
      label: "Pausar todos",
      icon: PowerOff,
      variant: "destructive" as const,
      onClick: async (rows: Servicio[], clearSelection: () => void) => {
        try {
          const ids = rows.map((s: Servicio) => s.id)
          await actualizarDisponibilidadMasiva(ids, false)
          toast.success(`${rows.length} servicio(s) pausados`)
          data.fetchServicios()
          clearSelection()
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Error al pausar servicios"
          toast.error(`Error: ${msg}`)
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
          data.setPagination((p) => ({ ...p, pageIndex: 0 }))
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
              data.setPagination((p) => ({ ...p, pageIndex: 0 }))
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
              data.setPagination((p) => ({ ...p, pageIndex: 0 }))
            },
            options: [
              { label: "Todas", value: "ALL" },
              ...data.categorias.map((c: Categoria) => ({ label: c.nombre, value: c.id.toString() }))
            ]
          }
        ]}
      />

      <ServiciosBulkPriceModal
        open={bulkPriceOpen}
        onOpenChange={setBulkPriceOpen}
        selectedServices={selectedForBulk}
        initialMode={bulkPriceMode}
        onSuccess={() => {
          if (clearSelectionFn) clearSelectionFn();
          data.fetchServicios();
          data.fetchStats();
        }}
      />
    </div>
  )
}
