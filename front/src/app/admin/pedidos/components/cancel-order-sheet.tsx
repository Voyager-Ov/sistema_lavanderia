"use client"

import * as React from "react"
import { Button } from "@/shared/ui/forms/button"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Label } from "@/shared/ui/forms/label"
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription
} from "@/shared/ui/overlays/responsive-sheet"
import { Pedido } from "@/domains/pedidos/api"
import { AlertCircle, XCircle } from "lucide-react"

interface CancelOrderSheetProps {
  pedido: Pedido | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (pedidoId: number, motivo: string, descripcion: string, accionDinero: "SALDO_A_FAVOR" | "DEVOLVER") => Promise<void>
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
  const [accionDinero, setAccionDinero] = React.useState<"SALDO_A_FAVOR" | "DEVOLVER">("SALDO_A_FAVOR")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setMotivo("")
      setDescripcion("")
      setAccionDinero("SALDO_A_FAVOR")
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
      await onConfirm(pedido.id, motivo, descripcion, accionDinero)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error al cancelar el pedido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col gap-6">
        <ResponsiveSheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl dark:bg-red-950/40 dark:text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <ResponsiveSheetTitle className="text-xl font-bold text-slate-900 dark:text-neutral-100">
                Cancelar Pedido #{pedido.codigoSeguimiento || (pedido as any).numeroPedido || pedido.id}
              </ResponsiveSheetTitle>
              <ResponsiveSheetDescription className="text-slate-500 dark:text-neutral-400 text-xs">
                Indica el motivo por el cual se anula este pedido
              </ResponsiveSheetDescription>
            </div>
          </div>
        </ResponsiveSheetHeader>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Motivo de Cancelación
            </Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger className="w-full h-11 bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-brand-blue rounded-xl text-sm">
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
            <Label htmlFor="descripcion" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Descripción / Notas Adicionales (Opcional)
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Agrega más detalles sobre la cancelación..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-[100px] bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 focus-visible:ring-0 focus-visible:border-brand-blue rounded-xl resize-none text-sm"
            />
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-bold mb-1 flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Atención Operativa
            </p>
            <p>Esta acción cancelará el pedido y quedará auditada bajo tu usuario de sesión.</p>
          </div>

          {pedido.cobrado && (
            <div className="space-y-3 p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl">
              <Label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                Destino del Dinero Cobrado (${parseFloat(pedido.total as any || 0).toLocaleString("es-AR")})
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setAccionDinero("SALDO_A_FAVOR")}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    accionDinero === "SALDO_A_FAVOR"
                      ? "bg-white dark:bg-neutral-800 border-brand-blue shadow-sm"
                      : "bg-white/50 dark:bg-neutral-800/40 border-transparent hover:border-slate-200 dark:hover:border-neutral-700 opacity-70"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-neutral-100">Saldo a Favor</p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Se acredita a la cuenta corriente del cliente.
                  </p>
                </div>

                <div
                  onClick={() => setAccionDinero("DEVOLVER")}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    accionDinero === "DEVOLVER"
                      ? "bg-white dark:bg-neutral-800 border-brand-blue shadow-sm"
                      : "bg-white/50 dark:bg-neutral-800/40 border-transparent hover:border-slate-200 dark:hover:border-neutral-700 opacity-70"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-neutral-100">Devolución en Caja</p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Registra egreso físico de efectivo en caja.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
          <Button
            variant="outline"
            className="w-full rounded-full h-11 font-bold order-2 sm:order-1 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Volver
          </Button>
          <Button 
            className="w-full rounded-full h-11 font-bold order-1 sm:order-2 text-xs bg-red-600 hover:bg-red-700 text-white shadow-md" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Cancelando..." : "Confirmar Cancelación"}
          </Button>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
