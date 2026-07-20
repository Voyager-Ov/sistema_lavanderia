import React, { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/overlays/dialog"
import { desactivarCliente, Cliente } from "@/domains/clientes/api"
import { PowerOff } from "lucide-react"

interface DesactivarClienteModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onSuccess: () => void
}

export function DesactivarClienteModal({ isOpen, onOpenChange, cliente, onSuccess }: DesactivarClienteModalProps) {
  const [motivo, setMotivo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente) return
    
    if (!motivo.trim()) {
      toast.error("El motivo es obligatorio")
      return
    }

    setIsSubmitting(true)
    try {
      await desactivarCliente(cliente.id, motivo)
      toast.success("Cliente desactivado con éxito")
      onSuccess()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error al desactivar el cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-3xl">
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <PowerOff className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-black text-red-900">Desactivar Cliente</DialogTitle>
          <DialogDescription className="text-red-700 font-medium text-center mt-2">
            ¿Estás seguro que deseas desactivar a {cliente?.nombre}?
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-2 mb-6">
            <label className="text-sm font-bold text-gray-700">
              Motivo de la baja *
            </label>
            <Input 
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-12 rounded-xl border-gray-200"
              placeholder="Ej: Cliente solicitó baja, inactividad, etc."
              required
            />
          </div>

          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full px-6 h-12 flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              className="rounded-full px-6 h-12 font-bold shadow-sm flex-1 bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
