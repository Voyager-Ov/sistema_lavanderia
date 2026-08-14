"use client"

import React, { useState } from "react"
import { useCuentaCorriente } from "../hooks/useCuentaCorriente"
import { ModalCobroDeuda } from "./ModalCobroDeuda"
import { ModalAjusteCredito } from "./ModalAjusteCredito"
import { Button } from "@/shared/ui/forms/button"
import { Badge } from "@/shared/ui/data-display/badge"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  Wallet,
  Sparkles,
  Receipt,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PackageCheck
} from "lucide-react"

interface CuentaCorrienteTabProps {
  clienteId: number
  clienteNombre: string
}

export function CuentaCorrienteTab({ clienteId, clienteNombre }: CuentaCorrienteTabProps) {
  const {
    estadoCuenta,
    movimientos,
    metaMovimientos,
    page,
    setPage,
    isLoadingEstado,
    isLoadingMovimientos,
    isSubmitting,
    refreshEstado,
    refreshMovimientos,
    ejecutarCobroDeuda,
    ejecutarAjusteCredito
  } = useCuentaCorriente(clienteId)

  const [modalCobroOpen, setModalCobroOpen] = useState(false)
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false)

  const resumen = estadoCuenta?.resumen || {
    deudaExigible: 0,
    totalCreditoDisponible: 0,
    saldoNeto: 0,
    pedidosDeudaCount: 0,
    creditosCount: 0
  }

  const pedidosDeuda = estadoCuenta?.pedidosDeuda || []
  const creditosDisponibles = estadoCuenta?.creditosDisponibles || []

  return (
    <div className="space-y-6">
      {/* ── BARRA DE ACCIONES SUPERIOR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-blue" />
            Estado de Cuenta Corriente
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Libro Mayor dinámico basado en pedidos imputados y saldos a favor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshEstado()
              refreshMovimientos()
            }}
            disabled={isLoadingEstado || isLoadingMovimientos}
            className="text-xs h-9 px-3.5 gap-1.5 rounded-full font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEstado ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalAjusteOpen(true)}
            className="text-xs h-9 px-4 gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-full font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Ajustar Saldo a Favor
          </Button>

          {pedidosDeuda.length > 0 && (
            <Button
              size="sm"
              onClick={() => setModalCobroOpen(true)}
              className="text-xs h-9 px-5 gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-md"
            >
              <Receipt className="w-3.5 h-3.5" />
              Cobrar Pedidos Impagos ({pedidosDeuda.length})
            </Button>
          )}
        </div>
      </div>

      {/* ── PEDIDOS ADEUDADOS & CRÉDITOS A FAVOR ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Pedidos Adeudados */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-red-500" />
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-neutral-100">
                Pedidos Pendientes de Cobro
              </h4>
            </div>
            <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/50">
              {pedidosDeuda.length}
            </span>
          </div>

          {pedidosDeuda.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-neutral-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-bold text-gray-800 dark:text-neutral-200">¡Cuenta Al día!</p>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">El cliente no tiene pedidos entregados impagos</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {pedidosDeuda.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 transition-colors"
                >
                  <div>
                    <span className="text-xs font-black font-mono text-gray-900 dark:text-neutral-100">
                      #{p.codigoSeguimiento || (p as any).numeroPedido || p.id}
                    </span>
                    <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-0.5">
                      Ingresó: {p.createdAt ? format(parseISO(p.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-red-600">
                      ${parseFloat(p.total as any).toLocaleString("es-AR")}
                    </span>
                    <Badge variant="outline" className="block text-[10px] mt-0.5 border-red-200 text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400">
                      Impago
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Saldos a Favor Disponibles */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-neutral-100">
                Saldos a Favor Disponibles
              </h4>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              {creditosDisponibles.length}
            </span>
          </div>

          {creditosDisponibles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-neutral-500">
              <Sparkles className="w-10 h-10 text-gray-300 dark:text-neutral-700 mb-2 opacity-50" />
              <p className="text-sm font-bold text-gray-800 dark:text-neutral-200">Sin saldo a favor</p>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">No hay créditos acumulados para este cliente</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {creditosDisponibles.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-none font-bold">
                        {c.origen}
                      </Badge>
                      {c.pedidoOrigen && (
                        <span className="text-[11px] font-mono text-gray-500">
                          #{c.pedidoOrigen.codigoSeguimiento}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
                      {c.motivo || "Acreditación a favor"} · {format(parseISO(c.createdAt), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-emerald-600">
                      ${parseFloat(c.montoDisponible as any).toLocaleString("es-AR")}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      de ${parseFloat(c.montoOriginal as any).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LIBRO MAYOR CRONOLÓGICO DE MOVIMIENTOS ────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-extrabold text-gray-900 dark:text-neutral-100">
              Libro Mayor de Movimientos
            </h4>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Historial cronológico auditado de transacciones
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono font-bold">
            Página {metaMovimientos.currentPage} de {metaMovimientos.totalPages || 1}
          </span>
        </div>

        {isLoadingMovimientos ? (
          <div className="py-12 text-center text-gray-400 animate-pulse text-xs">
            Cargando libro mayor...
          </div>
        ) : movimientos.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No se registran movimientos en el historial de la cuenta
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/40">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Fecha</th>
                  <th className="py-3.5 px-4 font-bold">Tipo</th>
                  <th className="py-3.5 px-4 font-bold">Concepto</th>
                  <th className="py-3.5 px-4 font-bold">Método</th>
                  <th className="py-3.5 px-4 font-bold text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {movimientos.map((m, idx) => {
                  const isCargo = m.tipo === "CARGO" || m.tipo === "CARGO_PEDIDO" || m.impacto === "DEBE"
                  const isAbono = m.tipo === "ABONO" || m.tipo === "PAGO_RECIBIDO"
                  const isCredito = m.tipo === "CREDITO" || m.tipo === "CREDITO_GENERADO"

                  return (
                    <tr key={m.id || `mov-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-gray-500 dark:text-neutral-400 whitespace-nowrap">
                        {format(parseISO(m.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCargo && (
                          <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px] font-bold">
                            Cargo
                          </Badge>
                        )}
                        {isAbono && (
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px] font-bold">
                            Abono
                          </Badge>
                        )}
                        {isCredito && (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold">
                            Crédito
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-neutral-100">
                        {m.concepto || m.descripcion}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {m.metodoPago || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black whitespace-nowrap">
                        <span
                          className={
                            isCargo
                              ? "text-red-600"
                              : isAbono
                              ? "text-brand-blue"
                              : "text-emerald-600"
                          }
                        >
                          {isCargo ? "-" : "+"}${parseFloat(m.monto as any).toLocaleString("es-AR")}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {(metaMovimientos.totalPages || 1) > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-neutral-800 text-xs">
            <span className="text-gray-400">
              Total: {metaMovimientos.totalItems} movimientos
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingMovimientos}
                className="h-8 px-3 text-xs font-bold rounded-full"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(metaMovimientos.totalPages, p + 1))}
                disabled={page >= metaMovimientos.totalPages || isLoadingMovimientos}
                className="h-8 px-3 text-xs font-bold rounded-full"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALES ───────────────────────────────────────────────────────── */}
      <ModalCobroDeuda
        open={modalCobroOpen}
        onOpenChange={setModalCobroOpen}
        clienteNombre={clienteNombre}
        pedidosDeuda={pedidosDeuda}
        creditoDisponibleTotal={resumen.totalCreditoDisponible}
        onConfirmar={ejecutarCobroDeuda}
        isSubmitting={isSubmitting}
      />

      <ModalAjusteCredito
        open={modalAjusteOpen}
        onOpenChange={setModalAjusteOpen}
        clienteNombre={clienteNombre}
        onConfirmar={ejecutarAjusteCredito}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
