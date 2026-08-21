"use client"

import React, { useState, useRef, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  Banknote,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"
import { cerrarCaja, obtenerCajaPorId, CajaActual } from "@/domains/caja/caja.api"
import { Button } from "@/shared/ui/forms/button"
import { KpiCard } from "@/shared/ui/data-display/kpi-card"
import { useSocket } from "@/shared/hooks/useSocket"

interface ResumenCierreTurnoViewProps {
  caja: CajaActual
  onVolverPos: () => void
  onCajaCerrada: () => void
}

export function ResumenCierreTurnoView({
  caja: initialCaja,
  onVolverPos,
  onCajaCerrada
}: ResumenCierreTurnoViewProps) {
  const [caja, setCaja] = useState<CajaActual>(initialCaja)
  const [isLoadingLive, setIsLoadingLive] = useState(true)
  const { socket } = useSocket()

  const fetchLiveCaja = async () => {
    try {
      const targetId = initialCaja.idCaja || initialCaja.id
      if (targetId) {
        const data = await obtenerCajaPorId(targetId)
        if (data) setCaja(data)
      }
    } catch (e) {
      console.error("Error al refrescar caja en vivo:", e)
    } finally {
      setIsLoadingLive(false)
    }
  }

  useEffect(() => {
    fetchLiveCaja()
  }, [initialCaja.id])

  useEffect(() => {
    if (!socket) return

    const handleSocketUpdate = () => {
      fetchLiveCaja()
    }

    socket.on("caja_actualizada", handleSocketUpdate)
    socket.on("pago_registrado", handleSocketUpdate)
    socket.on("pago_anulado", handleSocketUpdate)
    socket.on("gasto:registrado", handleSocketUpdate)

    return () => {
      socket.off("caja_actualizada", handleSocketUpdate)
      socket.off("pago_registrado", handleSocketUpdate)
      socket.off("pago_anulado", handleSocketUpdate)
      socket.off("gasto:registrado", handleSocketUpdate)
    }
  }, [socket])

  const montoInicial = parseFloat(caja.montoInicial?.toString() || "0")
  const totalIngresos = caja.totalIngresosEnVivo || 0
  const totalEgresos = caja.totalEgresosEnVivo || 0
  const ingresosEfectivo = caja.totalIngresosEfectivo || 0
  const egresosEfectivo = caja.totalEgresosEfectivo || 0

  const efectivoEsperado = caja.efectivoEsperadoEnVivo ?? caja.efectivoEsperado ?? (
    montoInicial + ingresosEfectivo - egresosEfectivo
  )

  const resultadoNeto = totalIngresos - totalEgresos
  const totalPedidos = caja.pagos ? caja.pagos.length : 0
  const totalGastosCount = caja.gastos ? caja.gastos.length : 0

  const [efectivoReal, setEfectivoReal] = useState<string>(efectivoEsperado.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sincronizar efectivoReal por defecto cuando cambie el efectivoEsperado en vivo
  useEffect(() => {
    setEfectivoReal(efectivoEsperado.toString())
  }, [efectivoEsperado])

  const viewRef = useRef<HTMLDivElement>(null)

  // GSAP Entrance
  useGSAP(() => {
    if (viewRef.current) {
      gsap.fromTo(
        viewRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      )
    }
  }, [])

  // Calculate difference
  const numEfectivoReal = parseFloat(efectivoReal) || 0
  const diferencia = numEfectivoReal - efectivoEsperado

  const handleCerrarCajaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (numEfectivoReal < 0) {
      toast.error("El efectivo real no puede ser negativo")
      return
    }

    setIsSubmitting(true)
    try {
      await cerrarCaja(caja.idCaja || caja.id, numEfectivoReal)
      toast.success("Turno de caja cerrado correctamente")
      onCajaCerrada()
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || err.message || "Error al cerrar la caja"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div ref={viewRef} className="flex-1 flex flex-col gap-6 w-full h-full p-4 sm:p-6 overflow-y-auto bg-gray-50/50 dark:bg-background transition-colors">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onVolverPos}
            className="h-10 px-3 rounded-xl flex items-center gap-2 text-xs font-bold border-gray-200 dark:border-neutral-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al POS</span>
          </Button>

          <div className="border-l border-gray-200 dark:border-neutral-800 pl-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-blue" />
              <span>Resumen de Turno POS & Arqueo</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Caja #{caja.idCaja || caja.id} • Atendido por <strong className="text-gray-800 dark:text-neutral-200">{caja.usuario?.nombre || "Empleado de Mostrador"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">
          <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-neutral-800">
            Fondo Inicial: <strong>${montoInicial.toLocaleString("es-AR")}</strong>
          </span>
        </div>
      </div>

      {/* Reused Colored Border Cards (matching Pedidos / Clientes / Caja views) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pedidos */}
        <KpiCard
          title="Pedidos Atendidos"
          value={totalPedidos}
          description="Operaciones procesadas en el turno"
          backMessage="Cantidad total de cobros y pedidos gestionados durante el turno de caja activo."
          colorVariant="blue"
        />

        {/* Card 2: Ingresos Totales */}
        <KpiCard
          title="Ingresos Totales"
          value={`$${totalIngresos.toLocaleString("es-AR")}`}
          description={`Efectivo: $${ingresosEfectivo.toLocaleString("es-AR")}`}
          backMessage="Total recaudado acumulando cobros en efectivo y medios digitales (Mercado Pago, tarjetas, transferencias)."
          colorVariant="green"
        />

        {/* Card 3: Gastos */}
        <KpiCard
          title="Egresos / Gastos"
          value={`-$${totalEgresos.toLocaleString("es-AR")}`}
          description={`${totalGastosCount} egresos de caja registrados`}
          backMessage="Suma de gastos directos retirados del dinero físico de la caja en el turno."
          colorVariant="red"
        />

        {/* Card 4: Balance Neto */}
        <KpiCard
          title="Balance Neto de Turno"
          value={`$${resultadoNeto.toLocaleString("es-AR")}`}
          description="Ingresos Totales - Egresos Totales"
          backMessage="Resultado financiero neto generado durante el periodo operativo del turno actual."
          colorVariant="orange"
        />
      </div>

      {/* Main Split Content: Movements Table & Cash Count Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left 2 Cols: Movements Table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-blue" />
              <span>Movimientos Registrados en el Turno</span>
            </h3>
            <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium">
              {(caja.pagos?.length || 0) + (caja.gastos?.length || 0)} operaciones
            </span>
          </div>

          {(!caja.pagos || caja.pagos.length === 0) && (!caja.gastos || caja.gastos.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-neutral-500">
              <Receipt className="w-8 h-8 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs">No hay movimientos registrados en este turno de caja aún.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[450px] pr-1 flex flex-col gap-2.5">
              {caja.pagos?.map((pago) => (
                <div
                  key={`pago-${pago.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-neutral-800/60 border border-gray-200/60 dark:border-neutral-700/50 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
                      +
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {pago.pedido?.codigoSeguimiento || `Cobro Pedido #${pago.pedidoId || pago.id}`}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                        {pago.metodoPago?.nombre || "Efectivo"}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    +${parseFloat(pago.monto?.toString() || "0").toLocaleString("es-AR")}
                  </span>
                </div>
              ))}

              {caja.gastos?.map((gasto) => (
                <div
                  key={`gasto-${gasto.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-neutral-800/60 border border-gray-200/60 dark:border-neutral-700/50 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold flex-shrink-0">
                      -
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{gasto.descripcion}</p>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400">Gasto • {gasto.categoria}</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    -${parseFloat(gasto.monto?.toString() || "0").toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Arqueo Form & Confirmation */}
        <form onSubmit={handleCerrarCajaSubmit} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-blue" />
                <span>Arqueo de Efectivo Final</span>
              </h3>
            </div>

            {/* Expected Cash display */}
            <div className="p-4 bg-gray-50 dark:bg-neutral-800/80 border border-gray-200 dark:border-neutral-700 rounded-xl flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Efectivo Esperado en Caja
              </span>
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                ${efectivoEsperado.toLocaleString("es-AR")}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-1 leading-tight">
                Monto Inicial (${montoInicial.toLocaleString("es-AR")}) + Ingresos Ef. (${ingresosEfectivo.toLocaleString("es-AR")}) - Gastos Ef. (${egresosEfectivo.toLocaleString("es-AR")})
              </p>
            </div>

            {/* Input Real Cash */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Efectivo Real Contado en Caja ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={efectivoReal}
                  onChange={(e) => setEfectivoReal(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                />
              </div>
            </div>

            {/* Live Difference Badge */}
            <div className="pt-1">
              {diferencia === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Cuadre Exacto: El efectivo físico coincide al 100%.</span>
                </div>
              )}
              {diferencia > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
                  <TrendingUp className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  <span>Sobrante en Caja: +${diferencia.toLocaleString("es-AR")} respecto al valor esperado.</span>
                </div>
              )}
              {diferencia < 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Faltante en Caja: -${Math.abs(diferencia).toLocaleString("es-AR")} respecto al valor esperado.</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Close Action Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <span>Cerrando Turno...</span>
            ) : (
              <>
                <span>Confirmar Cierre de Caja</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
