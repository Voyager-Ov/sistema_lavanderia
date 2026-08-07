"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription
} from "@/shared/ui/overlays/responsive-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"
import { Switch } from "@/shared/ui/forms/switch"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { PedidoDeudaItem, CobrarDeudaParams } from "@/domains/clientes/cuenta-corriente.api"
import { MetodoPago, obtenerMetodosPago } from "@/domains/pagos/api"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Wallet, CreditCard, ArrowRight, CheckCircle, AlertCircle, Sparkles } from "lucide-react"

interface ModalCobroDeudaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteNombre: string
  pedidosDeuda: PedidoDeudaItem[]
  creditoDisponibleTotal: number
  onConfirmar: (params: CobrarDeudaParams) => Promise<any>
  isSubmitting: boolean
}

export function ModalCobroDeuda({
  open,
  onOpenChange,
  clienteNombre,
  pedidosDeuda,
  creditoDisponibleTotal,
  onConfirmar,
  isSubmitting
}: ModalCobroDeudaProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [aplicarCredito, setAplicarCredito] = useState(creditoDisponibleTotal > 0)
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [montoRecibido, setMontoRecibido] = useState<string>("")
  const [dejarVueltoAFavor, setDejarVueltoAFavor] = useState(false)

  // Cargar métodos de pago al abrir
  useEffect(() => {
    if (open) {
      // Por defecto seleccionar todos los pedidos
      setSelectedIds(pedidosDeuda.map((p) => p.id))
      setAplicarCredito(creditoDisponibleTotal > 0)
      setDejarVueltoAFavor(false)
      setMontoRecibido("")

      obtenerMetodosPago()
        .then((metodos) => {
          const activos = metodos.filter((m) => m.activo)
          setMetodosPago(activos)
          if (activos.length > 0) {
            setMetodoPagoId(activos[0].id)
          }
        })
        .catch(console.error)
    }
  }, [open, pedidosDeuda, creditoDisponibleTotal])

  // Cálculo de totales
  const totalDeudaSeleccionada = useMemo(() => {
    return pedidosDeuda
      .filter((p) => selectedIds.includes(p.id))
      .reduce((acc, p) => acc + parseFloat(p.total as any || 0), 0)
  }, [pedidosDeuda, selectedIds])

  const creditoAAplicar = useMemo(() => {
    if (!aplicarCredito) return 0
    return Math.min(creditoDisponibleTotal, totalDeudaSeleccionada)
  }, [aplicarCredito, creditoDisponibleTotal, totalDeudaSeleccionada])

  const remanenteAPagar = useMemo(() => {
    return Math.max(0, totalDeudaSeleccionada - creditoAAplicar)
  }, [totalDeudaSeleccionada, creditoAAplicar])

  const efectivoIngresado = parseFloat(montoRecibido) || 0
  const vueltoCalculado = Math.max(0, efectivoIngresado - remanenteAPagar)

  const handleTogglePedido = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === pedidosDeuda.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pedidosDeuda.map((p) => p.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.length === 0) return

    const params: CobrarDeudaParams = {
      pedidosIds: selectedIds,
      aplicarSaldoAFavor: aplicarCredito && creditoAAplicar > 0,
      metodoPagoId: remanenteAPagar > 0 ? (metodoPagoId || undefined) : undefined,
      montoRecibido: remanenteAPagar > 0 && montoRecibido ? efectivoIngresado : (remanenteAPagar > 0 ? remanenteAPagar : undefined),
      dejarVueltoAFavor: vueltoCalculado > 0 ? dejarVueltoAFavor : false
    }

    try {
      await onConfirmar(params)
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
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <ResponsiveSheetTitle className="text-xl font-bold text-slate-900">
                Cobrar Deuda de Pedidos
              </ResponsiveSheetTitle>
              <ResponsiveSheetDescription className="text-slate-500 text-xs">
                Cliente: <span className="font-semibold text-slate-700">{clienteNombre}</span>
              </ResponsiveSheetDescription>
            </div>
          </div>
        </ResponsiveSheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          {/* 1. Selección de Pedidos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Pedidos a Liquidar ({selectedIds.length} de {pedidosDeuda.length})
              </Label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {selectedIds.length === pedidosDeuda.length ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 rounded-xl border border-slate-100 p-2 bg-slate-50/50">
              {pedidosDeuda.map((pedido) => {
                const isSelected = selectedIds.includes(pedido.id)
                return (
                  <div
                    key={pedido.id}
                    onClick={() => handleTogglePedido(pedido.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-blue-200 shadow-sm"
                        : "bg-white/60 border-transparent hover:border-slate-200 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleTogglePedido(pedido.id)}
                        className="rounded"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          {pedido.codigoSeguimiento}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {format(parseISO(pedido.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ${parseFloat(pedido.total as any).toLocaleString("es-AR")}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Saldo a favor disponible */}
          {creditoDisponibleTotal > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Saldo a favor disponible: ${creditoDisponibleTotal.toLocaleString("es-AR")}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Aplicar hasta ${creditoAAplicar.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
              <Switch
                checked={aplicarCredito}
                onCheckedChange={setAplicarCredito}
              />
            </div>
          )}

          {/* 3. Desglose y Pago Remanente */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-sm">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Total Deuda Seleccionada:</span>
              <span className="font-mono font-medium">${totalDeudaSeleccionada.toLocaleString("es-AR")}</span>
            </div>

            {aplicarCredito && creditoAAplicar > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-medium">
                <span>Crédito a Favor Aplicado:</span>
                <span className="font-mono">-${creditoAAplicar.toLocaleString("es-AR")}</span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-100">Restante a Pagar:</span>
              <span className="text-xl font-extrabold text-blue-400 font-mono">
                ${remanenteAPagar.toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          {/* 4. Método de Pago y Monto Recibido si queda resto */}
          {remanenteAPagar > 0 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Método de Pago para el Restante
                </Label>
                <Select
                  value={metodoPagoId?.toString() || ""}
                  onValueChange={(v) => setMetodoPagoId(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPago.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">
                    Monto Recibido
                  </Label>
                  <Input
                    type="number"
                    min={remanenteAPagar}
                    step="0.01"
                    placeholder={`$${remanenteAPagar}`}
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">
                    Vuelto a Entregar
                  </Label>
                  <div className="h-10 px-3 flex items-center bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold font-mono text-slate-800">
                    ${vueltoCalculado.toLocaleString("es-AR")}
                  </div>
                </div>
              </div>

              {vueltoCalculado > 0 && (
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <div className="text-xs text-blue-900 font-medium">
                    Acreditar vuelto (${vueltoCalculado.toLocaleString("es-AR")}) como saldo a favor
                  </div>
                  <Switch
                    checked={dejarVueltoAFavor}
                    onCheckedChange={setDejarVueltoAFavor}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>La deuda seleccionada queda <strong>100% saldada</strong> con el saldo a favor disponible.</span>
            </div>
          )}

          {/* Botones de acción */}
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
              disabled={selectedIds.length === 0 || isSubmitting || (remanenteAPagar > 0 && !metodoPagoId)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSubmitting ? "Procesando..." : `Confirmar Cobro ($${totalDeudaSeleccionada.toLocaleString("es-AR")})`}
            </Button>
          </div>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
