"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { PedidoDetailView } from "../_components/pedido-detail-view"
import { ArrowLeft } from "lucide-react"
import { getTicketHTML, generarFactura, Pedido } from "@/domains/pedidos/api"
import { toast } from "sonner"
import { CobrarPedidoSheet } from "../components/cobrar-pedido-sheet"
import { useState } from "react"

export default function PedidoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [isCobrarSheetOpen, setIsCobrarSheetOpen] = useState(false)
  const [pedidoToCobrar, setPedidoToCobrar] = useState<Pedido | null>(null)

  const handlePrintTicket = async (pedidoId: number) => {
    try {
      const html = await getTicketHTML(pedidoId)
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
      } else {
        toast.error("El navegador bloqueó la ventana de impresión.")
      }
    } catch (error) {
      toast.error("Error al generar el ticket.")
    }
  }

  const handleGenerateFactura = async (pedidoId: number) => {
    toast.promise(
      generarFactura(pedidoId),
      {
        loading: 'Generando factura AFIP...',
        success: (res: any) => `Factura creada. CAE: ${res.cae} - Nro: ${res.nroComprobante}`,
        error: (err: any) => err.response?.data?.message || 'Error al generar factura.'
      }
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-neutral-900 p-4 md:p-8 pt-2 transition-colors">
      
      <div className="max-w-5xl mx-auto mb-6 flex items-center">
        <button 
          onClick={() => router.push('/admin/pedidos')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors bg-white dark:bg-neutral-800 px-4 py-2 rounded-full border border-gray-200 dark:border-neutral-700/50 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Pedidos
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] md:shadow-sm md:border border-gray-200 dark:border-neutral-700/50 p-2 md:p-8 transition-colors">
        <PedidoDetailView 
          id={id} 
          onPrintComprobante={handlePrintTicket}
          onGenerateFactura={handleGenerateFactura}
          onCobrar={(pedido) => {
            setPedidoToCobrar(pedido)
            setIsCobrarSheetOpen(true)
          }}
        />
      </div>

      <CobrarPedidoSheet 
        open={isCobrarSheetOpen} 
        onOpenChange={setIsCobrarSheetOpen} 
        pedido={pedidoToCobrar}
        onSuccess={() => {
          setIsCobrarSheetOpen(false)
          // Simple reload to refresh data
          window.location.reload()
        }}
      />
    </div>
  )
}
