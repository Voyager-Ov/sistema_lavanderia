import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { registrarPagoCuentaCorriente, Cliente } from "@/domains/clientes/api"
import { Banknote } from "lucide-react"

interface CobrarDeudaSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onSuccess: () => void
}

export function CobrarDeudaSheet({ isOpen, onOpenChange, cliente, onSuccess }: CobrarDeudaSheetProps) {
  const [monto, setMonto] = useState("")
  const [metodoPago, setMetodoPago] = useState("Efectivo") // Should fetch from API ideally, hardcoded for now
  const [comentario, setComentario] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const saldo = cliente ? parseFloat(cliente.saldoCuentaCorriente?.toString() || "0") : 0

  useEffect(() => {
    if (isOpen && saldo > 0) {
      setMonto(saldo.toString())
    }
  }, [isOpen, saldo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente) return
    
    const parsedMonto = parseFloat(monto)
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      toast.error("Ingrese un monto válido mayor a 0")
      return
    }

    setIsSubmitting(true)
    try {
      await registrarPagoCuentaCorriente(cliente.id, {
        monto: parsedMonto,
        metodoPago,
        comentario
      })
      toast.success("Pago registrado con éxito")
      onSuccess()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error al registrar el pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveSheet open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col bg-gray-50/50">
        <ResponsiveSheetHeader className="mb-6 text-left">
          <ResponsiveSheetTitle className="text-2xl font-black text-gray-900">Cobrar Deuda</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>Registra un pago para {cliente?.nombre}.</ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
            <span className="font-bold text-red-800">Deuda Actual:</span>
            <span className="text-2xl font-black text-red-600">${saldo.toLocaleString("es-AR")}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              Monto a Pagar *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <Input 
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="h-12 rounded-xl bg-white border-gray-200 pl-8 font-bold text-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Comentario (Opcional)</label>
            <Input 
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="h-12 rounded-xl bg-white border-gray-200"
              placeholder="Ej: Pago parcial efectivo"
            />
          </div>

          <div className="mt-auto pt-6 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full px-6 h-12 bg-white"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="rounded-full px-8 h-12 font-bold shadow-sm bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
