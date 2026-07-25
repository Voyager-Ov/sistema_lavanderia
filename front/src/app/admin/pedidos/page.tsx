"use client"

import React, { useRef, useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { getPedidoColumns } from "./components/pedido-columns"
import { PedidosHeader } from "./components/pedidos-header"
import { PedidosKpis } from "./components/pedidos-kpis"
import { PedidosTable } from "./components/pedidos-table"
import { PedidosModals } from "./components/pedidos-modals"
import { usePedidosData } from "./hooks/usePedidosData"
import { usePedidosActions } from "./hooks/usePedidosActions"
import { usePedidosModals } from "./hooks/usePedidosModals"
import { CheckCircle2, Clock, Printer, XCircle } from "lucide-react"

export default function PedidosPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
    handleGenerateFactura
  } = usePedidosActions({ pedidos, setPedidos, fetchOrders, fetchStats })

  const { modalsProps, handlePrintTicket } = usePedidosModals()

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

  const columns = useMemo(() => getPedidoColumns({
    onView: (pedido) => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        modalsProps.setPedidoToView(pedido)
        modalsProps.setIsViewSheetOpen(true)
      } else {
        router.push(`/admin/pedidos/${pedido.id}`)
      }
    },
    onCancel: (pedido) => {
      modalsProps.setPedidoToCancel(pedido)
      modalsProps.setIsCancelSheetOpen(true)
    },
    onChangeStatus: handleStatusChange,
    onPrintTicket: handlePrintTicket,
    onGenerateFactura: handleGenerateFactura,
    onCobrar: (pedido) => {
      modalsProps.setPedidoToCobrar(pedido)
      modalsProps.setIsCobrarSheetOpen(true)
    }
  }), [handleStatusChange, modalsProps, handlePrintTicket, handleGenerateFactura, router])

  const bulkActions = [
    {
      label: "Cambiar Estado",
      type: "dropdown",
      icon: Clock,
      colorClass: "bg-white/60 dark:bg-neutral-800/60 text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-neutral-50 hover:bg-white dark:hover:bg-neutral-800 border border-white dark:border-neutral-700 shadow-sm transition-colors",
      options: [
        {
          label: "Marcar como Pendientes",
          icon: Clock,
          colorClass: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 data-[highlighted]:bg-blue-50 dark:data-[highlighted]:bg-blue-500/10 data-[highlighted]:text-blue-700 dark:data-[highlighted]:text-blue-300 transition-colors",
          onClick: async (selectedRows: any, clearSelection: any) => {
            await processBulkStatusChange(selectedRows, "PENDIENTE", "Pendiente", clearSelection)
          }
        },
        {
          label: "Marcar como En Proceso",
          icon: Clock,
          colorClass: "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 data-[highlighted]:bg-orange-50 dark:data-[highlighted]:bg-orange-500/10 data-[highlighted]:text-orange-700 dark:data-[highlighted]:text-orange-300 transition-colors",
          onClick: async (selectedRows: any, clearSelection: any) => {
            await processBulkStatusChange(selectedRows, "EN_PROCESO", "En Proceso", clearSelection)
          }
        },
        {
          label: "Marcar como Listos",
          icon: CheckCircle2,
          colorClass: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 data-[highlighted]:bg-green-50 dark:data-[highlighted]:bg-green-500/10 data-[highlighted]:text-green-700 dark:data-[highlighted]:text-green-300 transition-colors",
          onClick: async (selectedRows: any, clearSelection: any) => {
            await processBulkStatusChange(selectedRows, "LISTO_PARA_RETIRAR", "Listo para retirar", clearSelection)
          }
        }
      ]
    },
    {
      label: "Imprimir Tickets",
      icon: Printer,
      colorClass: "bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/90 dark:hover:bg-indigo-500/20 border-indigo-100 dark:border-indigo-500/20 hover:shadow-md backdrop-blur-md transition-colors",
      onClick: async (selectedRows: any, clearSelection: any) => {
        modalsProps.setPedidosToBulkPrint(selectedRows)
        modalsProps.setIsBulkPrintActive(true)
        ;(window as any)._clearPrintSelection = clearSelection
      }
    },
    {
      label: "Cobrar Masivamente",
      icon: Clock,
      colorClass: "bg-green-50/80 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100/90 dark:hover:bg-green-500/20 border-green-100 dark:border-green-500/20 hover:shadow-md backdrop-blur-md transition-colors",
      onClick: (selectedRows: any, clearSelection: any) => {
        modalsProps.setPedidosToBulkCharge(selectedRows)
        modalsProps.setIsBulkChargeOpen(true)
        ;(window as any)._clearChargeSelection = clearSelection
      }
    },
    {
      label: "Cancelar",
      icon: XCircle,
      variant: "destructive",
      onClick: async (selectedRows: any, clearSelection: any) => {
        modalsProps.setPedidosToBulkCancel(selectedRows)
        modalsProps.setIsBulkCancelOpen(true)
        ;(window as any)._clearSelection = clearSelection
      }
    }
  ]

  const refreshAll = () => {
    fetchOrders()
    fetchStats()
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6">
      <div className="flex-1 w-full flex flex-col gap-8">
        
        <PedidosHeader
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          setQuickFilter={setQuickFilter}
          onClearFilters={() => { setFechaInicio(""); setFechaFin(""); setPagination((p: any) => ({...p, pageIndex: 0})) }}
        />

        <PedidosKpis stats={stats} isLoading={isStatsLoading} />

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
        handleGenerateFactura={handleGenerateFactura} 
      />
    </div>
  )
}
