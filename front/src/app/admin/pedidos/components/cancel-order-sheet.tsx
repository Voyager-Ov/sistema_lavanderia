"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/shared/ui/forms/button"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Label } from "@/shared/ui/forms/label"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/shared/ui/overlays/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/shared/ui/overlays/drawer"
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
  const isMobile = useIsMobile()
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

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-white">
          <DrawerHeader className="text-left">
            <DrawerTitle>Cancelar Pedido #{pedido.id}</DrawerTitle>
            <DrawerDescription>
              Por favor indica el motivo por el cual se cancela el ticket <strong>{pedido.codigoSeguimiento}</strong>.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <FormContent />
          </div>
          <DrawerFooter className="pt-2 pb-6">
            <Button 
              variant="destructive" 
              className="w-full rounded-xl h-12 text-base font-bold" 
              onClick={handleConfirm}
              disabled={isLoading}
            >
              Confirmar Cancelación
            </Button>
            <Button variant="outline" className="w-full rounded-xl h-12 text-base font-bold" onClick={() => onOpenChange(false)}>
              Volver
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cancelar Pedido #{pedido.id}</SheetTitle>
          <SheetDescription>
            Por favor indica el motivo por el cual se cancela el ticket <strong>{pedido.codigoSeguimiento}</strong>.
          </SheetDescription>
        </SheetHeader>
        <FormContent />
        <SheetFooter className="mt-6 flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" className="w-full sm:w-auto rounded-xl h-11 font-bold" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto rounded-xl h-11 font-bold" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            Confirmar Cancelación
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
