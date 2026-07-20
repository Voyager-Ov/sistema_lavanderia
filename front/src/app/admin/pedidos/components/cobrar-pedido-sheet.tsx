"use client"

import { useState, useEffect } from "react"
import { Pedido } from "@/domains/pedidos/api"
import { MetodoPago, obtenerMetodosPago, registrarPago, obtenerSaldosAFavorCliente, SaldoAFavor } from "@/domains/pagos/api"
import { generarTicketsAPI } from "@/domains/pedidos/api"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"
import { Switch } from "@/shared/ui/forms/switch"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { toast } from "sonner"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import { Banknote, CreditCard, Wallet, Smartphone, Landmark, QrCode, Building, Gem, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  const { hardwareConfig } = useConfigStore()

  // Saldos a Favor
  const [saldosDisponibles, setSaldosDisponibles] = useState<SaldoAFavor[]>([])
  const [saldosSeleccionados, setSaldosSeleccionados] = useState<number[]>([]) // array of pagoId
  const [dejarVueltoAFavor, setDejarVueltoAFavor] = useState(false)

  // Cargar métodos de pago y saldos a favor
  useEffect(() => {
    if (open) {
      obtenerMetodosPago()
        .then((data) => {
          const activos = data.filter(m => m.activo)
          setMetodos(activos)
          if (activos.length > 0) {
            const efectivo = activos.find(m => m.nombre.toLowerCase().includes('efectivo'));
            setSelectedMetodo(efectivo ? efectivo.id.toString() : activos[0].id.toString())
          }
        })
        .catch(() => toast.error("Error al cargar los métodos de pago"))
        
      if (pedido && pedido.clienteId) {
        obtenerSaldosAFavorCliente(pedido.clienteId)
          .then(data => setSaldosDisponibles(data))
          .catch(() => toast.error("No se pudieron cargar los saldos a favor"))
      }
    } else {
      // Reset on close
      setMonto("")
      setSelectedMetodo("")
      setSaldosDisponibles([])
      setSaldosSeleccionados([])
      setDejarVueltoAFavor(false)
    }
  }, [open, pedido])

  // Calcular montos aplicados
  const totalPedido = pedido ? parseFloat(pedido.total.toString()) : 0

  let totalSaldosAplicados = 0
  const saldosCalculados = saldosSeleccionados.map(pagoId => {
    const saldo = saldosDisponibles.find(s => s.pagoId === pagoId)
    if (!saldo) return null
    // We only take what we need to pay the remaining order total
    const faltaPagar = totalPedido - totalSaldosAplicados
    if (faltaPagar <= 0) return null

    const montoAUso = Math.min(saldo.montoDisponible, faltaPagar)
    totalSaldosAplicados += montoAUso
    return { pagoId, monto: montoAUso }
  }).filter(Boolean) as { pagoId: number, monto: number }[]

  const totalRestante = Math.max(0, totalPedido - totalSaldosAplicados)
  const montoNum = parseFloat(monto) || 0
  const vuelto = montoNum > totalRestante ? montoNum - totalRestante : 0

  // Update `monto` automatically when selected method is NOT efectivo, to enforce exact payment
  const metodoObj = metodos.find(m => m.id.toString() === selectedMetodo)
  const esEfectivo = metodoObj?.nombre.toLowerCase().includes('efectivo')

  useEffect(() => {
    if (pedido && !esEfectivo) {
      setMonto(totalRestante.toString())
    } else if (pedido && esEfectivo && montoNum < totalRestante) {
      setMonto(totalRestante.toString())
    }
  }, [selectedMetodo, totalRestante, esEfectivo, pedido])

  const handleToggleSaldo = (pagoId: number) => {
    if (saldosSeleccionados.includes(pagoId)) {
      setSaldosSeleccionados(prev => prev.filter(id => id !== pagoId))
    } else {
      // Solo agregarlo si todavía falta pagar algo
      if (totalRestante > 0) {
        setSaldosSeleccionados(prev => [...prev, pagoId])
      }
    }
  }

  const handleCobrar = async () => {
    if (!pedido || !selectedMetodo) return

    if (totalRestante > 0 && (!monto || montoNum < totalRestante)) {
      toast.error("El monto ingresado no cubre el total restante del pedido.")
      return
    }

    if (!esEfectivo && montoNum !== totalRestante) {
      toast.error("Para métodos que no son efectivo, el monto ingresado debe ser exacto.")
      return
    }

    setLoading(true)
    try {
      await registrarPago({
        pedidoId: pedido.id,
        metodoPagoId: parseInt(selectedMetodo),
        monto: montoNum,
        dejarVueltoAFavor: esEfectivo ? dejarVueltoAFavor : false,
        saldosAplicados: saldosCalculados
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
      toast.error(error?.response?.data?.message || error.message || "Hubo un error al registrar el pago.")
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
      trigger={<span style={{ display: 'none' }} />}
    >
      {pedido && (
        <div className="flex-1 space-y-6">
          {/* Resumen */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Cliente</span>
              <span className="font-semibold text-gray-900">{pedido.cliente?.nombre || "Consumidor Final"}</span>
            </div>
            <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Total Pedido</span>
              <span className="font-bold text-gray-900">${totalPedido.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Saldos a Favor */}
          {saldosDisponibles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-brand-blue font-bold">Saldos a Favor Disponibles</Label>
              <div className="flex flex-col gap-2">
                {saldosDisponibles.map(saldo => {
                  const isSelected = saldosSeleccionados.includes(saldo.pagoId)
                  const uso = saldosCalculados.find(s => s.pagoId === saldo.pagoId)
                  
                  return (
                    <div 
                      key={saldo.pagoId} 
                      className={`flex items-center justify-between p-3 border rounded-xl transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                      onClick={() => handleToggleSaldo(saldo.pagoId)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Pedido #{saldo.codigoSeguimiento}</p>
                          <p className="text-xs text-gray-500">{format(new Date(saldo.fechaOriginal), "d MMM yyyy", { locale: es })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${saldo.montoDisponible.toLocaleString("es-AR")}</p>
                        {uso && <p className="text-xs text-blue-600 font-medium">Usando: ${uso.monto.toLocaleString("es-AR")}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Total Restante a Pagar */}
          {saldosSeleccionados.length > 0 && (
            <div className="flex justify-between items-center text-xl p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/20">
              <span className="text-brand-blue font-bold">Total a Pagar ahora</span>
              <span className="font-black text-brand-blue">${totalRestante.toLocaleString("es-AR")}</span>
            </div>
          )}

          {/* Formulario (solo si falta pagar algo o si pagan exacto) */}
          {totalRestante > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Método de Pago</Label>
                <div className="grid grid-cols-2 gap-3">
                  {metodos.map((metodo) => {
                    const isSelected = selectedMetodo === metodo.id.toString()
                    const Icon = metodo.icono ? (ICON_MAP[metodo.icono] || Banknote) : Banknote;

                    return (
                      <div 
                        key={metodo.id}
                        onClick={() => setSelectedMetodo(metodo.id.toString())}
                        className={`
                          cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                          ${isSelected 
                            ? 'border-brand-blue bg-brand-blue/5 shadow-md shadow-brand-blue/10 scale-[1.02]' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-brand-blue' : 'text-gray-500'}`} />
                        <span className={`text-sm font-semibold text-center ${isSelected ? 'text-brand-blue' : 'text-gray-700'}`}>
                          {metodo.nombre}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monto Entregado (Con cuánto paga)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <Input 
                    type="number" 
                    min={totalRestante}
                    value={monto} 
                    onChange={(e) => setMonto(e.target.value)}
                    disabled={!esEfectivo} // Si no es efectivo, debe ser exacto, lo deshabilitamos para evitar errores
                    className="pl-7 h-11 text-lg font-semibold"
                  />
                </div>
                {!esEfectivo && <p className="text-xs text-gray-500 mt-1">El monto debe ser exacto para este método de pago.</p>}
              </div>

              {vuelto > 0 && esEfectivo && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center text-green-800">
                    <span className="font-medium">Vuelto a entregar:</span>
                    <span className="font-bold text-xl">${vuelto.toLocaleString("es-AR")}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-green-200/50">
                    <Label htmlFor="dejar-vuelto" className="text-green-800 cursor-pointer">Dejar vuelto a favor del cliente</Label>
                    <Switch 
                      id="dejar-vuelto" 
                      checked={dejarVueltoAFavor} 
                      onCheckedChange={setDejarVueltoAFavor}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 text-center font-semibold">
                El total del pedido está cubierto por los saldos a favor.
             </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 w-full mt-6">
        <Button 
          className="w-full h-12 rounded-xl text-base font-semibold bg-green-600 hover:bg-green-700" 
          onClick={handleCobrar}
          disabled={loading || (totalRestante > 0 && (!selectedMetodo || !monto))}
        >
          {loading ? "Registrando..." : "Registrar Cobro"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl text-base font-bold" 
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </FormSheet>
  )
}
