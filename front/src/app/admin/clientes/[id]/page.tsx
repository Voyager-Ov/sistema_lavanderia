"use client"

import React, { useRef, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import {
  ArrowLeft, Edit, Phone, Mail,
  ShoppingBag, AlertCircle, CheckCircle2, Clock,
  ExternalLink, Package, MessageCircle, Banknote, RefreshCw, Eye, Sparkles
} from "lucide-react"
import { parseISO, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { useClienteDetail } from "../hooks/useClienteDetail"
import { getPedidosImpagosCliente } from "@/domains/clientes/api"
import { Button } from "@/shared/ui/forms/button"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"
import { CobrarPedidosSheet } from "@/domains/pagos/components/cobrar-pedidos-sheet"
import { DataTableBulkActions, BulkAction } from "@/shared/ui/data-display/data-table-bulk-actions"
import { safeFormatDate } from "@/shared/lib/utils"
import { toast } from "sonner"

function renderEstadoBadge(estadoRaw: any) {
  if (!estadoRaw) return null
  const estadoStr = typeof estadoRaw === "object" ? (estadoRaw?.nombre || estadoRaw?.estado || "") : estadoRaw.toString()
  if (!estadoStr) return null
  const estadoUpper = estadoStr.toUpperCase()

  let colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
  let Icon = Clock

  if (estadoUpper.includes("CANCELAD")) {
    colorClass = "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
    Icon = AlertCircle
  } else if (estadoUpper.includes("ENTREGADO") || estadoUpper.includes("COMPLETADO")) {
    colorClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
    Icon = Package
  } else if (estadoUpper.includes("LISTO") || estadoUpper.includes("FINALIZADO")) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
    Icon = CheckCircle2
  } else if (estadoUpper.includes("PROCESO") || estadoUpper.includes("LAVADO") || estadoUpper.includes("SECADO") || estadoUpper.includes("DOBLADO")) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
    Icon = Clock
  }

  const labelFormatted = estadoStr.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{labelFormatted}</span>
    </span>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-neutral-800 rounded-2xl ${className}`} />
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.id ? parseInt(params.id as string) : 0

  const { cliente, isLoading, fetchCliente } = useClienteDetail(clienteId)
  const containerRef = useRef<HTMLDivElement>(null)

  // Selección de pedidos impagos para cobrar
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<number[]>([])
  const [modalCobroOpen, setModalCobroOpen] = useState(false)
  const [pedidosParaCobroSheet, setPedidosParaCobroSheet] = useState<any[]>([])
  const [isLoadingCobro, setIsLoadingCobro] = useState(false)

  gsap.registerPlugin(useGSAP)
  useGSAP(() => {
    if (!isLoading && cliente) {
      gsap.fromTo(
        ".stagger-in",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out", clearProps: "transform" }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading, !!cliente] })

  function isPedidoCancelado(p: any) {
    if (!p) return false
    const est = typeof p.estado === "object" ? p.estado?.nombre : p.estado
    if (!est) return false
    return est.toString().toUpperCase().includes("CANCELAD")
  }

  // Regla Única de Deuda de Cliente: Solamente los pedidos ENTREGADOS que no han sido cobrados
  function isPedidoEntregadoEImpago(p: any) {
    if (!p || p.cobrado) return false
    const est = typeof p.estado === "object" ? p.estado?.nombre : p.estado
    if (!est) return false
    const estUpper = est.toString().toUpperCase()
    if (estUpper.includes("CANCELAD")) return false
    return estUpper.includes("ENTREGADO") || estUpper.includes("COMPLETADO")
  }

  // KPIs de consumo (excluye pedidos cancelados)
  const { totalGastado, totalPedidos, pedidosActivos, ticketPromedio } = useMemo(() => {
    if (!cliente) return { totalGastado: 0, totalPedidos: 0, pedidosActivos: 0, ticketPromedio: 0 }
    const pedidos = (cliente.pedidos || []).filter((p: any) => !isPedidoCancelado(p))
    const totalP = pedidos.length
    const totalG = pedidos.reduce((acc: number, p: any) => acc + parseFloat(p.total || "0"), 0)
    const activos = pedidos.filter((p: any) => {
      const est = (typeof p.estado === "object" ? p.estado?.nombre : p.estado)?.toString()?.toUpperCase() || ""
      return !est.includes("ENTREGADO") && !est.includes("COMPLETADO") && !est.includes("CANCELAD")
    }).length
    const ticket = totalP > 0 ? totalG / totalP : 0
    return { totalGastado: totalG, totalPedidos: totalP, pedidosActivos: activos, ticketPromedio: ticket }
  }, [cliente])

  // Pedidos que constituyen Deuda Única (Entregados y no cobrados)
  const pedidosImpagos = useMemo(() => {
    if (!cliente?.pedidos) return []
    return cliente.pedidos.filter((p: any) => isPedidoEntregadoEImpago(p))
  }, [cliente])

  // Pedidos impagos que están en proceso en taller (no son deuda hasta ser entregados)
  const pedidosEnTallerImpagos = useMemo(() => {
    if (!cliente?.pedidos) return []
    return cliente.pedidos.filter((p: any) => !p.cobrado && !isPedidoCancelado(p) && !isPedidoEntregadoEImpago(p))
  }, [cliente])

  const montoEnTaller = useMemo(() => {
    return pedidosEnTallerImpagos.reduce((acc: number, p: any) => acc + parseFloat(p.total || "0"), 0)
  }, [pedidosEnTallerImpagos])

  const saldoDeuda = useMemo(() => {
    if (typeof cliente?.saldoDeuda === "number") {
      return cliente.saldoDeuda
    }
    return pedidosImpagos.reduce((acc: number, p: any) => acc + parseFloat(p.total || "0"), 0)
  }, [cliente, pedidosImpagos])

  const saldoAFavor = useMemo(() => {
    return parseFloat(cliente?.saldoAFavor || cliente?.cuentaCorriente?.saldo || "0")
  }, [cliente])

  // Objetos de pedidos actualmente seleccionados para el cobro
  const pedidosSeleccionadosParaCobro = useMemo(() => {
    if (!cliente?.pedidos) return []
    return cliente.pedidos.filter((p: any) => selectedPedidoIds.includes(p.id || p.numeroPedido))
  }, [cliente, selectedPedidoIds])

  const montoSeleccionado = useMemo(() => {
    return pedidosSeleccionadosParaCobro.reduce((acc: number, p: any) => acc + parseFloat(p.total || "0"), 0)
  }, [pedidosSeleccionadosParaCobro])

  const toggleSelectPedido = (id: number) => {
    setSelectedPedidoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAllImpagos = () => {
    if (selectedPedidoIds.length === pedidosImpagos.length) {
      setSelectedPedidoIds([])
    } else {
      setSelectedPedidoIds(pedidosImpagos.map((p: any) => p.id || p.numeroPedido))
    }
  }

  // Consulta en tiempo real al backend de los pedidos impagos antes de abrir el SideSheet de cobro
  const abrirCobroVerificadoServidor = async (idsFiltro?: number[]) => {
    setIsLoadingCobro(true)
    try {
      const res = await getPedidosImpagosCliente(clienteId)
      const impagosServidor = res.pedidosImpagos || []

      if (idsFiltro && idsFiltro.length > 0) {
        const filtrados = impagosServidor.filter((p: any) => idsFiltro.includes(p.id || p.numeroPedido))
        setPedidosParaCobroSheet(filtrados)
      } else {
        setPedidosParaCobroSheet(impagosServidor)
        setSelectedPedidoIds(impagosServidor.map((p: any) => p.id || p.numeroPedido))
      }

      setModalCobroOpen(true)
    } catch (error: any) {
      toast.error("Error al consultar deudas en tiempo real con el servidor.")
    } finally {
      setIsLoadingCobro(false)
    }
  }

  // Acciones masivas para la barra flotante estandarizada DataTableBulkActions
  const bulkActions = useMemo<BulkAction<any>[]>(() => [
    {
      label: `Cobrar ($${montoSeleccionado.toLocaleString("es-AR")})`,
      icon: Banknote,
      colorClass: "bg-green-600 hover:bg-green-700 text-white font-bold",
      onClick: () => abrirCobroVerificadoServidor(selectedPedidoIds)
    }
  ], [montoSeleccionado, selectedPedidoIds])

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-neutral-100">Cliente no encontrado</h2>
        <p className="text-gray-500 text-sm mt-1 mb-6">El cliente especificado no existe o ha sido desactivado.</p>
        <Button onClick={() => router.push("/admin/clientes")} className="rounded-full px-6">
          Volver a Clientes
        </Button>
      </div>
    )
  }

  const rawTel = cliente.telefono ? cliente.telefono.replace(/\D/g, "") : ""
  const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ""}`.trim()
  const inicial = nombreCompleto.charAt(0).toUpperCase()

  return (
    <div ref={containerRef} className="flex-1 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full relative pb-28">
      
      {/* ── UNIFIED SINGLE-ROW HEADER BAR ────────────────────────── */}
      <div className="stagger-in flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm w-full">
        {/* Izquierda: Volver + Avatar + Nombre + Estado + Contacto */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => router.push("/admin/clientes")}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-md shrink-0">
            {inicial}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-neutral-100 tracking-tight leading-tight">{nombreCompleto}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cliente.activo !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'}`}>
                {cliente.activo !== false ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-neutral-400 mt-1">
              {cliente.telefono && (
                <a
                  href={`https://wa.me/${rawTel}?text=${encodeURIComponent(`Hola ${cliente.nombre}, te escribimos de la lavandería.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-green-600/10" />
                  <span>{cliente.telefono}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
              {cliente.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{cliente.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Derecha: Deuda Status + Botones de Acción */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {montoEnTaller > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Package className="w-4 h-4 text-amber-600 shrink-0" />
              <span>En taller: ${montoEnTaller.toLocaleString("es-AR")}</span>
            </div>
          )}

          {saldoAFavor > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 px-4 py-2 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Saldo a Favor</span>
                <span className="text-lg font-black text-blue-600 font-mono">${saldoAFavor.toLocaleString("es-AR")}</span>
              </div>
            </div>
          )}

          {saldoDeuda > 0 ? (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Deuda Pendiente</span>
                <span className="text-lg font-black text-red-600 font-mono">${saldoDeuda.toLocaleString("es-AR")}</span>
              </div>
            </div>
          ) : (
            saldoAFavor === 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-4 py-2 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Estado de Cuenta</span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">Al día ($0)</span>
                </div>
              </div>
            )
          )}

          {saldoDeuda > 0 && (
            <Button
              onClick={() => abrirCobroVerificadoServidor()}
              disabled={isLoadingCobro}
              className="bg-green-600 hover:bg-green-700 text-white font-bold h-11 px-5 rounded-2xl shadow-md gap-2 text-xs"
            >
              <Banknote className="w-4 h-4" />
              {isLoadingCobro ? "Consultando..." : `Cobrar Deuda ($${saldoDeuda.toLocaleString("es-AR")})`}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCliente()}
            className="rounded-2xl h-11 px-3.5 gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/clientes/${cliente.id}/editar`)}
            className="rounded-2xl h-11 px-4 gap-1.5 text-xs font-bold shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* ── TARJETAS KPI DE CONSUMO (4 Tarjetas) ───────────────── */}
      <div className="stagger-in grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        <DashboardKpi
          title="Total Gastado"
          value={`$${totalGastado.toLocaleString("es-AR")}`}
          backMessage="Suma acumulada de pedidos"
          colorVariant="blue"
        />
        <DashboardKpi
          title="Pedidos Totales"
          value={totalPedidos}
          backMessage="Tickets generados"
          colorVariant="purple"
        />
        <DashboardKpi
          title="Ticket Promedio"
          value={`$${ticketPromedio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          backMessage="Valor medio por servicio"
          colorVariant="orange"
        />
        <DashboardKpi
          title="Pedidos Activos"
          value={pedidosActivos}
          backMessage="En proceso o taller"
          colorVariant={pedidosActivos > 0 ? "green" : "blue"}
        />
      </div>

      {/* ── ÚNICA TABLA UNIFICADA: PEDIDOS DEL CLIENTE ──────────────── */}
      <div className="stagger-in bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-brand-blue" />
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-neutral-100">Historial Comercial de Pedidos</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Selecciona los pedidos impagos que deseas abonar</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full px-4"
            onClick={() => {
              sessionStorage.setItem('pedidos_state', JSON.stringify({
                searchTerm: cliente.nombre,
                activeFilter: "TODOS",
                pagination: { pageIndex: 0, pageSize: 50 },
                sorting: []
              }));
              router.push('/admin/pedidos');
            }}
          >
            Ver en pedidos generales &rarr;
          </Button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-neutral-800/60 text-gray-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 w-10">
                  {pedidosImpagos.length > 0 && (
                    <Checkbox
                      checked={selectedPedidoIds.length > 0 && selectedPedidoIds.length === pedidosImpagos.length}
                      onCheckedChange={toggleSelectAllImpagos}
                      aria-label="Seleccionar todos los impagos"
                    />
                  )}
                </th>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Servicios / Ítems</th>
                <th className="px-6 py-4">Fecha Pedido</th>
                <th className="px-6 py-4">Estado Servicio</th>
                <th className="px-6 py-4">Estado Cobro</th>
                <th className="px-6 py-4">Monto Total</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {(cliente.pedidos || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 dark:text-neutral-500">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">Sin pedidos registrados para este cliente</p>
                  </td>
                </tr>
              ) : (
                (cliente.pedidos || []).map((p: any, idx: number) => {
                  const pId = p.id || p.numeroPedido
                  const isCancelado = isPedidoCancelado(p)
                  const isImpago = !p.cobrado && !isCancelado
                  const isSelected = selectedPedidoIds.includes(pId)

                  // Detalle de servicios de las prendas
                  const itemsDetalle = (p.detalles || [])
                    .map((d: any) => d.servicio?.nombre || d.descripcion || d.nombre)
                    .filter(Boolean)
                    .join(", ")

                  const fechaMostrar = p.fechaHoraPedido || p.fechaRecepcion || p.createdAt

                  return (
                    <tr
                      key={pId || idx}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-green-50/60 dark:bg-green-950/20"
                          : "hover:bg-gray-50/80 dark:hover:bg-neutral-800/40"
                      }`}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {isImpago ? (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectPedido(pId)}
                            aria-label={`Seleccionar pedido #${p.codigoSeguimiento}`}
                          />
                        ) : (
                          <span className="text-gray-300 dark:text-neutral-700 text-xs">—</span>
                        )}
                      </td>

                      <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => router.push(`/admin/pedidos/${pId}`)}
                      >
                        <span className="font-extrabold text-brand-blue hover:underline font-mono text-xs">
                          #{p.codigoSeguimiento || p.numeroPedido || p.id}
                        </span>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        {itemsDetalle ? (
                          <span className="text-xs font-medium text-gray-700 dark:text-neutral-300 truncate block" title={itemsDetalle}>
                            {itemsDetalle}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium">
                            {p.detallesCount ? `${p.detallesCount} servicio(s)` : "Servicios lavandería"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-neutral-400">
                        {safeFormatDate(fechaMostrar)}
                      </td>

                      <td className="px-6 py-4">
                        {renderEstadoBadge(p.estado)}
                      </td>

                      <td className="px-6 py-4">
                        {isCancelado ? (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold uppercase border bg-gray-100 text-gray-500 border-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                            N/A (Cancelado)
                          </span>
                        ) : p.cobrado ? (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-black uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Cobrado
                          </span>
                        ) : isPedidoEntregadoEImpago(p) ? (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-black uppercase border bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400">
                            Deuda Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                            En Taller (Impago)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-black font-mono text-gray-900 dark:text-neutral-100">
                        ${parseFloat(p.total || "0").toLocaleString("es-AR")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-full"
                            onClick={() => router.push(`/admin/pedidos/${pId}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {isImpago && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                              onClick={() => abrirCobroVerificadoServidor([pId])}
                            >
                              <Banknote className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTTOM ISLAND ESTANDARIZADA (DataTableBulkActions) ──────── */}
      <DataTableBulkActions
        selectedRows={pedidosSeleccionadosParaCobro}
        actions={bulkActions}
        onClearSelection={() => setSelectedPedidoIds([])}
      />

      {/* ── SIDESHEET RESPONSIVO UNIFICADO DE COBRO ───────────────── */}
      <CobrarPedidosSheet
        open={modalCobroOpen}
        onOpenChange={setModalCobroOpen}
        clienteId={cliente.id}
        clienteNombre={nombreCompleto}
        pedidos={pedidosParaCobroSheet}
        onSuccess={() => {
          setSelectedPedidoIds([])
          fetchCliente()
        }}
      />
    </div>
  )
}
