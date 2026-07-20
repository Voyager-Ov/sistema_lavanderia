"use client"

import React, { useState, useEffect } from "react"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Badge } from "@/shared/ui/data-display/badge"
import { Loader2, TrendingUp, TrendingDown, DollarSign, Percent, ArrowRight } from "lucide-react"
import { apiClient } from "@/shared/lib/api-client"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"

type Mode = "percentage" | "individual"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedServices: any[]
  onSuccess: () => void
  initialMode?: Mode
}

export function ServiciosBulkPriceModal({ open, onOpenChange, selectedServices, onSuccess, initialMode = "percentage" }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [percentage, setPercentage] = useState("")
  const [individualPrices, setIndividualPrices] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      const prices: Record<number, string> = {}
      selectedServices.forEach(s => { prices[s.id] = String(s.precioActual) })
      setIndividualPrices(prices)
      setPercentage("")
    }
  }, [open, selectedServices, initialMode])

  const pctValue = parseFloat(percentage)
  const isValidPct = !isNaN(pctValue) && pctValue !== 0

  const getPreviewPrice = (current: number) => {
    if (!isValidPct) return current
    return Math.round(current * (1 + pctValue / 100))
  }

  const handleApply = async () => {
    setIsLoading(true)
    try {
      if (mode === "percentage") {
        if (!isValidPct) { toast.error("Ingresá un porcentaje válido"); setIsLoading(false); return }
        const updates = selectedServices.map(s => ({
          id: s.id,
          precioActual: getPreviewPrice(parseFloat(s.precioActual))
        }));
        await apiClient.put("/productos/bulk/precios", { updates })
        toast.success(`Precios actualizados con ${pctValue > 0 ? "+" : ""}${pctValue}% para ${selectedServices.length} servicio(s)`)
      } else {
        const updates = selectedServices.map(s => ({
          id: s.id,
          precioActual: parseFloat(individualPrices[s.id] || s.precioActual)
        })).filter(u => !isNaN(u.precioActual) && u.precioActual > 0)
        await apiClient.put("/productos/bulk/precios", { updates })
        toast.success(`Precios actualizados para ${updates.length} servicio(s)`)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(`Error al actualizar precios: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const title = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
        <DollarSign className="h-4 w-4 text-white" />
      </div>
      Ajuste Masivo de Precios
    </div>
  )

  return (
    <FormSheet 
      open={open} 
      onOpenChange={onOpenChange}
      title={title as any}
      description={`${selectedServices.length} servicio(s) seleccionado(s)`}
    >
      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("percentage")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200",
            mode === "percentage"
              ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/25"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Percent className="h-4 w-4" />
          Por Porcentaje
        </button>
        <button
          onClick={() => setMode("individual")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200",
            mode === "individual"
              ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/25"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <DollarSign className="h-4 w-4" />
          Individual
        </button>
      </div>

      <div className="space-y-5 my-2">
        {mode === "percentage" ? (
          <>
            {/* Quick picks */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accesos rápidos</label>
              <div className="grid grid-cols-6 gap-1.5">
                {[-20, -10, -5, 5, 10, 20].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setPercentage(String(pct))}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                      String(pct) === percentage
                        ? pct > 0
                          ? "bg-green-500 text-white border-green-500 shadow-md"
                          : "bg-red-500 text-white border-red-500 shadow-md"
                        : pct > 0
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    )}
                  >
                    {pct > 0 ? "+" : ""}{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Custom % */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Porcentaje personalizado</label>
              <div className="relative">
                <Input
                  type="number"
                  value={percentage}
                  onChange={e => setPercentage(e.target.value)}
                  placeholder="Ej: 15 para +15%, -8 para -8%"
                  className="pr-10 h-12 rounded-2xl border-gray-200 text-base font-bold focus:border-blue-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
              </div>
            </div>

            {/* Preview */}
            {isValidPct && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vista previa</label>
                <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {selectedServices.map((s) => {
                    const prev = parseFloat(s.precioActual)
                    const next = getPreviewPrice(prev)
                    const diff = next - prev
                    return (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="font-semibold text-gray-800 truncate max-w-[140px]">{s.nombre}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-gray-400 font-mono text-xs">${prev.toLocaleString("es-AR")}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="font-black text-gray-900 font-mono text-xs">${next.toLocaleString("es-AR")}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold border px-1.5 py-0.5 flex items-center gap-0.5",
                              diff > 0 ? "border-green-400 text-green-600 bg-green-50" : "border-red-400 text-red-600 bg-red-50"
                            )}
                          >
                            {diff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {diff > 0 ? "+" : ""}${diff.toLocaleString("es-AR")}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Precio por servicio</label>
            {selectedServices.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{s.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Actual: ${parseFloat(s.precioActual).toLocaleString("es-AR")}</p>
                </div>
                <div className="relative shrink-0 w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                  <Input
                    type="number"
                    value={individualPrices[s.id] || ""}
                    onChange={e => setIndividualPrices(prev => ({ ...prev, [s.id]: e.target.value }))}
                    className="pl-7 h-10 rounded-xl border-gray-200 text-sm font-bold"
                    min={0}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          className="w-full rounded-xl h-12 font-bold order-2 sm:order-1"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          className="w-full rounded-xl h-12 font-bold order-1 sm:order-2 bg-brand-blue hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/25 text-white"
          onClick={handleApply}
          disabled={isLoading || (mode === "percentage" && !isValidPct)}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</>
          ) : (
            <>Aplicar a {selectedServices.length} servicio(s)</>
          )}
        </Button>
      </div>
    </FormSheet>
  )
}
