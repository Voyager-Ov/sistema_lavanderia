import React, { useState } from "react"
import { 
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription
} from "@/shared/ui/overlays/responsive-sheet"
import { Pedido, cambiarEstadoPedido } from "@/domains/pedidos/api"
import { Button } from "@/shared/ui/forms/button"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Label } from "@/shared/ui/forms/label"
import { toast } from "sonner"
import { XCircle, Loader2 } from "lucide-react"

import { apiClient } from "@/shared/lib/api-client"

interface CancelPedidoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido | null
  onSuccess: () => void
  onDismiss: () => void
}

export function CancelPedidoSheet({ open, onOpenChange, pedido, onSuccess, onDismiss }: CancelPedidoSheetProps) {
  const [motivos, setMotivos] = useState<{ id?: number, motivo: string }[]>([])
  const [selectedMotivo, setSelectedMotivo] = useState<string>("")
  const [descripcion, setDescripcion] = useState("")
  const [accionDinero, setAccionDinero] = useState<"SALDO_A_FAVOR" | "DEVOLVER">("SALDO_A_FAVOR")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch motivos when component mounts
  React.useEffect(() => {
    apiClient.get<any[]>("/pedidos/motivos-cancelacion")
      .then(res => setMotivos(res))
      .catch(err => console.error("Error cargando motivos", err))
  }, [])

  // Reset when open changes
  React.useEffect(() => {
    if (open) {
      setSelectedMotivo("")
      setDescripcion("")
      setAccionDinero("SALDO_A_FAVOR")
    }
  }, [open])

  if (!pedido) return null

  const handleCancel = async () => {
    if (!selectedMotivo) {
      toast.error("Seleccione un motivo de cancelación")
      return
    }

    setIsSubmitting(true)
    try {
      await cambiarEstadoPedido(pedido.id, "CANCELADO", undefined, selectedMotivo, descripcion, accionDinero)
      toast.success("Pedido cancelado correctamente")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Error al cancelar el pedido"
      toast.error(errorMessage)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      onDismiss()
      onOpenChange(false)
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={handleClose}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Cancelar Pedido</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>¿Por qué se cancela el pedido #{pedido.id}?</ResponsiveSheetDescription>
        </ResponsiveSheetHeader>
        <div className="flex flex-col gap-6 p-4">
        {/* Warning Banner */}
        <div className="flex gap-3 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
          <XCircle className="w-6 h-6 flex-shrink-0 text-red-600 dark:text-red-500" />
          <div className="text-sm">
            <p className="font-bold mb-1">Esta acción no se puede deshacer.</p>
            <p className="text-red-700 dark:text-red-300">El pedido pasará a estado Cancelado y no se podrá recuperar ni cobrar.</p>
          </div>
        </div>

        {/* Motivos Options */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-semibold">Motivo principal</Label>
          <div className="grid grid-cols-2 gap-2">
            {motivos.map(m => (
              <Button
                key={m.motivo}
                variant={selectedMotivo === m.motivo ? "destructive" : "outline"}
                className="justify-start h-auto py-2.5 px-3 whitespace-normal text-left"
                onClick={() => setSelectedMotivo(m.motivo)}
              >
                {m.motivo}
              </Button>
            ))}
          </div>
        </div>

        {/* Descripción Adicional */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Descripción (opcional)</Label>
          <Textarea 
            placeholder="Añade detalles si es necesario..."
            className="resize-none h-24 bg-gray-50/50 dark:bg-neutral-900/50"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {pedido.cobrado && (
          <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/30">
            <Label className="text-sm font-bold text-blue-900 dark:text-blue-300">
              Devolución de Dinero
            </Label>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Como el pedido ya fue cobrado, se registrará una devolución/reembolso en caja por el total del pedido.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Atrás
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1 font-bold"
            onClick={handleCancel}
            disabled={isSubmitting || !selectedMotivo}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Cancelación"}
          </Button>
        </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
