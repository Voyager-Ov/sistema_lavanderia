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
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
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
    deudaNoExigible: 0,
    totalCreditoDisponible: 0,
    saldoNeto: 0,
    pedidosDeudaCount: 0,
    pedidosEnCursoCount: 0,
    creditosCount: 0
  }

  const pedidosDeuda = estadoCuenta?.pedidosDeuda || []
  const creditosDisponibles = estadoCuenta?.creditosDisponibles || []

  return (
    <div className="space-y-6">
      {/* ── BARRA DE ACCIONES SUPERIOR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Posición de Cuenta Corriente
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Libro Mayor dinámico basado en pedidos facturados y saldos a favor
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
            className="text-xs h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEstado ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalAjusteOpen(true)}
            className="text-xs h-9 px-3 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Ajustar Saldo a Favor
          </Button>

          <Button
            size="sm"
            onClick={() => setModalCobroOpen(true)}
            disabled={pedidosDeuda.length === 0}
            className="text-xs h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            Cobrar Deuda ({pedidosDeuda.length})
          </Button>
        </div>
      </div>

      {/* ── TARJETAS KPI DE SALDOS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Deuda Exigible */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deuda Exigible
            </span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-red-600">
              ${resumen.deudaExigible.toLocaleString("es-AR")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {resumen.pedidosDeudaCount} pedido(s) entregado(s) impagos
            </p>
          </div>
        </div>

        {/* 2. Saldo a Favor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo a Favor
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-emerald-600">
              ${resumen.totalCreditoDisponible.toLocaleString("es-AR")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {resumen.creditosCount} crédito(s) con saldo remanente
            </p>
          </div>
        </div>

        {/* 3. Pedidos en Curso */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pedidos en Curso
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-slate-800">
              ${resumen.deudaNoExigible.toLocaleString("es-AR")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {resumen.pedidosEnCursoCount} pedido(s) en taller/proceso
            </p>
          </div>
        </div>

        {/* 4. Balance Neto Consolidado */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Posición Neta
            </span>
            <div className="p-2 bg-slate-800 text-slate-200 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-black font-mono ${
                resumen.saldoNeto < 0
                  ? "text-red-400"
                  : resumen.saldoNeto > 0
                  ? "text-emerald-400"
                  : "text-slate-200"
              }`}
            >
              {resumen.saldoNeto < 0
                ? `-$${Math.abs(resumen.saldoNeto).toLocaleString("es-AR")}`
                : `$${resumen.saldoNeto.toLocaleString("es-AR")}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Crédito disponible vs Deuda exigible
            </p>
          </div>
        </div>
      </div>

      {/* ── PEDIDOS ADEUDADOS & CRÉDITOS A FAVOR ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Pedidos Adeudados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-red-500" />
              <h4 className="text-sm font-bold text-slate-800">
                Pedidos Entregados Pendientes de Cobro
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {pedidosDeuda.length}
            </span>
          </div>

          {pedidosDeuda.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-600">¡Al día!</p>
              <p className="text-xs text-slate-400 mt-0.5">El cliente no tiene pedidos entregados adeudados</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {pedidosDeuda.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-red-50 bg-red-50/20 hover:bg-red-50/40 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {p.codigoSeguimiento}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Entregado: {format(parseISO(p.createdAt), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-red-600">
                      ${parseFloat(p.total as any).toLocaleString("es-AR")}
                    </span>
                    <Badge variant="outline" className="block text-[10px] mt-0.5 border-red-200 text-red-700 bg-red-50">
                      Impago
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Saldos a Favor Disponibles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-800">
                Saldos a Favor Disponibles
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {creditosDisponibles.length}
            </span>
          </div>

          {creditosDisponibles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Sparkles className="w-10 h-10 text-slate-300 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-600">Sin saldo a favor</p>
              <p className="text-xs text-slate-400 mt-0.5">No hay créditos remanentes registrados para este cliente</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {creditosDisponibles.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-50 bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                        {c.origen}
                      </Badge>
                      {c.pedidoOrigen && (
                        <span className="text-[11px] font-mono text-slate-500">
                          {c.pedidoOrigen.codigoSeguimiento}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {c.motivo || "Acreditación a favor"} · {format(parseISO(c.createdAt), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-emerald-700">
                      ${parseFloat(c.montoDisponible as any).toLocaleString("es-AR")}
                    </span>
                    <p className="text-[10px] text-slate-400">
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
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Libro Mayor de Movimientos
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Historial cronológico auditado de cargos, abonos y créditos
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Página {metaMovimientos.currentPage} de {metaMovimientos.totalPages || 1}
          </span>
        </div>

        {isLoadingMovimientos ? (
          <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
            Cargando libro mayor...
          </div>
        ) : movimientos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se registran movimientos en el historial de la cuenta
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Concepto</th>
                  <th className="py-3 px-4 font-semibold">Método</th>
                  <th className="py-3 px-4 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.map((m, idx) => {
                  const isCargo = m.tipo === "CARGO" || m.tipo === "CARGO_PEDIDO" || m.impacto === "DEBE"
                  const isAbono = m.tipo === "ABONO" || m.tipo === "PAGO_RECIBIDO"
                  const isCredito = m.tipo === "CREDITO" || m.tipo === "CREDITO_GENERADO"

                  return (
                    <tr key={m.id || `mov-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {format(parseISO(m.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="py-3 px-4">
                        {isCargo && (
                          <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px]">
                            Cargo
                          </Badge>
                        )}
                        {isAbono && (
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px]">
                            Abono
                          </Badge>
                        )}
                        {isCredito && (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]">
                            Crédito
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {m.concepto || m.descripcion}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {m.metodoPago || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isCargo
                              ? "text-red-600"
                              : isAbono
                              ? "text-blue-600"
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
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-400">
              Total: {metaMovimientos.totalItems} movimientos
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingMovimientos}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(metaMovimientos.totalPages, p + 1))}
                disabled={page >= metaMovimientos.totalPages || isLoadingMovimientos}
                className="h-8 px-2.5 text-xs"
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
