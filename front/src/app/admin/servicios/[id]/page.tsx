"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { apiClient } from "@/shared/lib/api-client"
import {
  Loader2, ArrowLeft, Edit2, Tag, Clock, DollarSign,
  TrendingUp, ShoppingBag, BarChart3, Package, CheckCircle, XCircle, Calendar
} from "lucide-react"
import { Button } from "@/shared/ui/forms/button"
import { cn } from "@/shared/lib/utils"
import { toast } from "sonner"

gsap.registerPlugin(useGSAP)

const CATEGORY_COLORS: Record<number, string> = {}
const PALETTE = [
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-orange-100 text-orange-700 border-orange-200",
]

function getCategoryColor(id: number): string {
  if (!CATEGORY_COLORS[id]) {
    CATEGORY_COLORS[id] = PALETTE[id % PALETTE.length]
  }
  return CATEGORY_COLORS[id]
}

// Sparkline bar chart component
function MiniBarChart({ data, color = "#6366f1" }: { data: number[], color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-300"
          style={{
            height: `${Math.max((val / max) * 100, 4)}%`,
            backgroundColor: color,
            opacity: i === data.length - 1 ? 1 : 0.3 + (i / data.length) * 0.5,
          }}
        />
      ))}
    </div>
  )
}

// Price history sparkline
function PriceSparkline({ history }: { history: any[] }) {
  if (!history || history.length < 2) return null
  const prices = history.map((h: any) => Number(h.precio))
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const range = max - min || 1
  const width = 120
  const height = 36
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width
    const y = height - ((p - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {prices.map((p, i) => (
        <circle
          key={i}
          cx={(i / (prices.length - 1)) * width}
          cy={height - ((p - min) / range) * (height - 4) - 2}
          r={i === prices.length - 1 ? 3 : 2}
          fill={i === prices.length - 1 ? "#6366f1" : "#c7d2fe"}
        />
      ))}
    </svg>
  )
}

export default function ServicioDetallePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [servicio, setServicio] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Mock trend data (últimas 8 semanas) - se reemplaza con datos reales cuando el backend lo soporte
  const [pedidosTrend] = useState([3, 5, 4, 7, 6, 9, 8, 11])

  useGSAP(() => {
    if (!loading && servicio) {
      gsap.fromTo(".kpi-card",
        { autoAlpha: 0, y: 20, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: "back.out(1.4)", clearProps: "all" }
      )
      gsap.fromTo(".detail-section",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.2, ease: "power3.out", clearProps: "all" }
      )
    }
  }, { scope: containerRef, dependencies: [loading, servicio] })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled([
          apiClient.get(`/productos/${id}`),
          apiClient.get(`/productos/${id}/historial`),
        ])

        const sRes = results[0]
        const hRes = results[1]

        if (sRes.status === "fulfilled") {
          setServicio((sRes.value as any).data)
        } else {
          toast.error("Error al cargar el servicio")
        }

        if (hRes.status === "fulfilled") {
          const hData = (hRes.value as any).data
          setHistorial(Array.isArray(hData) ? hData : [])
        }
      } catch (err: any) {
        toast.error("Error al cargar el servicio: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchAll()
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
          <p className="text-sm font-medium text-gray-400">Cargando servicio...</p>
        </div>
      </div>
    )
  }

  if (!servicio) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
        <Package className="w-16 h-16 text-gray-200" />
        <p className="text-gray-500 font-medium">Servicio no encontrado</p>
        <Button variant="outline" onClick={() => router.push('/admin/servicios')}>Volver a Servicios</Button>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
  const imageUrl = servicio.imagenUrl
    ? (servicio.imagenUrl.startsWith('http') ? servicio.imagenUrl : `${baseUrl}${servicio.imagenUrl}`)
    : null

  const diasActivo = servicio.createdAt
    ? Math.floor((Date.now() - new Date(servicio.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div ref={containerRef} className="flex-1 flex flex-col gap-6 p-4 md:p-8 pt-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/admin/servicios')}
            className="mt-1 w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-500 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-gray-900">{servicio.nombre}</h1>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border",
                servicio.disponible
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              )}>
                {servicio.disponible
                  ? <><CheckCircle className="w-3 h-3" />Activo</>
                  : <><XCircle className="w-3 h-3" />Inactivo</>
                }
              </span>
              {servicio.categoria && (
                <span className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-bold border",
                  getCategoryColor(servicio.categoria.id)
                )}>
                  {servicio.categoria.nombre}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1 font-medium">
              {servicio.descripcion || "Sin descripción configurada"}
            </p>
          </div>
        </div>
        <Button
          className="rounded-xl px-5 font-bold shrink-0 shadow-sm"
          onClick={() => router.push(`/admin/servicios/${id}/editar`)}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Precio</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tight">
            ${Number(servicio.precioActual).toLocaleString("es-AR")}
          </p>
          {historial.length > 1 && (
            <p className="text-xs text-gray-400 font-medium">
              Anterior: ${Number(historial[historial.length - 2]?.precio || 0).toLocaleString("es-AR")}
            </p>
          )}
        </div>

        <div className="kpi-card bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tiempo</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tight">
            {servicio.tiempoEstimadoMinutos || "—"}
          </p>
          {servicio.tiempoEstimadoMinutos && (
            <p className="text-xs text-gray-400 font-medium">minutos por unidad</p>
          )}
        </div>

        <div className="kpi-card bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Actividad</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="flex-1">
            <MiniBarChart data={pedidosTrend} color="#10b981" />
          </div>
          <p className="text-xs text-gray-400 font-medium">Pedidos — últimas 8 semanas</p>
        </div>

        <div className="kpi-card bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Antigüedad</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-violet-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{diasActivo}</p>
          <p className="text-xs text-gray-400 font-medium">
            días activo desde el {new Date(servicio.createdAt).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: image + historial */}
        <div className="space-y-4">
          {/* Imagen */}
          <div className="detail-section bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {imageUrl ? (
              <div className="h-52 w-full">
                <img
                  src={imageUrl}
                  alt={servicio.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="h-52 w-full bg-gray-50 flex flex-col items-center justify-center gap-3">
                <Package className="w-14 h-14 text-gray-200" />
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">Sin imagen</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => router.push(`/admin/servicios/${id}/editar`)}
                >
                  Agregar imagen
                </Button>
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Imagen POS</span>
              <button
                onClick={() => router.push(`/admin/servicios/${id}/editar`)}
                className="text-xs font-bold text-brand-blue hover:underline"
              >
                {imageUrl ? "Cambiar" : "Agregar"}
              </button>
            </div>
          </div>

          {/* Historial de precios */}
          <div className="detail-section bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-sm text-gray-700">Historial de Precios</span>
              </div>
              {historial.length > 1 && (
                <PriceSparkline history={historial} />
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {historial.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-400">Sin cambios de precio registrados</p>
                </div>
              ) : (
                historial.slice().reverse().slice(0, 6).map((h: any, i: number) => (
                  <div key={h.id || i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400">
                        {new Date(h.fechaCambio || h.createdAt).toLocaleDateString("es-AR")}
                      </p>
                      {h.motivo && (
                        <p className="text-[10px] text-gray-300 font-medium mt-0.5">{h.motivo}</p>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-black",
                      i === 0 ? "text-gray-900" : "text-gray-400"
                    )}>
                      ${Number(h.precio).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: detail info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Info detallada */}
          <div className="detail-section bg-white rounded-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-sm text-gray-700">Información del Servicio</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Nombre</p>
                <p className="font-bold text-gray-900">{servicio.nombre}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Categoría</p>
                {servicio.categoria ? (
                  <span className={cn(
                    "inline-flex px-2.5 py-1 rounded-xl text-xs font-bold border",
                    getCategoryColor(servicio.categoria.id)
                  )}>
                    {servicio.categoria.nombre}
                  </span>
                ) : (
                  <p className="font-medium text-gray-400 text-sm">Sin categoría</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Precio Actual</p>
                <p className="text-2xl font-black text-brand-blue">
                  ${Number(servicio.precioActual).toLocaleString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tiempo Estimado</p>
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-300" />
                  {servicio.tiempoEstimadoMinutos
                    ? `${servicio.tiempoEstimadoMinutos} minutos`
                    : "No configurado"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Estado</p>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border",
                  servicio.disponible
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                )}>
                  {servicio.disponible
                    ? <><CheckCircle className="w-3 h-3" />Activo</>
                    : <><XCircle className="w-3 h-3" />Inactivo</>
                  }
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Creado</p>
                <p className="font-semibold text-gray-700 text-sm">
                  {new Date(servicio.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
            </div>
            {servicio.descripcion && (
              <div className="px-6 pb-6 pt-0 border-t border-gray-50 mt-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 mt-4">Descripción</p>
                <p className="text-gray-600 font-medium text-sm leading-relaxed">{servicio.descripcion}</p>
              </div>
            )}
          </div>

          {/* Próximas métricas */}
          <div className="detail-section bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Analíticas del Servicio</p>
                <p className="text-xs text-gray-500">Métricas de uso y rendimiento</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Pedidos este mes", value: pedidosTrend[pedidosTrend.length - 1], suffix: "" },
                { label: "Ingresos est.", value: `$${(pedidosTrend[pedidosTrend.length - 1] * Number(servicio.precioActual)).toLocaleString("es-AR")}`, suffix: "" },
                { label: "Cambios de precio", value: historial.length, suffix: "" },
              ].map((metric, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-indigo-100">
                  <p className="text-lg font-black text-gray-900">{metric.value}{metric.suffix}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
