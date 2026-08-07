"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ResponsiveSheet, 
  ResponsiveSheetContent, 
  ResponsiveSheetHeader, 
  ResponsiveSheetTitle, 
  ResponsiveSheetDescription 
} from "@/shared/ui/overlays/responsive-sheet"
import { CajaActual, obtenerCajaPorId } from "@/domains/caja/caja.api"
import { formatCurrency } from "@/shared/lib/utils"
import { 
  Wallet, 
  Clock, 
  User, 
  Phone, 
  ExternalLink, 
  Receipt, 
  Search, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Banknote,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Scale,
  Sparkles,
  CheckCircle2,
  Calendar,
  X
} from "lucide-react"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Skeleton } from "@/shared/ui/feedback/skeleton"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

interface CajaDetalleSheetProps {
  cajaId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TabType = "todos" | "cobros" | "gastos"

const ESTADOS_PEDIDO: Record<string, { label: string; badgeClass: string }> = {
  PENDIENTE: { 
    label: "Pendiente", 
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20" 
  },
  EN_PROCESO: { 
    label: "En Proceso", 
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20" 
  },
  LISTO_PARA_RETIRAR: { 
    label: "Listo", 
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20" 
  },
  ENTREGADO: { 
    label: "Entregado", 
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border-purple-200 dark:border-purple-500/20" 
  },
  CANCELADO: { 
    label: "Cancelado", 
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20" 
  }
}

export function CajaDetalleSheet({ cajaId, open, onOpenChange }: CajaDetalleSheetProps) {
  const router = useRouter()
  const [caja, setCaja] = useState<CajaActual | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [showArqueoDetail, setShowArqueoDetail] = useState(false)
  const listContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && cajaId) {
      fetchCajaDetalle(cajaId)
    } else if (!open) {
      setCaja(null)
      setError(null)
      setSearchQuery("")
      setActiveTab("todos")
      setShowArqueoDetail(false)
    }
  }, [open, cajaId])

  const fetchCajaDetalle = async (id: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await obtenerCajaPorId(id)
      setCaja(data)
    } catch (err: any) {
      console.error("Error al obtener detalle de la caja:", err)
      setError(err.message || "No se pudo cargar la información de la caja.")
    } finally {
      setIsLoading(false)
    }
  }

  useGSAP(() => {
    if (!isLoading && caja && listContainerRef.current) {
      gsap.fromTo(
        listContainerRef.current.querySelectorAll(".tx-item-anim"),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: "power2.out", clearProps: "all" }
      )
    }
  }, { scope: listContainerRef, dependencies: [isLoading, caja, activeTab, searchQuery] })

  const todosMovimientos = useMemo(() => {
    if (!caja) return []

    const items: Array<{
      id: string
      tipo: "COBRO" | "GASTO"
      fecha: Date
      monto: number
      metodoPago: string
      pagoOriginal?: any
      gastoOriginal?: any
    }> = []

    caja.pagos?.forEach((p) => {
      items.push({
        id: `pago-${p.id}`,
        tipo: "COBRO",
        fecha: new Date(p.createdAt || (p as any).fechaPago),
        monto: Number(p.monto || 0),
        metodoPago: p.metodoPago?.nombre || "Desconocido",
        pagoOriginal: p
      })
    })

    caja.gastos?.forEach((g) => {
      items.push({
        id: `gasto-${g.id}`,
        tipo: "GASTO",
        fecha: new Date(g.createdAt || (g as any).fecha),
        monto: Number(g.monto || 0),
        metodoPago: g.metodoPago?.nombre || "Efectivo",
        gastoOriginal: g
      })
    })

    return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }, [caja])

  const movimientosFiltrados = useMemo(() => {
    let result = todosMovimientos

    if (activeTab === "cobros") {
      result = result.filter((m) => m.tipo === "COBRO")
    } else if (activeTab === "gastos") {
      result = result.filter((m) => m.tipo === "GASTO")
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((m) => {
        if (m.tipo === "COBRO") {
          const p = m.pagoOriginal
          const cliente = p?.pedido?.cliente?.nombre?.toLowerCase() || ""
          const pedidoId = p?.pedidoId ? String(p.pedidoId) : ""
          const codigo = p?.pedido?.codigoSeguimiento?.toLowerCase() || ""
          const metodo = m.metodoPago.toLowerCase()
          return cliente.includes(q) || pedidoId.includes(q) || codigo.includes(q) || metodo.includes(q)
        } else {
          const g = m.gastoOriginal
          const categoria = g?.categoria?.toLowerCase() || ""
          const desc = g?.descripcion?.toLowerCase() || ""
          const metodo = m.metodoPago.toLowerCase()
          return categoria.includes(q) || desc.includes(q) || metodo.includes(q)
        }
      })
    }

    return result
  }, [todosMovimientos, activeTab, searchQuery])

  const totalIngresos = Number(caja?.totalIngresosEnVivo || 0)
  const totalEgresos = Number(caja?.totalEgresosEnVivo || 0)
  const montoInicial = Number(caja?.montoInicial || 0)
  const isAbierta = caja?.estado === "ABIERTA"

  const efectivoEsperado = caja?.efectivoEsperado !== undefined && caja?.efectivoEsperado !== null
    ? Number(caja.efectivoEsperado)
    : Number(caja?.efectivoEsperadoEnVivo || (montoInicial + Number(caja?.totalIngresosEfectivo || 0) - Number(caja?.totalEgresosEfectivo || 0)))

  const efectivoReal = caja?.efectivoReal !== undefined && caja?.efectivoReal !== null
    ? Number(caja.efectivoReal)
    : null

  const diferencia = efectivoReal !== null ? (efectivoReal - efectivoEsperado) : null

  const formattedShiftRange = useMemo(() => {
    if (!caja?.fechaApertura) return ""
    const apertura = new Date(caja.fechaApertura)
    const aperturaStr = format(apertura, "dd/MM HH:mm 'hs'", { locale: es })
    if (caja.fechaCierre) {
      const cierreStr = format(new Date(caja.fechaCierre), "HH:mm 'hs'", { locale: es })
      return `${aperturaStr} → ${cierreStr}`
    }
    return `Iniciada ${aperturaStr} (En curso)`
  }, [caja])

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col bg-white dark:bg-[#0f1115] text-slate-900 dark:text-neutral-100 border-l border-slate-200 dark:border-neutral-800 p-0 shadow-2xl overflow-hidden">
        
        {/* Header Compacto y Elegante */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-neutral-800/80 bg-white dark:bg-[#0f1115]">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-neutral-50">
                  Caja #{cajaId || "—"}
                </h3>
                {caja && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    isAbierta
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400 border-slate-200 dark:border-neutral-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAbierta ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {caja.estado}
                  </span>
                )}
              </div>

              {caja && (
                <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">{caja.usuario?.nombre || "Cajero"}</span>
                  <span>•</span>
                  <span>{formattedShiftRange}</span>
                </p>
              )}
            </div>

            {caja && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs font-semibold h-8 px-3 gap-1 text-slate-600 dark:text-neutral-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  onOpenChange(false)
                  router.push(`/admin/caja/${caja.id}`)
                }}
              >
                <span>Ver Completa</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 space-y-3 p-6 overflow-y-auto">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-neutral-100 mb-1 text-sm">Error al cargar la caja</h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 rounded-full text-xs font-semibold"
              onClick={() => cajaId && fetchCajaDetalle(cajaId)}
            >
              Reintentar
            </Button>
          </div>
        ) : !caja ? null : (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-6 py-4">
            
            {/* Strip Resumen Financiero Compacto (1 sola barra moderna) */}
            <div className="bg-slate-50 dark:bg-neutral-900/70 rounded-2xl border border-slate-200/70 dark:border-neutral-800/80 p-3 shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-neutral-800 text-center">
                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cobros ({caja.pagos?.length || 0})</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight block mt-0.5">
                    +{formatCurrency(totalIngresos)}
                  </span>
                </div>

                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gastos ({caja.gastos?.length || 0})</span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight block mt-0.5">
                    -{formatCurrency(totalEgresos)}
                  </span>
                </div>

                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Diferencia</span>
                  <div className="mt-0.5">
                    {isAbierta ? (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">En vivo</span>
                    ) : diferencia !== null ? (
                      <span className={`text-xs font-black tabular-nums ${
                        diferencia === 0 
                          ? "text-slate-600 dark:text-neutral-300" 
                          : diferencia > 0 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {diferencia === 0 ? "$0" : `${diferencia > 0 ? "+" : ""}${formatCurrency(diferencia)}`}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón para ver/ocultar desglose detallado de arqueo y métodos */}
              <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  Monto inicial: <strong>{formatCurrency(montoInicial)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowArqueoDetail(!showArqueoDetail)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{showArqueoDetail ? "Ocultar arqueo" : "Ver arqueo"}</span>
                  {showArqueoDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Sección desplegable de arqueo */}
              {showArqueoDetail && (
                <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-neutral-800/60 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-neutral-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-neutral-700/50">
                    <div>
                      <span className="text-slate-400 block">Efectivo Esperado:</span>
                      <strong className="text-slate-800 dark:text-neutral-200 tabular-nums">{formatCurrency(efectivoEsperado)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Efectivo Declarado:</span>
                      <strong className="text-slate-800 dark:text-neutral-200 tabular-nums">
                        {efectivoReal !== null ? formatCurrency(efectivoReal) : "No cerrado"}
                      </strong>
                    </div>
                  </div>

                  {caja.totalesPorMetodo && caja.totalesPorMetodo.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Por Medio de Pago</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {caja.totalesPorMetodo.map((m) => (
                          <div 
                            key={m.metodoPagoId}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/50 text-[11px]"
                          >
                            <span className="text-slate-600 dark:text-neutral-300 font-medium">{m.nombre}</span>
                            <div className="font-bold tabular-nums">
                              <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(m.ingresos)}</span>
                              {m.egresos > 0 && (
                                <span className="text-rose-600 dark:text-rose-400 ml-1">-{formatCurrency(m.egresos)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Segmented Filter & Search */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200/70 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("todos")}
                  className={`flex-1 py-1 px-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "todos"
                      ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-50 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-neutral-400"
                  }`}
                >
                  Todos ({todosMovimientos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cobros")}
                  className={`flex-1 py-1 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === "cobros"
                      ? "bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-emerald-600 dark:text-neutral-400"
                  }`}
                >
                  Cobros ({caja.pagos?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gastos")}
                  className={`flex-1 py-1 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === "gastos"
                      ? "bg-white dark:bg-neutral-800 text-rose-700 dark:text-rose-400 shadow-xs"
                      : "text-slate-500 hover:text-rose-600 dark:text-neutral-400"
                  }`}
                >
                  Gastos ({caja.gastos?.length || 0})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente o #pedido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 h-9 text-xs bg-slate-50 dark:bg-neutral-900/60 rounded-xl border-slate-200/80 dark:border-neutral-800 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista Ultra-Limpia de Movimientos */}
            <div ref={listContainerRef} className="space-y-2 pb-6">
              {movimientosFiltrados.length > 0 ? (
                movimientosFiltrados.map((mov) => {
                  if (mov.tipo === "COBRO") {
                    const pago = mov.pagoOriginal
                    const pedido = pago?.pedido
                    const cliente = pedido?.cliente
                    const estadoConfig = pedido?.estado ? ESTADOS_PEDIDO[pedido.estado] : null
                    const isZero = mov.monto === 0

                    return (
                      <div
                        key={mov.id}
                        className="tx-item-anim bg-white dark:bg-neutral-900/90 p-3 rounded-2xl border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-all shadow-xs flex items-center justify-between gap-3 group"
                      >
                        {/* Izquierda: Icono + Cliente & Metadatos */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isZero 
                              ? "bg-slate-100 dark:bg-neutral-800 text-slate-400"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          }`}>
                            <ArrowUpRight className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            {/* Fila 1: Nombre del Cliente */}
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                                {cliente?.nombre || "Cliente ocasional"}
                              </span>
                              {cliente?.telefono && (
                                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                                  {cliente.telefono}
                                </span>
                              )}
                            </div>

                            {/* Fila 2: Link al pedido, método, hora y badge */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                              {pago?.pedidoId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenChange(false)
                                    router.push(`/admin/pedidos/${pago.pedidoId}`)
                                  }}
                                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 bg-blue-50/80 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md"
                                >
                                  <span>#{pedido?.codigoSeguimiento || pago.pedidoId}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}

                              <span>•</span>
                              <span>{mov.metodoPago}</span>
                              <span>•</span>
                              <span>{format(mov.fecha, "HH:mm 'hs'")}</span>

                              {estadoConfig && (
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-semibold border ${estadoConfig.badgeClass}`}>
                                  {estadoConfig.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Derecha: Monto */}
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black tabular-nums ${
                            isZero 
                              ? "text-slate-400 dark:text-neutral-500" 
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            +{formatCurrency(mov.monto)}
                          </span>

                          {pago?.montoAFavorGenerado && Number(pago.montoAFavorGenerado) > 0 ? (
                            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(Number(pago.montoAFavorGenerado))} a favor
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )
                  } else {
                    // Gasto
                    const gasto = mov.gastoOriginal
                    return (
                      <div
                        key={mov.id}
                        className="tx-item-anim bg-white dark:bg-neutral-900/90 p-3 rounded-2xl border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-all shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                                {gasto?.descripcion || gasto?.categoria || "Egreso de caja"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                              <span className="font-semibold text-slate-700 dark:text-neutral-300">{gasto?.categoria || "General"}</span>
                              <span>•</span>
                              <span>{mov.metodoPago}</span>
                              <span>•</span>
                              <span>{format(mov.fecha, "HH:mm 'hs'")}</span>
                              {gasto?.registradoPor && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400">Por {gasto.registradoPor.nombre}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                            -{formatCurrency(mov.monto)}
                          </span>
                        </div>
                      </div>
                    )
                  }
                })
              ) : (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                    {searchQuery ? "Sin resultados para tu búsqueda" : "No hay movimientos registrados"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {searchQuery ? "Prueba buscando por otro término" : "No se registraron cobros ni gastos en este turno"}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}

export default CajaDetalleSheet
