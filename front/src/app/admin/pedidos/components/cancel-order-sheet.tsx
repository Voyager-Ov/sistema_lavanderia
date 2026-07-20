"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/shared/ui/forms/button"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Label } from "@/shared/ui/forms/label"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { Pedido } from "@/domains/pedidos/api"
import { AlertCircle } from "lucide-react"

interface CancelOrderSheetProps {
  pedido: Pedido | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (pedidoId: number, motivo: string, descripcion: string) => Promise<void>
}

const MOTIVOS = [
  "El cliente se arrepintió",
  "Error en el ingreso del pedido",
  "Prendas dañadas previas al lavado",
  "No se puede cumplir con el tiempo",
  "Otro motivo"
]

export function CancelOrderSheet({ pedido, open, onOpenChange, onConfirm }: CancelOrderSheetProps) {
  const [motivo, setMotivo] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  // Reset form when opened
  React.useEffect(() => {
    if (open) {
      setMotivo("")
      setDescripcion("")
      setError("")
    }
  }, [open])

  if (!pedido) return null

  const handleConfirm = async () => {
    if (!motivo) {
      setError("Debes seleccionar un motivo")
      return
    }
    
    setIsLoading(true)
    setError("")
    try {
      await onConfirm(pedido.id, motivo, descripcion)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error al cancelar el pedido")
    } finally {
      setIsLoading(false)
    }
  }

  const FormContent = () => (
    <div className="space-y-6 py-4 px-4 md:px-0">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-brand-red text-sm font-medium">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo de Cancelación</Label>
        <Select value={motivo} onValueChange={setMotivo}>
          <SelectTrigger className="w-full h-11 bg-white border-2 border-gray-100 focus:ring-0 focus:border-brand-blue rounded-xl">
            <SelectValue placeholder="Selecciona un motivo" />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (Opcional)</Label>
        <Textarea
          id="descripcion"
          placeholder="Agrega más detalles sobre la cancelación..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="min-h-[120px] bg-white border-2 border-gray-100 focus-visible:ring-0 focus-visible:border-brand-blue rounded-xl resize-none"
        />
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
        <p className="font-semibold mb-1 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Atención
        </p>
        <p>Esta acción es irreversible y quedará registrada en el historial del pedido bajo tu usuario.</p>
      </div>
    </div>
  )

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancelar Pedido #${pedido.id}`}
      description={`Por favor indica el motivo por el cual se cancela el ticket ${pedido.codigoSeguimiento}.`}
    >
      <FormContent />
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button variant="outline" className="w-full rounded-xl h-12 font-bold order-2 sm:order-1" onClick={() => onOpenChange(false)}>
          Volver
        </Button>
        <Button 
          variant="destructive" 
          className="w-full rounded-xl h-12 font-bold order-1 sm:order-2" 
          onClick={handleConfirm}
          disabled={isLoading}
        >
          Confirmar Cancelación
        </Button>
      </div>
    </FormSheet>
  )
}
