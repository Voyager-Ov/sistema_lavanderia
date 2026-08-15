"use client"

import { useState, useEffect, useMemo } from "react"
import { Pedido } from "@/domains/pedidos/api"
import { MetodoPago, obtenerMetodosPago, registrarPago, obtenerSaldosAFavorCliente } from "@/domains/pagos/api"
import { generarTicketsAPI } from "@/domains/pedidos/api"
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
import { toast } from "sonner"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import {
  Banknote,
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  QrCode,
  Building,
  Gem,
  DollarSign,
  Sparkles,
  CheckCircle2
} from "lucide-react"

const ICON_MAP: Record<string, any> = {
  Banknote,
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  QrCode,
  Building,
  Gem,
  DollarSign
}

interface CobrarPedidoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido | null
  onSuccess: () => void
}

export function CobrarPedidoSheet({ open, onOpenChange, pedido, onSuccess }: CobrarPedidoSheetProps) {
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [selectedMetodo, setSelectedMetodo] = useState<string>("")
  const [monto, setMonto] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saldoAFavorTotal, setSaldoAFavorTotal] = useState(0)
  const [aplicarCredito, setAplicarCredito] = useState(false)
  const [dejarVueltoAFavor, setDejarVueltoAFavor] = useState(false)

  const { hardwareConfig } = useConfigStore()

  // Cargar métodos de pago y saldo a favor del cliente
  useEffect(() => {
    if (open && pedido) {
      setAplicarCredito(false)
      setDejarVueltoAFavor(false)

      obtenerMetodosPago()
        .then((data) => {
          const activos = data.filter((m) => m.activo)
          setMetodos(activos)
          if (activos.length > 0) {
            const efectivo = activos.find((m) => m.nombre.toLowerCase().includes("efectivo"))
            setSelectedMetodo(efectivo ? efectivo.id.toString() : activos[0].id.toString())
          }
        })
        .catch(() => toast.error("Error al cargar los métodos de pago"))

      if (pedido.clienteId) {
        obtenerSaldosAFavorCliente(pedido.clienteId)
          .then((creditos) => {
            const total = creditos.reduce((acc, c) => acc + parseFloat(c.montoDisponible || 0), 0)
            setSaldoAFavorTotal(total)
            if (total > 0) {
              setAplicarCredito(true)
            }
          })
          .catch(() => setSaldoAFavorTotal(0))
      }
    } else {
      setMonto("")
      setSelectedMetodo("")
      setSaldoAFavorTotal(0)
      setDejarVueltoAFavor(false)
    }
  }, [open, pedido])

  const totalPedido = pedido ? parseFloat(pedido.total.toString()) : 0

  const creditoAAplicar = useMemo(() => {
    if (!aplicarCredito) return 0
    return Math.min(saldoAFavorTotal, totalPedido)
  }, [aplicarCredito, saldoAFavorTotal, totalPedido])

  const remanenteAPagar = useMemo(() => {
    return Math.max(0, totalPedido - creditoAAplicar)
  }, [totalPedido, creditoAAplicar])

  useEffect(() => {
    if (pedido) {
      setMonto(remanenteAPagar.toString())
    }
  }, [selectedMetodo, remanenteAPagar, pedido])

  const montoNum = parseFloat(monto) || 0
  const vuelto = montoNum > remanenteAPagar ? montoNum - remanenteAPagar : 0

  const metodoObj = metodos.find((m) => m.id.toString() === selectedMetodo)
  const esEfectivo = metodoObj?.nombre.toLowerCase().includes("efectivo")

  const handleCobrar = async () => {
    if (!pedido) return

    const estUpper = (pedido.estado || "").toString().toUpperCase()
    if (estUpper.includes("CANCELAD")) {
      toast.error("No se puede cobrar un pedido que se encuentra cancelado.")
      return
    }

    if (remanenteAPagar > 0 && !selectedMetodo) {
      toast.error("Seleccione un método de pago para el saldo restante.")
      return
    }

    if (remanenteAPagar > 0 && (!monto || montoNum < remanenteAPagar)) {
      toast.error("El monto ingresado no cubre el restante del pedido.")
      return
    }

    if (remanenteAPagar > 0 && !esEfectivo && montoNum !== remanenteAPagar) {
      toast.error("Para métodos que no son efectivo, el monto ingresado debe ser exacto.")
      return
    }

    setLoading(true)
    try {
      await registrarPago({
        pedidoId: pedido.id,
        metodoPagoId: remanenteAPagar > 0 ? parseInt(selectedMetodo) : undefined,
        monto: remanenteAPagar > 0 ? remanenteAPagar : undefined,
        montoRecibido: remanenteAPagar > 0 && monto ? montoNum : undefined,
        aplicarSaldoAFavor: aplicarCredito && creditoAAplicar > 0,
        montoSaldoAFavor: creditoAAplicar,
        dejarVueltoAFavor: vuelto > 0 ? dejarVueltoAFavor : false
      })
      toast.success("Pago registrado exitosamente.")
      onSuccess()
      onOpenChange(false)

      if (hardwareConfig.imprimirTicketAutomatico) {
        try {
          await generarTicketsAPI(pedido.id, 1)
          setTimeout(() => window.print(), 300)
        } catch {
          // Ignore ticket errors
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || error.message || "Hubo un error al registrar el pago.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader className="mb-6 text-left">
          <ResponsiveSheetTitle className="text-xl font-black text-gray-900 dark:text-neutral-100">
            Cobrar Pedido
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription className="text-xs text-gray-500 dark:text-neutral-400">
            Registra el pago para el pedido #{pedido?.codigoSeguimiento || pedido?.id}.
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        {pedido && (
          <div className="flex-1 space-y-5">
            {/* Resumen de Pedido */}
            <div className="bg-slate-50 dark:bg-neutral-800/60 rounded-2xl p-4 border border-gray-100 dark:border-neutral-700/60 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-neutral-400">Cliente</span>
                <span className="font-bold text-gray-900 dark:text-neutral-100">{pedido.cliente?.nombre || "Consumidor Final"}</span>
              </div>
              <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-gray-200 dark:border-neutral-700">
                <span className="text-gray-600 dark:text-neutral-300 font-medium">Total Pedido</span>
                <span className="font-black text-gray-900 dark:text-neutral-100 font-mono">${totalPedido.toLocaleString("es-AR")}</span>
              </div>
            </div>

            {/* Saldo a Favor disponible */}
            {saldoAFavorTotal > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Saldo a favor disponible: ${saldoAFavorTotal.toLocaleString("es-AR")}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Aplicar ${creditoAAplicar.toLocaleString("es-AR")} a este pedido
                    </p>
                  </div>
                </div>
                <Switch checked={aplicarCredito} onCheckedChange={setAplicarCredito} />
              </div>
            )}

            {/* Desglose Remanente */}
            {aplicarCredito && creditoAAplicar > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Pedido:</span>
                  <span className="font-mono">${totalPedido.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                  <span>Crédito a Favor Aplicado:</span>
                  <span className="font-mono">-${creditoAAplicar.toLocaleString("es-AR")}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold">Restante a Abonar:</span>
                  <span className="text-xl font-extrabold text-blue-400 font-mono">
                    ${remanenteAPagar.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )}

            {/* Formulario de Pago Restante */}
            {remanenteAPagar > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500 dark:text-neutral-400">
                    Método de Pago
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {metodos.map((metodo) => {
                      const isSelected = selectedMetodo === metodo.id.toString()
                      const Icon = metodo.icono ? ICON_MAP[metodo.icono] || Banknote : Banknote

                      return (
                        <div
                          key={metodo.id}
                          onClick={() => setSelectedMetodo(metodo.id.toString())}
                          className={`
                            cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                            ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm scale-[1.02]"
                                : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 text-gray-800 dark:text-neutral-200"
                            }
                          `}
                        >
                          <Icon
                            className={`w-6 h-6 mb-1.5 ${
                              isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-neutral-500"
                            }`}
                          />
                          <span className="text-xs font-bold text-center">
                            {metodo.nombre}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                    Monto Entregado (Con cuánto paga)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 font-medium">
                      $
                    </span>
                    <Input
                      type="number"
                      min={remanenteAPagar}
                      step="0.01"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      disabled={!esEfectivo}
                      className="pl-7 h-11 text-base font-bold font-mono"
                    />
                  </div>
                  {!esEfectivo && (
                    <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                      El monto debe ser exacto para este método de pago.
                    </p>
                  )}
                </div>

                {vuelto > 0 && esEfectivo && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-xs font-bold uppercase text-gray-500 dark:text-neutral-400">
                        Vuelto Calculado: <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black">${vuelto.toLocaleString("es-AR")}</span>
                      </Label>
                      <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-medium">¿Qué hacer con el vuelto?</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Card 1: Entregar Vuelto en Efectivo */}
                      <div
                        onClick={() => setDejarVueltoAFavor(false)}
                        className={`
                          cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 text-center
                          ${
                            !dejarVueltoAFavor
                              ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-sm scale-[1.02]"
                              : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 text-gray-600 dark:text-neutral-400"
                          }
                        `}
                      >
                        <Banknote className={`w-5 h-5 mb-1 ${!dejarVueltoAFavor ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`} />
                        <span className="text-xs font-black block">Entregar Vuelto</span>
                        <span className="text-[10px] opacity-80 font-medium block mt-0.5 font-mono">
                          ${vuelto.toLocaleString("es-AR")} en efectivo
                        </span>
                      </div>

                      {/* Card 2: Dejar como Saldo a Favor */}
                      <div
                        onClick={() => setDejarVueltoAFavor(true)}
                        className={`
                          cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 text-center
                          ${
                            dejarVueltoAFavor
                              ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 shadow-sm scale-[1.02]"
                              : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 text-gray-600 dark:text-neutral-400"
                          }
                        `}
                      >
                        <Sparkles className={`w-5 h-5 mb-1 ${dejarVueltoAFavor ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                        <span className="text-xs font-black block">Saldo a Favor</span>
                        <span className="text-[10px] opacity-80 font-medium block mt-0.5">
                          Acreditar a cuenta
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  El pedido quedará <strong>100% saldado</strong> utilizando el saldo a favor disponible.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5 w-full mt-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <Button
            className="w-full h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCobrar}
            disabled={loading || (remanenteAPagar > 0 && (!selectedMetodo || !monto))}
          >
            {loading ? "Registrando..." : `Registrar Cobro ($${totalPedido.toLocaleString("es-AR")})`}
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-sm font-semibold"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
