"use client"

import React, { useRef, useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { MessageCircle, PowerOff } from "lucide-react"
import { getClienteColumns } from "./components/cliente-columns"
import { ClientesHeader } from "./components/clientes-header"
import { ClientesKpis } from "./components/clientes-kpis"
import { ClientesTable } from "./components/clientes-table"
import { useClientesData } from "./hooks/useClientesData"
import { useClientesModals } from "./hooks/useClientesModals"
import { ClientesModals } from "./components/clientes-modals"

export default function ClientesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const {
    clientes, setClientes,
    stats,
    isTableFetching, isStatsLoading,
    searchTerm, setSearchTerm,
    pagination, setPagination,
    sorting, setSorting,
    totalItems, totalPages,
    fetchClients, fetchStats,
  } = useClientesData()

  const { modalsProps } = useClientesModals()

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

  const columns = useMemo(() => getClienteColumns({
    onView: (cliente) => {
      router.push(`/admin/clientes/${cliente.id}`)
    },
    onEdit: (cliente) => {
      router.push(`/admin/clientes/${cliente.id}/editar`)
    },
    onCobrarDeuda: (cliente) => {},
    onDesactivar: (cliente) => {
      modalsProps.setClienteToDesactivar(cliente)
      modalsProps.setIsDesactivarOpen(true)
    }
  }), [modalsProps, router])

  const refreshAll = () => {
    fetchClients()
    fetchStats()
  }

  const bulkActions = useMemo(() => [
    {
      label: "Enviar WhatsApp",
      icon: MessageCircle,
      colorClass: "bg-green-50/80 text-green-700 hover:bg-green-100/90 border-green-100 hover:shadow-md backdrop-blur-md",
      onClick: (selected: any[], clearSelection: any) => {
        const con = selected.filter(c => c.telefono)
        if (con.length === 0) return
        // Abre WhatsApp para el primero (wa.me no soporta multi-número)
        const tel = con[0].telefono.replace(/\D/g, "")
        window.open(`https://wa.me/${tel}`, "_blank")
      }
    },
    {
      label: "Desactivar",
      icon: PowerOff,
      colorClass: "bg-red-50/80 text-red-700 hover:bg-red-100/90 border-red-100 hover:shadow-md backdrop-blur-md",
      onClick: (selected: any[], clearSelection: any) => {
        if (selected.length === 1) {
          modalsProps.setClienteToDesactivar(selected[0])
          modalsProps.setIsDesactivarOpen(true)
        }
      },
      requireConfirm: false,
    }
  ], [modalsProps])

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6">
      <div className="flex-1 w-full flex flex-col gap-8">
        
        <ClientesHeader />

        <ClientesKpis clientes={clientes} totalItems={totalItems} isLoading={isStatsLoading} />

        <ClientesTable
          clientes={clientes}
          columns={columns as any}
          isTableFetching={isTableFetching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pagination={pagination}
          setPagination={setPagination}
          totalPages={totalPages}
          sorting={sorting}
          setSorting={setSorting}
          bulkActions={bulkActions}
        />
      </div>

      <ClientesModals props={modalsProps} onActionSuccess={refreshAll} />
    </div>
  )
}
