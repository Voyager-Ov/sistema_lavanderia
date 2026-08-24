"use client"

import React, { useRef, useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import { useServiciosData } from "@/app/admin/servicios/hooks/useServiciosData"
import { getPosServicioColumns } from "./components/pos-servicio-columns"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { ServiciosKpis } from "@/app/admin/servicios/components/servicios-kpis"
import { ShoppingBag } from "lucide-react"
import { Categoria } from "@/domains/categorias/api"

export default function PosServiciosPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    servicios,
    stats,
    categorias,
    isTableFetching, isStatsLoading,
    searchTerm, setSearchTerm,
    activeFilter, setActiveFilter,
    categoriaFilter, setCategoriaFilter,
    pagination, setPagination,
    sorting, setSorting,
    totalPages,
  } = useServiciosData()

  gsap.registerPlugin(useGSAP)
  useGSAP(() => {
    const items = gsap.utils.toArray('.fade-item')
    if (items.length > 0) {
      gsap.fromTo(items, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "transform" }
      )
    }
  }, { scope: containerRef })

  const columns = useMemo(() => getPosServicioColumns(), [])

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 p-4 lg:p-8">
      <div className="flex-1 w-full flex flex-col gap-8">
        
        <div className="fade-item flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-brand-blue" />
              Catálogo de Servicios
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Consulta los precios y tiempos estimados de los servicios de lavandería.</p>
          </div>
        </div>

        <ServiciosKpis stats={stats} isLoading={isStatsLoading} />

        <div className="fade-item relative z-0 flex flex-col gap-4">
          <DataTable
            columns={columns}
            data={servicios}
            isFetching={isTableFetching}
            searchPlaceholder="Buscar servicio por nombre o categoría..."
            globalFilter={searchTerm}
            onGlobalFilterChange={(val) => {
              setSearchTerm(val)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            manualPagination={true}
            pageCount={totalPages}
            pagination={pagination}
            onPaginationChange={setPagination}
            manualSorting={true}
            sorting={sorting}
            onSortingChange={setSorting}
            manualFiltering={true}
            filters={[
              {
                key: "estado",
                label: "Disponibilidad",
                value: activeFilter,
                onChange: (val) => {
                  setActiveFilter(val)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                },
                options: [
                  { label: "Todos", value: "ALL" },
                  { label: "Disponibles", value: "true" },
                  { label: "No Disponibles", value: "false" }
                ]
              },
              {
                key: "categoria",
                label: "Categoría",
                value: categoriaFilter,
                onChange: (val) => {
                  setCategoriaFilter(val)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                },
                options: [
                  { label: "Todas", value: "ALL" },
                  ...categorias.map((c: Categoria) => ({ label: c.nombre, value: c.id.toString() }))
                ]
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}
