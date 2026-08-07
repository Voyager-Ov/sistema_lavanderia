"use client"

import React, { useRef, useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"

// Reuse Admin Hooks
import { useClientesData } from "@/app/admin/clientes/hooks/useClientesData"
import { useClientesModals } from "@/app/admin/clientes/hooks/useClientesModals"

// Reuse Admin Components
import { getClienteColumns } from "@/app/admin/clientes/components/cliente-columns"
import { ClientesKpis } from "@/app/admin/clientes/components/clientes-kpis"
import { ClientesTable } from "@/app/admin/clientes/components/clientes-table"
import { ClientesModals } from "@/app/admin/clientes/components/clientes-modals"
import { Button } from "@/shared/ui/forms/button"

export default function PosClientesPage() {
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
      router.push(`/pos/clientes/${cliente.id}`)
    },
    onEdit: (cliente) => {
      router.push(`/pos/clientes/${cliente.id}/editar`)
    },
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
        const tel = con[0].telefono.replace(/\D/g, "")
        window.open(`https://wa.me/${tel}`, "_blank")
      }
    }
  ], [])

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 p-4 lg:p-8">
      <div className="flex-1 w-full flex flex-col gap-8">
        
        <div className="fade-item flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Directorio de Clientes</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona la información de contacto de los clientes.</p>
          </div>
          <Button onClick={() => router.push('/pos/clientes/nuevo')} className="rounded-full h-12 px-6 shadow-sm hover:shadow-md transition-all font-bold gap-2">
            <span className="text-lg leading-none">+</span> Nuevo Cliente
          </Button>
        </div>

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
