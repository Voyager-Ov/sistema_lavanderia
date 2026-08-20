import React from "react"
import { toast } from "sonner"
import { cambiarEstadoPedido, getTicketHTML } from "@/domains/pedidos/api"
import { ResponsiveSheet, ResponsiveSheetContent } from "@/shared/ui/overlays/responsive-sheet"
import { CancelOrderSheet } from "../components/cancel-order-sheet"
import { PedidoDetailView } from "../_components/pedido-detail-view"
import { CobrarPedidoSheet } from "./cobrar-pedido-sheet"
import { BulkCancellationWizard } from "../_components/bulk-cancellation-wizard"
import { PrintQueueManager } from "../_components/print-queue-manager"
import { TicketPrintTemplate } from "../_components/ticket-print-template"

interface PedidosModalsProps {
  props: any
  onActionSuccess: () => void
  handleGenerateFactura: (pedido: any) => Promise<void>
  setRowErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function PedidosModals({ props, onActionSuccess, handleGenerateFactura, setRowErrors }: PedidosModalsProps) {
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
    hiddenTickets, hiddenPedido,
    handlePrintTicket
  } = props

  return (
    <>
      <CancelOrderSheet 
        open={isCancelSheetOpen} 
        onOpenChange={setIsCancelSheetOpen} 
        pedido={pedidoToCancel} 
        onConfirm={async (id, motivo, desc, accionDinero) => {
          await cambiarEstadoPedido(
            id,
            "CANCELADO",
            "Cancelado desde lista de pedidos",
            motivo,
            desc,
            accionDinero
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
              onPrintComprobante={async (id) => {
                try {
                  const html = await getTicketHTML(id)
                  const printWindow = window.open('', '_blank', 'width=400,height=600')
                  if (printWindow) {
                    printWindow.document.write(html)
                    printWindow.document.close()
                  }
                } catch (e) {
                  toast.error("Error al generar comprobante")
                }
              }}
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
        onPrint={handlePrintTicket}
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

      {hiddenPedido && hiddenTickets.length > 0 && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[999999] print:m-0 print:p-0">
          <TicketPrintTemplate 
            pedido={hiddenPedido} 
            tickets={hiddenTickets}
            trackingBaseUrl={typeof window !== 'undefined' ? `${window.location.origin}/tracking/${(hiddenPedido as any).negocioId || 1}` : `/tracking/${(hiddenPedido as any).negocioId || 1}`} 
          />
        </div>
      )}
    </>
  )
}
