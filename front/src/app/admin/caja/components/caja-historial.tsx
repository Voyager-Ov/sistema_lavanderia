"use client"

import React, { useState, useEffect, useMemo } from "react"
import { CajaActual, obtenerHistorialCajas } from "@/domains/caja/caja.api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, ChevronRight, User, Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2 } from "lucide-react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { Badge } from "@/shared/ui/data-display/badge"
import { formatCurrency } from "@/shared/lib/utils"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/shared/ui/forms/button"
import { useSocket } from "@/shared/hooks/useSocket"

export function CajaHistorial() {
  const [cajas, setCajas] = useState<CajaActual[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(-1)
  const router = useRouter()
  const tableRef = React.useRef<HTMLDivElement>(null)

  const { socket } = useSocket()

  useEffect(() => {
    fetchHistorial()
  }, [pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      fetchHistorial(false)
    }

    socket.on("caja_actualizada", handleUpdate)
    socket.on("pago_registrado", handleUpdate)
    socket.on("pago_anulado", handleUpdate)

    return () => {
      socket.off("caja_actualizada", handleUpdate)
      socket.off("pago_registrado", handleUpdate)
      socket.off("pago_anulado", handleUpdate)
    }
  }, [socket, pagination.pageIndex, pagination.pageSize])

  const fetchHistorial = async (showLoading = true) => {
    try {
      if (showLoading && cajas.length === 0) setIsLoading(true)
      const limit = pagination.pageSize
      const offset = pagination.pageIndex * pagination.pageSize
      const res = await obtenerHistorialCajas({ limit, offset })
      setCajas(res.items)
      setPageCount(Math.ceil(res.total / limit))
    } catch (error) {
      console.error("Error al cargar historial", error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  useGSAP(() => {
    if (!isLoading && cajas.length > 0) {
      gsap.fromTo(
        ".historial-container",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" }
      )
      // Animación en cascada para las filas de la tabla
      gsap.fromTo(
        ".rt-tr-group", // Clase interna que suele usar react-table o el data-table
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.1 }
      )
    }
  }, [isLoading])

  const columns = useMemo<ColumnDef<CajaActual, any>[]>(() => [
    {
      accessorKey: "fechaApertura",
      header: "Turno",
      meta: { className: "w-[25%]" },
      cell: ({ row }) => {
        const caja = row.original
        const isAbierta = caja.estado === "ABIERTA"
        
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isAbierta ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-500'}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {format(new Date(caja.fechaApertura), "dd MMM, yyyy", { locale: es })}
                </span>
                {isAbierta ? (
                  <Badge variant="default" className="text-[9px] uppercase tracking-wider py-0 px-1.5 bg-brand-blue h-4">Actual</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wider py-0 px-1.5 h-4">Cerrada</Badge>
                )}
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <User className="w-3 h-3" />
                {caja.usuario?.nombre || `Usuario #${caja.usuarioId}`}
              </span>
            </div>
          </div>
        )
      }
    },
    {
      id: "horarios",
      header: "Horarios",
      meta: { className: "w-[25%]" },
      cell: ({ row }) => {
        const caja = row.original
        return (
          <div className="flex flex-col gap-1 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Apertura: {format(new Date(caja.fechaApertura), "HH:mm 'hs'")}
            </span>
            {caja.fechaCierre ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Cierre: {format(new Date(caja.fechaCierre), "HH:mm 'hs'")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400 italic">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                En curso...
              </span>
            )}
          </div>
        )
      }
    },
    {
      id: "movimientos",
      header: "Movimientos",
      meta: { className: "w-[30%]" },
      cell: ({ row }) => {
        const caja = row.original
        const ingresos = Number(caja.totalIngresosEnVivo || 0)
        const egresos = Number(caja.totalEgresosEnVivo || 0)
        return (
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Inicial
              </span>
              <span className="font-semibold text-slate-700 text-sm tabular-nums">{formatCurrency(Number(caja.montoInicial))}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-500/80 font-bold uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> In
              </span>
              <span className="font-semibold text-slate-700 text-sm tabular-nums">{formatCurrency(ingresos)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-500/80 font-bold uppercase flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Out
              </span>
              <span className="font-semibold text-slate-700 text-sm tabular-nums">{formatCurrency(egresos)}</span>
            </div>
          </div>
        )
      }
    },
    {
      id: "total",
      header: "Efectivo Final",
      meta: { className: "w-[15%]" },
      cell: ({ row }) => {
        const caja = row.original
        const isAbierta = caja.estado === "ABIERTA"
        const montoFinal = isAbierta ? caja.efectivoEsperadoEnVivo : (caja.efectivoReal ?? caja.efectivoEsperadoEnVivo ?? 0)
        
        return (
          <div className="flex flex-col items-start justify-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {isAbierta ? 'En Vivo' : 'Cierre'}
            </span>
            <span className="font-black text-slate-900 text-base tabular-nums">
              {formatCurrency(Number(montoFinal || 0))}
            </span>
          </div>
        )
      }
    },
    {
      id: "acciones",
      header: "",
      meta: { className: "w-[5%]" },
      cell: ({ row }) => {
        return (
          <div className="flex justify-end pr-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="w-8 h-8 rounded-full hover:bg-slate-100 hover:text-brand-blue"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/caja/${row.original.id}`);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )
      }
    }
  ], [router])

  return (
    <div className="historial-container" ref={tableRef}>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Historial de Cajas</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Busca, filtra y revisa turnos anteriores y arqueos.</p>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={cajas}
            isFetching={isLoading}
            searchPlaceholder="Buscar por usuario o fecha..."
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            // Server side pagination config
            manualPagination={true}
            pagination={pagination}
            onPaginationChange={setPagination}
            pageCount={pageCount}
            manualSorting={false}
            manualFiltering={false}
          />
        </div>
      </div>
    </div>
  )
}
