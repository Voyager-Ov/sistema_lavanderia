"use client"

import * as React from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Pedido, cambiarEstadoPedido } from "@/domains/pedidos/api"
import { toast } from "sonner"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Label } from "@/shared/ui/forms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Loader2, XCircle, User, Banknote, Package, CheckCircle2, Circle } from "lucide-react"

interface BulkCancellationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidos: Pedido[]
  onComplete: () => void
}

export function BulkCancellationWizard({ open, onOpenChange, pedidos, onComplete }: BulkCancellationWizardProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [motivo, setMotivo] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const formRef = React.useRef<HTMLDivElement>(null)

  const currentPedido = pedidos[currentIndex]

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setMotivo("")
      setDescripcion("")
    }
  }, [open, pedidos])

  if (!open || !currentPedido) return null

  const animateNext = () => {
    const card = formRef.current
    if (card) {
      // Exit left
      gsap.to(card, {
        x: -50,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(prev => prev + 1)
          setMotivo("")
          setDescripcion("")
          
          // Enter right
          gsap.fromTo(card,
            { x: 50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, ease: "power2.out", clearProps: "all" }
          )
        }
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!motivo.trim() || !descripcion.trim()) {
      toast.error("Motivo y descripción son obligatorios.")
      return
    }

    setIsSubmitting(true)
    try {
      await cambiarEstadoPedido(currentPedido.id, "CANCELADO", "Cancelado masivamente", motivo, descripcion)
      
      toast.success(`Pedido #${currentPedido.codigoSeguimiento} cancelado.`)
      
      if (currentIndex < pedidos.length - 1) {
        animateNext()
      } else {
        toast.success("Todos los pedidos seleccionados fueron cancelados con éxito.")
        onComplete()
        onOpenChange(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || `Error al cancelar el pedido #${currentPedido.codigoSeguimiento}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isSubmitting) onOpenChange(isOpen)
      }}
      title={
        <div className="flex items-center gap-2 text-2xl font-bold text-red-600">
          <XCircle className="h-6 w-6" />
          Cancelación Masiva
        </div> as any
      }
      description={`Cancelando ${currentIndex + 1} de ${pedidos.length} pedidos seleccionados.`}
    >
      <div className="flex-1 space-y-6" ref={formRef}>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Motivo de Cancelación <span className="text-red-500">*</span></Label>
            <Select value={motivo} onValueChange={setMotivo} disabled={isSubmitting}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccione un motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cliente se arrepintió">Cliente se arrepintió</SelectItem>
                <SelectItem value="Error de carga">Error de carga</SelectItem>
                <SelectItem value="Falta de stock/insumos">Falta de stock/insumos</SelectItem>
                <SelectItem value="Prendas dañadas previas">Prendas dañadas previas</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción Detallada <span className="text-red-500">*</span></Label>
            <Textarea 
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              placeholder="Por favor, explique brevemente el motivo..."
              required
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full mt-6 relative z-20 bg-white pt-2">
        <Button 
          className="w-full h-12 rounded-xl text-base font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50" 
          onClick={() => handleSubmit()}
          disabled={isSubmitting || !motivo.trim() || !descripcion.trim()}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
          {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl text-base font-bold" 
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Abortar Proceso
        </Button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">
          Resumen del Pedido
        </h3>
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10">
            {/* Client Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100/80">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-blue to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                {currentPedido.cliente?.nombre?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {currentPedido.cliente?.nombre || 'Consumidor Final'}
                </p>
                {currentPedido.cliente?.telefono && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{currentPedido.cliente.telefono}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Seguimiento</p>
                <p className="font-bold text-gray-900 text-sm">#{currentPedido.codigoSeguimiento}</p>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="space-y-2.5 pb-4 border-b border-gray-100/80">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Package className="w-3.5 h-3.5" /> Ítems del pedido
              </div>
              {currentPedido.items?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <span className="text-gray-400 font-medium">{item.cantidad}x</span>
                    <span className="text-gray-700 truncate">{item.producto?.nombre}</span>
                  </div>
                  <span className="font-medium text-gray-900 shrink-0">
                    ${Number(item.subtotal).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
              {(currentPedido.items?.length || 0) > 3 && (
                <p className="text-xs text-gray-400 italic">
                  + {(currentPedido.items?.length || 0) - 3} ítems más...
                </p>
              )}
            </div>

            {/* Total and Payment Status */}
            <div className="flex justify-between items-end pt-1">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estado de Pago</p>
                {currentPedido.cobrado ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-[11px] font-bold uppercase tracking-wider border border-green-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-md text-[11px] font-bold uppercase tracking-wider border border-orange-100">
                    <Circle className="w-3.5 h-3.5" /> Pendiente
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-xl font-black text-gray-900 tracking-tight">
                  ${Number(currentPedido.total).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormSheet>
  )
}
