"use client"

import * as React from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Pedido, generarTicketsAPI, getTicketHTML } from "@/domains/pedidos/api"
import { toast } from "sonner"
import { Loader2, Printer, X } from "lucide-react"

interface PrintQueueManagerProps {
  pedidos: Pedido[]
  onComplete: () => void
}

export function PrintQueueManager({ pedidos, onComplete }: PrintQueueManagerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isCancelled, setIsCancelled] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const htmlResults = React.useRef<string[]>([])

  const total = pedidos.length
  const progress = Math.round(((currentIndex) / total) * 100)

  // Entry animation
  useGSAP(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
      )
    }
  }, [])

  React.useEffect(() => {
    let active = true

    const processQueue = async () => {
      for (let i = 0; i < total; i++) {
        if (!active || isCancelled) {
          toast.error("Impresión masiva cancelada.")
          onComplete()
          return
        }

        const pedido = pedidos[i]
        setCurrentIndex(i + 1)
        
        try {
          // Generar el ticket en base de datos primero (1 ticket por pedido)
          await generarTicketsAPI(pedido.id, 1)
          
          // Luego obtener el HTML
          const html = await getTicketHTML(pedido.id)
          htmlResults.current.push(html)
          
          // Small delay for UI updates
          await new Promise(r => setTimeout(r, 300))
        } catch (error) {
          console.error(`Error processing ticket for pedido ${pedido.id}:`, error)
          toast.error(`Error al generar ticket para el pedido #${pedido.codigoSeguimiento}`)
          // Continue to next anyway
        }
      }

      if (active && !isCancelled && htmlResults.current.length > 0) {
        toast.success("Tickets generados con éxito.")
        const fullHtml = htmlResults.current.join('<div style="page-break-after: always;"></div>')
        const printWindow = window.open('', '_blank', 'width=400,height=600')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Impresión Masiva</title></head>
              <body onload="setTimeout(() => window.print(), 500)">
                ${fullHtml}
              </body>
            </html>
          `)
          printWindow.document.close()
        } else {
          toast.error("El navegador bloqueó la ventana de impresión.")
        }
        onComplete()
      } else if (active && !isCancelled) {
        toast.error("No se generó ningún ticket válido.")
        onComplete()
      }
    }

    processQueue()

    return () => {
      active = false
    }
  }, [pedidos, isCancelled, total, onComplete])

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 w-72 bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-indigo-700">
          <Printer className="w-5 h-5 animate-pulse" />
          <span className="font-semibold text-sm">Imprimiendo Tickets...</span>
        </div>
        <button
          onClick={() => setIsCancelled(true)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Cancelar Impresión"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>{currentIndex} de {total} completados</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
