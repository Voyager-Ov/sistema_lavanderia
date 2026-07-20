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
      colorClass: "bg-white/60 text-gray-700 hover:text-gray-900 hover:bg-white border border-white shadow-sm",
      options: [
        {
          label: "Marcar como Pendientes",
          icon: Clock,
          colorClass: "text-blue-600 hover:bg-blue-50 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700",
          onClick: async (selectedRows: any, clearSelection: any) => {
            await processBulkStatusChange(selectedRows, "PENDIENTE", "Pendiente", clearSelection)
          }
        },
        {
          label: "Marcar como En Proceso",
          icon: Clock,
          colorClass: "text-orange-600 hover:bg-orange-50 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700",
          onClick: async (selectedRows: any, clearSelection: any) => {
            await processBulkStatusChange(selectedRows, "EN_PROCESO", "En Proceso", clearSelection)
          }
        },
        {
          label: "Marcar como Listos",
          icon: CheckCircle2,
          colorClass: "text-green-600 hover:bg-green-50 data-[highlighted]:bg-green-50 data-[highlighted]:text-green-700",
          onClick: async (selectedRows: any, clearSelection: any) => {
            await processBulkStatusChange(selectedRows, "LISTO_PARA_RETIRAR", "Listo para retirar", clearSelection)
          }
        }
      ]
    },
    {
      label: "Imprimir Tickets",
      icon: Printer,
      colorClass: "bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/90 border-indigo-100 hover:shadow-md backdrop-blur-md",
      onClick: async (selectedRows: any, clearSelection: any) => {
        modalsProps.setPedidosToBulkPrint(selectedRows)
        modalsProps.setIsBulkPrintActive(true)
        ;(window as any)._clearPrintSelection = clearSelection
      }
    },
    {
      label: "Cobrar Masivamente",
      icon: Clock,
      colorClass: "bg-green-50/80 text-green-700 hover:bg-green-100/90 border-green-100 hover:shadow-md backdrop-blur-md",
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
