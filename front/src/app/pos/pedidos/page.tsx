"use client"

import React, { useRef, useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"

// Reusing Hooks from Admin
import { usePedidosData } from "@/app/admin/pedidos/hooks/usePedidosData"
import { usePedidosActions } from "@/app/admin/pedidos/hooks/usePedidosActions"
import { usePedidosModals } from "@/app/admin/pedidos/hooks/usePedidosModals"

// Reusing Admin Components
import { PedidosHeader } from "@/app/admin/pedidos/components/pedidos-header"
import { PedidosKpis } from "@/app/admin/pedidos/components/pedidos-kpis"
import { PedidosTable } from "@/app/admin/pedidos/components/pedidos-table"
import { PedidosModals } from "@/app/admin/pedidos/components/pedidos-modals"
import { getPosPedidoColumns } from "./components/pos-pedido-columns"

import { Clock, Printer, XCircle, CheckCircle2 } from "lucide-react"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import { obtenerConfiguracion } from "@/domains/configuracion/api"

import { useSocket } from "@/shared/hooks/useSocket"

export default function PosPedidosPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setAllConfig, isLoaded, setIsLoaded } = useConfigStore()
  const { socket } = useSocket()

  React.useEffect(() => {
    if (!isLoaded) {
      obtenerConfiguracion().then((data) => {
        if (data) setAllConfig(data)
        setIsLoaded(true)
      }).catch(() => setIsLoaded(true))
    }
  }, [isLoaded, setAllConfig, setIsLoaded])

  const {
    pedidos, setPedidos,
    stats,
    isTableFetching, isStatsLoading,
    searchTerm, setSearchTerm,
    activeFilter, setActiveFilter,
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
    pagination, setPagination,
    sorting, setSorting,
    totalPages,
    fetchOrders, fetchStats,
    setQuickFilter,
  } = usePedidosData()

  const {
    loadingRowIds,
    rowErrors, setRowErrors,
    handleStatusChange,
    processBulkStatusChange,
  } = usePedidosActions({ pedidos, setPedidos, fetchOrders, fetchStats })

  const { modalsProps, handlePrintTicket } = usePedidosModals()

  const refreshAll = React.useCallback(() => {
    fetchOrders()
    fetchStats()
  }, [fetchOrders, fetchStats])

  React.useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      refreshAll()
    }

    socket.on("pedido:creado", handleUpdate)
    socket.on("pedido:estado_cambiado", handleUpdate)

    return () => {
      socket.off("pedido:creado", handleUpdate)
      socket.off("pedido:estado_cambiado", handleUpdate)
    }
  }, [socket, refreshAll])

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

  // Custom Columns for POS: Overwrite or reuse admin columns but hide "Facturar"
  const columns = useMemo(() => getPosPedidoColumns({
    onView: (pedido) => {
      router.push(`/pos/pedidos/${pedido.id}`)
    },
    onCancel: (pedido) => {
      modalsProps.setPedidoToCancel(pedido)
      modalsProps.setIsCancelSheetOpen(true)
    },
    onChangeStatus: handleStatusChange,
    onPrintTicket: handlePrintTicket,
    onCobrar: (pedido) => {
      modalsProps.setPedidoToCobrar(pedido)
      modalsProps.setIsCobrarSheetOpen(true)
    }
  }), [handleStatusChange, modalsProps, handlePrintTicket, router])

  // Custom bulk actions for POS
  const bulkActions = [
    {
      label: "Imprimir Tickets",
      icon: Printer,
      colorClass: "bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/90 dark:hover:bg-indigo-500/20 border-indigo-100 dark:border-indigo-500/20 hover:shadow-md backdrop-blur-md transition-colors",
      onClick: async (selectedRows: any, clearSelection: any) => {
        modalsProps.setPedidosToBulkPrint(selectedRows)
        modalsProps.setIsBulkPrintActive(true)
        ;(window as any)._clearPrintSelection = clearSelection
      }
    }
  ]

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 p-4 lg:p-8">
      <div className="flex-1 w-full flex flex-col gap-6">
        <PedidosHeader
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          setQuickFilter={setQuickFilter}
          onClearFilters={() => { setFechaInicio(""); setFechaFin(""); setPagination((p: any) => ({...p, pageIndex: 0})) }}
          hideNewOrderButton={true}
        />

        <div className="fade-item">
          <PedidosKpis stats={stats} isLoading={isStatsLoading} />
        </div>

        <PedidosTable
          pedidos={pedidos}
          columns={columns as any}
          loadingRowIds={loadingRowIds}
          rowErrors={rowErrors}
          onClearRowError={(id) => setRowErrors((prev: any) => { const newObj = {...prev}; delete newObj[id]; return newObj; })}
          onClearAllErrors={() => setRowErrors({})}
          isTableFetching={isTableFetching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          pagination={pagination}
          setPagination={setPagination}
          totalPages={totalPages}
          sorting={sorting}
          setSorting={setSorting}
          bulkActions={bulkActions as any}
        />
      </div>

      <PedidosModals 
        props={modalsProps} 
        onActionSuccess={refreshAll} 
        handleGenerateFactura={async () => {}} 
        setRowErrors={setRowErrors}
      />
    </div>
  )
}
