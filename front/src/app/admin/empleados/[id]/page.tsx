"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { apiClient } from "@/shared/lib/api-client"
import { ArrowLeft, Wallet, TrendingUp, CreditCard, ChevronRight, Eye } from "lucide-react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { Button } from "@/shared/ui/forms/button"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"
import { CajaDetalleSheet } from "../components/caja-detalle-sheet"

export default function EmpleadoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [empleado, setEmpleado] = useState<any>(null)
  const [metricas, setMetricas] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCajaId, setSelectedCajaId] = useState<number | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleOpenCaja = (caja: any) => {
    setSelectedCajaId(caja.id)
    setIsSheetOpen(true)
  }

  useEffect(() => {
    if (!token || !params.id) return

    const fetchData = async () => {
      try {
        const [empRes, metRes] = await Promise.all([
          apiClient.get<any>(`/usuarios/${params.id}`),
          apiClient.get<any>(`/usuarios/${params.id}/metricas`)
        ])

        if (empRes.data) {
          setEmpleado(empRes.data)
        }
        if (metRes.data) {
          setMetricas(metRes.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, params.id])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full gap-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-32 w-full bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
      </div>
    )
  }

  if (!empleado) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center h-full">
        <p className="text-slate-500">Empleado no encontrado</p>
        <Button onClick={() => router.push("/admin/empleados")} variant="link" className="mt-4">
          Volver a empleados
        </Button>
      </div>
    )
  }

  const columnasCajas = [
    {
      accessorKey: "id",
      header: "Caja",
      cell: ({ row }: any) => (
        <span className="font-black text-slate-900 dark:text-neutral-100">
          #{row.original.id}
        </span>
      )
    },
    {
      accessorKey: "fechaApertura",
      header: "Apertura",
      cell: ({ row }: any) => (
        <span className="font-medium text-slate-700 dark:text-neutral-300">
          {new Date(row.original.fechaApertura).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
        </span>
      )
    },
    {
      accessorKey: "fechaCierre",
      header: "Cierre",
      cell: ({ row }: any) => row.original.fechaCierre ? (
        <span className="font-medium text-slate-700 dark:text-neutral-300">
          {new Date(row.original.fechaCierre).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
        </span>
      ) : <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs animate-pulse">En curso...</span>
    },
    {
      accessorKey: "montoInicial",
      header: "Monto Inicial",
      cell: ({ row }: any) => <span className="font-bold text-slate-700 dark:text-neutral-200 tabular-nums">${Number(row.original.montoInicial || 0).toLocaleString("es-AR")}</span>
    },
    {
      accessorKey: "diferenciaEfectivo",
      header: "Diferencia",
      cell: ({ row }: any) => {
        const diff = Number(row.original.diferenciaEfectivo || 0)
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tabular-nums ${diff < 0 ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border-red-200/60 dark:border-red-500/20" : diff > 0 ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20" : "text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 border-slate-200/60 dark:border-neutral-700"}`}>
            <span>{diff === 0 ? "$0" : `${diff > 0 ? "+" : ""}$${diff.toLocaleString("es-AR")}`}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }: any) => {
        const isAbierta = row.original.estado === 'ABIERTA'
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase ${
            isAbierta 
              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20" 
              : "text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800 border-slate-200/60 dark:border-neutral-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAbierta ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{row.original.estado}</span>
          </div>
        )
      }
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs font-semibold h-8 px-3 gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenCaja(row.original)
            }}
          >
            <span>Ver Movimientos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="fade-item flex-1 flex flex-col h-full gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => router.push("/admin/empleados")}
          variant="ghost"
          size="icon"
          className="rounded-full h-12 w-12 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400"
        >
          <ArrowLeft size={24} />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-neutral-50 mb-1">{empleado.nombre}</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
            <span>{empleado.email}</span>
            <span>•</span>
            <span className="uppercase tracking-wide text-xs">{empleado.rol}</span>
            <span>•</span>
            <span className={`uppercase tracking-wide text-xs ${empleado.activo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {empleado.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <DashboardKpi 
          isLoading={isLoading} 
          title="Ingresos Registrados" 
          value={`$${metricas?.ventasTotales?.monto?.toLocaleString("es-AR") || 0}`} 
          description={`${metricas?.ventasTotales?.cantidad || 0} cobros realizados`} 
          backMessage="Suma de cobros registrados por este empleado" 
          colorVariant="blue" 
        />
        <DashboardKpi 
          isLoading={isLoading} 
          title="Gastos Registrados" 
          value={`$${metricas?.gastosRegistrados?.monto?.toLocaleString("es-AR") || 0}`} 
          description={`${metricas?.gastosRegistrados?.cantidad || 0} gastos registrados`} 
          backMessage="Suma de gastos reportados por este empleado" 
          colorVariant="red" 
        />
        <DashboardKpi 
          isLoading={isLoading} 
          title="Cajas Operadas" 
          value={(metricas?.cajasOperadas?.length || 0).toString()} 
          description="Turnos completados" 
          backMessage="Historial de cajas abiertas y cerradas" 
          colorVariant="yellow" 
        />
      </div>

      {/* Tabla de Cajas */}
      <div className="relative z-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-neutral-50">Historial de Cajas</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Haz clic en cualquier caja para inspeccionar sus cobros, pedidos y egresos en detalle.</p>
          </div>
        </div>
        {metricas?.cajasOperadas?.length > 0 ? (
          <DataTable
            columns={columnasCajas as any}
            data={metricas.cajasOperadas}
            searchPlaceholder="Buscar caja..."
            onRowClick={handleOpenCaja}
          />
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800 border border-dashed border-slate-200 dark:border-neutral-700 rounded-2xl font-medium">
            El empleado aún no ha operado ninguna caja.
          </div>
        )}
      </div>

      {/* Side Sheet de Detalle de Caja */}
      <CajaDetalleSheet 
        cajaId={selectedCajaId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  )
}
