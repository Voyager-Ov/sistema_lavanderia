"use client"

import React, { useRef, useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { getEmpleadoColumns } from "./components/empleado-columns"
import { EmpleadosHeader } from "./components/empleados-header"
import { EmpleadosKpis } from "./components/empleados-kpis"
import { EmpleadosTable } from "./components/empleados-table"
import { useEmpleadosData } from "./hooks/useEmpleadosData"
import { useEmpleadosModals } from "./hooks/useEmpleadosModals"
import { EmpleadosModals } from "./components/empleados-modals"

export default function EmpleadosPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const {
    empleados,
    stats,
    isTableFetching, isStatsLoading,
    searchTerm, setSearchTerm,
    pagination, setPagination,
    sorting, setSorting,
    totalPages,
    fetchEmpleados, fetchStats,
  } = useEmpleadosData()

  const { modalsProps } = useEmpleadosModals()

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

  const columns = useMemo(() => getEmpleadoColumns({
    onView: (empleado) => {
      router.push(`/admin/empleados/${empleado.id}`)
    },
    onEdit: (empleado) => {
      modalsProps.setEmpleadoToEdit(empleado)
      modalsProps.setIsEditarOpen(true)
    },
    onDesactivar: (empleado) => {
      modalsProps.setEmpleadoToDesactivar(empleado)
      modalsProps.setIsDesactivarOpen(true)
    }
  }), [modalsProps, router])

  const refreshAll = () => {
    fetchEmpleados()
    fetchStats()
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6">
      <div className="flex-1 w-full flex flex-col gap-8">
        <EmpleadosHeader />
        <EmpleadosKpis stats={stats} isLoading={isStatsLoading} />
        <EmpleadosTable
          empleados={empleados}
          columns={columns as any}
          isTableFetching={isTableFetching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pagination={pagination}
          setPagination={setPagination}
          totalPages={totalPages}
          sorting={sorting}
          setSorting={setSorting}
        />
      </div>

      <EmpleadosModals props={modalsProps} onActionSuccess={refreshAll} />
    </div>
  )
}
