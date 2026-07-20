"use client"

import { useState } from "react"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { toast } from "sonner"
import { cerrarCaja, CajaActual } from "@/domains/caja/caja.api"
import { DollarSign, AlertCircle } from "lucide-react"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"
import { Button } from "@/shared/ui/forms/button"
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/feedback/alert"

interface CerrarCajaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caja: CajaActual
  onSuccess: () => void
}

export function CerrarCajaModal({ open, onOpenChange, caja, onSuccess }: CerrarCajaModalProps) {
  const [efectivoReal, setEfectivoReal] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!efectivoReal || isNaN(Number(efectivoReal))) {
      toast.error("Ingrese un monto válido")
      return
    }

    try {
      setIsLoading(true)
      await cerrarCaja(caja.id, Number(efectivoReal))
      toast.success("Caja cerrada exitosamente")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar la caja")
    } finally {
      setIsLoading(false)
    }
  }

  const esperado = Number(caja.efectivoEsperadoEnVivo)
  const real = Number(efectivoReal || 0)
  const diferencia = real - esperado
  const hasDiferencia = Boolean(efectivoReal) && diferencia !== 0

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Cierre de Caja</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            Por favor, cuenta el dinero físico en la caja e ingrésalo a continuación para realizar el arqueo.
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-2 mt-6 flex justify-between items-center">
          <span className="text-sm text-slate-600 font-medium">Efectivo Esperado (Sistema):</span>
          <span className="text-xl font-bold text-slate-900">${esperado.toLocaleString('es-AR')}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Efectivo Real (Contado)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="number"
                value={efectivoReal}
                onChange={(e) => setEfectivoReal(e.target.value)}
                className="pl-10 text-lg font-medium"
                placeholder="0.00"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {hasDiferencia && (
            <Alert variant={diferencia < 0 ? 'destructive' : 'warning'}>
              <AlertCircle className="w-5 h-5" />
              <AlertTitle>
                Diferencia detectada: {diferencia < 0 ? 'Faltan' : 'Sobran'} ${Math.abs(diferencia).toLocaleString('es-AR')}
              </AlertTitle>
              <AlertDescription>
                Se registrará esta diferencia en el reporte de cierre.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-6 border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !efectivoReal}
            >
              {isLoading ? "Cerrando..." : "Confirmar Cierre"}
            </Button>
          </div>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
