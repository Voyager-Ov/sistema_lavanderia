"use client"

import { useState, useEffect, useMemo } from "react"
import { Pedido } from "@/domains/pedidos/api"
import { MetodoPago, obtenerMetodosPago, registrarPago, obtenerSaldosAFavorCliente } from "@/domains/pagos/api"
import { generarTicketsAPI } from "@/domains/pedidos/api"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
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
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Cobrar Pedido"
      description={`Registra el pago para el pedido #${pedido?.codigoSeguimiento}.`}
      trigger={<span style={{ display: "none" }} />}
    >
      {pedido && (
        <div className="flex-1 space-y-5">
          {/* Resumen de Pedido */}
          <div className="bg-muted rounded-2xl p-4 border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-semibold text-foreground">{pedido.cliente?.nombre || "Consumidor Final"}</span>
            </div>
            <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium">Total Pedido</span>
              <span className="font-bold text-foreground">${totalPedido.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Saldo a Favor disponible */}
          {saldoAFavorTotal > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    Saldo a favor disponible: ${saldoAFavorTotal.toLocaleString("es-AR")}
                  </p>
                  <p className="text-[11px] text-emerald-700">
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
                <Label className="text-xs font-bold uppercase text-muted-foreground">
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
                              ? "border-blue-600 bg-blue-50/50 shadow-sm scale-[1.02]"
                              : "border-border bg-card hover:border-border/80 hover:bg-muted/50"
                          }
                        `}
                      >
                        <Icon
                          className={`w-6 h-6 mb-1.5 ${
                            isSelected ? "text-blue-600" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-xs font-bold text-center ${
                            isSelected ? "text-blue-600" : "text-foreground"
                          }`}
                        >
                          {metodo.nombre}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Monto Entregado (Con cuánto paga)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    El monto debe ser exacto para este método de pago.
                  </p>
                )}
              </div>

              {vuelto > 0 && esEfectivo && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center text-emerald-900">
                    <span className="text-xs font-semibold">Vuelto calculado:</span>
                    <span className="text-lg font-black font-mono">
                      ${vuelto.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                    <span className="text-xs text-emerald-800 font-medium">
                      Acreditar vuelto como saldo a favor
                    </span>
                    <Switch
                      checked={dejarVueltoAFavor}
                      onCheckedChange={setDejarVueltoAFavor}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                El pedido quedará <strong>100% saldado</strong> utilizando el saldo a favor disponible.
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5 w-full mt-6 pt-4 border-t border-border">
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
    </FormSheet>
  )
}
