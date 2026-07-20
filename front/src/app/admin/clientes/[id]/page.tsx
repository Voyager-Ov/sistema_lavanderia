"use client"

import React, { useRef, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import {
  ArrowLeft, Edit, Wallet, Activity, Phone, Mail,
  ShoppingBag, TrendingUp, AlertCircle, CheckCircle2, Clock,
  CreditCard, History, ExternalLink, Package
} from "lucide-react"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts"

import { useClienteDetail } from "../hooks/useClienteDetail"
import { Button } from "@/shared/ui/forms/button"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"

// ── Estado del pedido: chip visual ─────────────────────────────────────────
const PEDIDO_ESTADO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDIENTE:           { label: "Pendiente",          color: "bg-blue-50 text-blue-700 border-blue-100",    icon: Clock },
  EN_PROCESO:          { label: "En Proceso",          color: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
  LISTO_PARA_RETIRAR:  { label: "Listo",               color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
  ENTREGADO:           { label: "Entregado",           color: "bg-slate-50 text-slate-500 border-slate-100", icon: Package },
  CANCELADO:           { label: "Cancelado",           color: "bg-red-50 text-red-500 border-red-100",      icon: AlertCircle },
}

// ── Chip de tipo de movimiento ──────────────────────────────────────────────
function MovimientoChip({ tipo }: { tipo: "DEBITO" | "CREDITO" }) {
  const isDebt = tipo === "DEBITO"
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border
      ${isDebt ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
      {isDebt ? "Cargo" : "Pago"}
    </span>
  )
}

// ── Loading skeleton ────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} />
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = Number(params.id)

  const { cliente, isLoading, refresh } = useClienteDetail(clienteId)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<"pedidos" | "movimientos">("pedidos")

  gsap.registerPlugin(useGSAP)
  useGSAP(() => {
    if (!isLoading && cliente) {
      gsap.fromTo(
        ".stagger-in",
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power3.out", clearProps: "transform" }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading, !!cliente] })

  // ── KPIs & chart data ─────────────────────────────────────────────────────
  const { totalGastado, totalPedidos, pedidosActivos, ticketPromedio, chartData } = useMemo(() => {
    if (!cliente) return { totalGastado: 0, totalPedidos: 0, pedidosActivos: 0, ticketPromedio: 0, chartData: [] }

    const pedidos = cliente.pedidos || []
    const totalP = pedidos.length
    const totalG = pedidos.reduce((acc, p) => acc + parseFloat(p.total || "0"), 0)
    const activos = pedidos.filter((p) => !["ENTREGADO", "CANCELADO"].includes(p.estado)).length
    const ticket = totalP > 0 ? totalG / totalP : 0

    // Agrupar por mes/día para el chart — ascendente
    const dataMap: Record<string, number> = {}
    ;[...pedidos].reverse().forEach((p) => {
      const key = format(parseISO(p.createdAt), "dd/MM", { locale: es })
      dataMap[key] = (dataMap[key] || 0) + parseFloat(p.total || "0")
    })
    const cData = Object.entries(dataMap).map(([fecha, total]) => ({ fecha, total }))

    return { totalGastado: totalG, totalPedidos: totalP, pedidosActivos: activos, ticketPromedio: ticket, chartData: cData }
  }, [cliente])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-red-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Cliente no encontrado</h2>
        <p className="text-gray-500 mt-2 mb-6">El cliente que buscas no existe o fue eliminado.</p>
        <Button onClick={() => router.push("/admin/clientes")} className="rounded-full px-8">
          Volver al listado
        </Button>
      </div>
    )
  }

  const saldo = parseFloat(cliente.saldoCuentaCorriente?.toString() || "0")
  const tieneDeuda = saldo > 0
  const saldoAFavor = saldo < 0

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-y-auto">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="stagger-in flex items-center justify-between px-4 sm:px-8 pt-6 pb-4 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/clientes")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
            <h1 className="text-xl font-black text-gray-900 leading-none">{cliente.nombre}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full h-9 px-4 text-sm font-bold shadow-sm"
            onClick={() => router.push(`/admin/clientes/${cliente.id}/editar`)}
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

        {/* ── LEFT: Profile + Account ─────────────────────────── */}
        <div className="stagger-in lg:col-span-1 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 flex flex-col items-center text-center overflow-hidden relative group">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-50 rounded-full group-hover:scale-125 transition-transform duration-700 z-0" />
            <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-[1.75rem] flex items-center justify-center text-4xl font-black shadow-lg mb-5 rotate-3 group-hover:rotate-0 transition-transform duration-300">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <h2 className="relative z-10 text-2xl font-black text-gray-900">{cliente.nombre}</h2>
            <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
              ${cliente.activo ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              <Activity className="w-3 h-3" />
              {cliente.activo ? "Cuenta Activa" : "Cuenta Inactiva"}
            </span>

            <div className="mt-5 w-full space-y-2">
              {cliente.telefono && (
                <a
                  href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 font-medium bg-gray-50 hover:bg-green-50 hover:text-green-700 p-3 rounded-2xl transition-colors group/link"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm shrink-0"><Phone className="w-4 h-4 text-indigo-500" /></div>
                  <span className="text-sm truncate">{cliente.telefono}</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
              )}
              {cliente.email && (
                <div className="flex items-center gap-3 text-gray-600 font-medium bg-gray-50 p-3 rounded-2xl">
                  <div className="p-2 bg-white rounded-xl shadow-sm shrink-0"><Mail className="w-4 h-4 text-indigo-500" /></div>
                  <span className="text-sm truncate">{cliente.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account balance card */}
          <div className={`rounded-3xl border p-7 flex flex-col items-center text-center relative overflow-hidden
            ${tieneDeuda ? "bg-red-50 border-red-100" : saldoAFavor ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
            <CreditCard className={`w-8 h-8 mb-3 ${tieneDeuda ? "text-red-400" : saldoAFavor ? "text-emerald-500" : "text-slate-400"}`} />
            <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">
              {tieneDeuda ? "Saldo Pendiente" : saldoAFavor ? "Saldo a Favor" : "Estado de Cuenta"}
            </p>
            <p className={`text-5xl font-black tracking-tighter
              ${tieneDeuda ? "text-red-700" : saldoAFavor ? "text-emerald-700" : "text-slate-500"}`}>
              ${Math.abs(saldo).toLocaleString("es-AR")}
            </p>
            <p className="text-sm font-bold opacity-60 mt-2">
              {tieneDeuda ? "Debe a la lavandería" : saldoAFavor ? "La lavandería le debe" : "Cuentas al día ✓"}
            </p>
          </div>

        </div>

        {/* ── RIGHT: KPIs + Chart + Table ─────────────────────── */}
        <div className="stagger-in lg:col-span-2 space-y-5 flex flex-col">

          {/* KPIs row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DashboardKpi
              title="Total Gastado"
              value={`$${totalGastado.toLocaleString("es-AR")}`}
              backMessage="Suma histórica de todos sus pedidos"
              colorVariant="blue"
            />
            <DashboardKpi
              title="Pedidos Totales"
              value={totalPedidos}
              backMessage="Cantidad de tickets generados en total"
              colorVariant="purple"
            />
            <DashboardKpi
              title="Ticket Promedio"
              value={`$${ticketPromedio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
              backMessage="Valor promedio por pedido"
              colorVariant="orange"
            />
            <DashboardKpi
              title="Pedidos Activos"
              value={pedidosActivos}
              backMessage="Pedidos pendientes o en proceso"
              colorVariant={pedidosActivos > 0 ? "green" : "blue"}
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-gray-900">Consumo a lo largo del tiempo</h3>
            </div>
            <div className="h-[200px]">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "1rem", border: "none", boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)", fontSize: 13 }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString("es-AR")}`, "Monto"]}
                      labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gradTotal)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingBag className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-sm font-medium">Sin suficientes datos para graficar</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs: Pedidos | Movimientos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors
                  ${activeTab === "pedidos" ? "text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/40" : "text-gray-400 hover:text-gray-700"}`}
                onClick={() => setActiveTab("pedidos")}
              >
                <ShoppingBag className="w-4 h-4" />
                Pedidos ({(cliente.pedidos || []).length})
              </button>
              <button
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors
                  ${activeTab === "movimientos" ? "text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/40" : "text-gray-400 hover:text-gray-700"}`}
                onClick={() => setActiveTab("movimientos")}
              >
                <History className="w-4 h-4" />
                Movimientos ({(cliente.movimientosCuentaCorriente || []).length})
              </button>
            </div>

            <div className="overflow-auto max-h-[360px]">
              {/* Tab: Pedidos */}
              {activeTab === "pedidos" && (
                <div>
                  <div className="flex justify-end p-2 bg-gray-50 border-b border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full px-4"
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
                      Gestionar pedidos en la tabla principal &rarr;
                    </Button>
                  </div>
                  <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Código</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Pago</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Total</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(cliente.pedidos || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <ShoppingBag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm font-medium">Sin pedidos registrados</p>
                        </td>
                      </tr>
                    ) : (
                      (cliente.pedidos || []).map((p: any) => {
                        const estadoInfo = PEDIDO_ESTADO[p.estado] || { label: p.estado, color: "bg-gray-50 text-gray-500 border-gray-100", icon: Package }
                        const EstadoIcon = estadoInfo.icon
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                            onClick={() => router.push(`/admin/pedidos/${p.id}`)}
                          >
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-indigo-600 group-hover:underline font-mono text-xs">
                                #{p.codigoSeguimiento || p.id}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${estadoInfo.color}`}>
                                <EstadoIcon className="w-3 h-3" />
                                {estadoInfo.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border w-fit ${p.cobrado ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                  {p.cobrado ? "Cobrado" : "Pendiente"}
                                </span>
                                {p.pago && (
                                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                    {p.pago.metodoPago?.nombre || "Efectivo"}
                                    {parseFloat(p.pago.montoAFavorGenerado || "0") > 0 && (
                                      <span className="ml-1 text-emerald-600 font-bold">(+${parseFloat(p.pago.montoAFavorGenerado).toLocaleString("es-AR")} a favor)</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-gray-800">
                              ${parseFloat(p.total || "0").toLocaleString("es-AR")}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                              {formatDistanceToNow(parseISO(p.createdAt), { addSuffix: true, locale: es })}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
                </div>
              )}

              {/* Tab: Movimientos */}
              {activeTab === "movimientos" && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Monto</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Saldo Resultante</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Detalle</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(cliente.movimientosCuentaCorriente || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm font-medium">Sin movimientos registrados</p>
                        </td>
                      </tr>
                    ) : (
                      (cliente.movimientosCuentaCorriente || []).map((m: any) => (
                        <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <MovimientoChip tipo={m.tipoMovimiento} />
                          </td>
                          <td className={`px-5 py-3.5 font-black text-sm ${m.tipoMovimiento === "DEBITO" ? "text-red-600" : "text-emerald-600"}`}>
                            {m.tipoMovimiento === "DEBITO" ? "+" : "-"}${parseFloat(m.monto || "0").toLocaleString("es-AR")}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-gray-500 text-xs">
                            ${parseFloat(m.saldoResultante || "0").toLocaleString("es-AR")}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[160px] truncate">
                            {m.comentario || "—"}
                            {m.pedidoId && (
                              <a 
                                href={`/admin/pedidos/${m.pedidoId}`} 
                                className="inline-flex items-center gap-1 ml-2 text-brand-blue hover:underline font-bold"
                              >
                                Ver Pedido
                              </a>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">
                            {format(parseISO(m.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
