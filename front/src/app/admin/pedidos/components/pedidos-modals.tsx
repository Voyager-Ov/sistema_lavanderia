import React from "react"
import { toast } from "sonner"
import { cambiarEstadoPedido } from "@/domains/pedidos/api"
import { ResponsiveSheet, ResponsiveSheetContent } from "@/shared/ui/overlays/responsive-sheet"
import { CancelOrderSheet } from "../components/cancel-order-sheet"
import { PedidoDetailView } from "../_components/pedido-detail-view"
import { CobrarPedidoSheet } from "../components/cobrar-pedido-sheet"
import { BulkCancellationWizard } from "../_components/bulk-cancellation-wizard"
import { PrintQueueManager } from "../_components/print-queue-manager"
import { BulkChargeModal } from "../_components/bulk-charge-modal"
import { TicketPrintTemplate } from "../_components/ticket-print-template"

interface PedidosModalsProps {
  props: any
  onActionSuccess: () => void
  handleGenerateFactura: (pedido: any) => Promise<void>
}

export function PedidosModals({ props, onActionSuccess, handleGenerateFactura }: PedidosModalsProps) {
  const {
    pedidoToCancel, setPedidoToCancel,
    isCancelSheetOpen, setIsCancelSheetOpen,
    isCobrarSheetOpen, setIsCobrarSheetOpen,
    pedidoToCobrar, setPedidoToCobrar,
    isViewSheetOpen, setIsViewSheetOpen,
    pedidoToView, setPedidoToView,
    isBulkCancelOpen, setIsBulkCancelOpen,
    pedidosToBulkCancel, setPedidosToBulkCancel,
    isBulkPrintActive, setIsBulkPrintActive,
    pedidosToBulkPrint, setPedidosToBulkPrint,
    isBulkChargeOpen, setIsBulkChargeOpen,
    pedidosToBulkCharge, setPedidosToBulkCharge,
    hiddenTickets, hiddenPedido,
    handlePrintTicket
  } = props

  return (
    <>
      <CancelOrderSheet 
        open={isCancelSheetOpen} 
        onOpenChange={setIsCancelSheetOpen} 
        pedido={pedidoToCancel} 
        onConfirm={async (id, motivo, desc) => {
          await cambiarEstadoPedido(
            id,
            "CANCELADO",
            "Cancelado desde lista de pedidos",
            motivo,
            desc
          )
          toast.success("Pedido cancelado exitosamente")
          setIsCancelSheetOpen(false)
          onActionSuccess()
        }}
      />

      {/* Sheet para Detalle de Pedido (Mobile/Tablet) */}
      <ResponsiveSheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <ResponsiveSheetContent className="px-4 py-8">
          {pedidoToView && (
            <PedidoDetailView 
              id={pedidoToView.id} 
              onPrintTicket={handlePrintTicket}
              onGenerateFactura={handleGenerateFactura}
              onCobrar={(p) => {
                setIsViewSheetOpen(false)
                setTimeout(() => {
                  setPedidoToCobrar(p)
                  setIsCobrarSheetOpen(true)
                }, 300)
              }}
            />
          )}
        </ResponsiveSheetContent>
      </ResponsiveSheet>
      
      <CobrarPedidoSheet 
        open={isCobrarSheetOpen} 
        onOpenChange={setIsCobrarSheetOpen} 
        pedido={pedidoToCobrar}
        onSuccess={() => {
          onActionSuccess()
        }}
      />

      <BulkCancellationWizard
        open={isBulkCancelOpen}
        onOpenChange={setIsBulkCancelOpen}
        pedidos={pedidosToBulkCancel}
        onComplete={() => {
          onActionSuccess()
          if (typeof (window as any)._clearSelection === "function") {
            (window as any)._clearSelection()
          }
        }}
      />

      {isBulkPrintActive && (
        <PrintQueueManager 
          pedidos={pedidosToBulkPrint}
          onComplete={() => {
            setIsBulkPrintActive(false)
            if (typeof (window as any)._clearPrintSelection === "function") {
              (window as any)._clearPrintSelection()
            }
          }}
        />
      )}

      <BulkChargeModal
        open={isBulkChargeOpen}
        onOpenChange={setIsBulkChargeOpen}
        pedidos={pedidosToBulkCharge}
        onSuccess={() => {
          onActionSuccess()
          if (typeof (window as any)._clearChargeSelection === "function") {
            (window as any)._clearChargeSelection()
          }
        }}
      />

      {hiddenPedido && hiddenTickets.length > 0 && (
        <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50">
          <TicketPrintTemplate 
            pedido={hiddenPedido} 
            tickets={hiddenTickets}
            trackingBaseUrl={typeof window !== 'undefined' ? `${window.location.origin}/tracking/1` : '/tracking/1'} 
          />
        </div>
      )}
    </>
  )
}
