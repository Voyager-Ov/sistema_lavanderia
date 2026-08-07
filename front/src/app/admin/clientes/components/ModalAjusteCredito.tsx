"use client"

import React, { useState } from "react"
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription
} from "@/shared/ui/overlays/responsive-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Label } from "@/shared/ui/forms/label"
import { AjusteCreditoParams } from "@/domains/clientes/cuenta-corriente.api"
import { PlusCircle, Sparkles } from "lucide-react"

interface ModalAjusteCreditoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteNombre: string
  onConfirmar: (params: AjusteCreditoParams) => Promise<any>
  isSubmitting: boolean
}

export function ModalAjusteCredito({
  open,
  onOpenChange,
  clienteNombre,
  onConfirmar,
  isSubmitting
}: ModalAjusteCreditoProps) {
  const [monto, setMonto] = useState<string>("")
  const [motivo, setMotivo] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) return
    if (!motivo.trim()) return

    try {
      await onConfirmar({ monto: montoNum, motivo: motivo.trim() })
      setMonto("")
      setMotivo("")
      onOpenChange(false)
    } catch (err) {
      // Handled in hook
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col gap-6">
        <ResponsiveSheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <ResponsiveSheetTitle className="text-xl font-bold text-slate-900">
                Acreditar Saldo a Favor Manual
              </ResponsiveSheetTitle>
              <ResponsiveSheetDescription className="text-slate-500 text-xs">
                Cliente: <span className="font-semibold text-slate-700">{clienteNombre}</span>
              </ResponsiveSheetDescription>
            </div>
          </div>
        </ResponsiveSheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Atención:</strong> Esta acción acreditará saldo a favor directamente en la cuenta corriente del cliente. Se utilizará para compensaciones comerciales, promociones o ajustes autorizados.
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Monto a Acreditar ($) *
            </Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ej: 2500"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              className="font-mono text-base font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Motivo o Justificación del Ajuste *
            </Label>
            <Textarea
              placeholder="Ej: Compensación comercial por retraso involuntario en entrega..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              required
              className="text-sm resize-none"
            />
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !monto || parseFloat(monto) <= 0 || !motivo.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? "Acreditando..." : "Confirmar Crédito"}
            </Button>
          </div>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
