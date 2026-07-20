import { useState } from "react"
import { Pedido, getTicketsPedidoAPI, generarTicketsAPI } from "@/domains/pedidos/api"
import { toast } from "sonner"

export function usePedidosModals() {
  const [pedidoToCancel, setPedidoToCancel] = useState<Pedido | null>(null)
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false)

  const [isCobrarSheetOpen, setIsCobrarSheetOpen] = useState(false)
  const [pedidoToCobrar, setPedidoToCobrar] = useState<Pedido | null>(null)

  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [pedidoToView, setPedidoToView] = useState<Pedido | null>(null)

  const [isBulkCancelOpen, setIsBulkCancelOpen] = useState(false)
  const [pedidosToBulkCancel, setPedidosToBulkCancel] = useState<Pedido[]>([])

  const [isBulkPrintActive, setIsBulkPrintActive] = useState(false)
  const [pedidosToBulkPrint, setPedidosToBulkPrint] = useState<Pedido[]>([])

  const [isBulkChargeOpen, setIsBulkChargeOpen] = useState(false)
  const [pedidosToBulkCharge, setPedidosToBulkCharge] = useState<Pedido[]>([])


  const [hiddenTickets, setHiddenTickets] = useState<any[]>([])
  const [hiddenPedido, setHiddenPedido] = useState<Pedido | null>(null)

  const handlePrintTicket = async (pedido: Pedido) => {
    try {
      let tickets = await getTicketsPedidoAPI(pedido.id).catch(() => [])
      
      if (!tickets || tickets.length === 0) {
        toast.info("Generando ticket...")
        tickets = await generarTicketsAPI(pedido.id, 1)
      }
      
      if (tickets && tickets.length > 0) {
        setHiddenPedido(pedido)
        setHiddenTickets(tickets)
        setTimeout(() => {
          window.print()
        }, 100)
      } else {
        toast.error("No se pudo generar el ticket.")
      }
    } catch (error) {
      toast.error("Error al procesar tickets del pedido.")
    }
  }

  const modalsProps = {
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
  }

  return { modalsProps, handlePrintTicket }
}
