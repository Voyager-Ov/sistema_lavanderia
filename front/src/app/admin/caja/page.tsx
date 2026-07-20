"use client"

import { useState, useEffect, useRef } from "react"
import { obtenerCajaActual, obtenerHistorialCajas, CajaActual } from "@/domains/caja/caja.api"
import { CajaDashboard } from "./components/caja-dashboard"
import { CajaHistorial } from "./components/caja-historial"
import { Skeleton } from "@/shared/ui/feedback/skeleton"
import { Wallet, TrendingUp, Hash, CalendarClock } from "lucide-react"
import { KpiCard } from "@/shared/ui/data-display/kpi-card"
import { AbrirCajaForm } from "./components/abrir-caja-form"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { formatCurrency } from "@/shared/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useSocket } from "@/shared/hooks/useSocket"

export default function CajaPage() {
  const [caja, setCaja] = useState<CajaActual | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { socket } = useSocket()

  useEffect(() => {
    fetchCaja()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      fetchCaja(false)
    }

    socket.on("caja_actualizada", handleUpdate)
    socket.on("pago_registrado", handleUpdate)
    socket.on("pago_anulado", handleUpdate)

    return () => {
      socket.off("caja_actualizada", handleUpdate)
      socket.off("pago_registrado", handleUpdate)
      socket.off("pago_anulado", handleUpdate)
    }
  }, [socket])

  const fetchCaja = async (showLoading = true) => {
    try {
      if (showLoading && !caja) setIsLoading(true)
      const data = await obtenerCajaActual()
      setCaja(data)
    } catch (error) {
      setCaja(null)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  useGSAP(() => {
    const items = gsap.utils.toArray('.fade-in')
    if (items.length > 0) {
      gsap.fromTo(items,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "transform" }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading, caja] })

  const ultimaCaja = (caja as any)?.ultimaCajaCerrada ?? null

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6 w-full">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 fade-in">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Caja y Finanzas</h1>
          <p className="text-slate-500 mt-1">Gestiona los ingresos, egresos y el historial de tu turno.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8">

        {/* Turno Actual */}
        <section className="fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <Skeleton className="h-6 w-80 rounded-xl" />
                <Skeleton className="h-52 w-full rounded-3xl mt-4" />
              </div>
              <div className="lg:col-span-7 grid grid-cols-2 gap-4 content-start">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            </div>
          ) : caja ? (
            <CajaDashboard caja={caja} onRefresh={fetchCaja} />
          ) : (
            /* ── Estado vacío / Apertura de turno ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Izquierda: formulario */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <AbrirCajaForm onSuccess={fetchCaja} />
              </div>

              {/* Derecha: métricas del último cierre */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Resumen del último turno</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Último cierre — monto */}
                  <div onClick={() => ultimaCaja && router.push(`/admin/caja/${ultimaCaja.id}`)}>
                    <KpiCard
                      title="Último Cierre"
                      value={ultimaCaja ? formatCurrency(ultimaCaja.efectivoReal ?? ultimaCaja.efectivoEsperadoEnVivo ?? 0) : "—"}
                      description="Efectivo en caja"
                      backMessage="Este es el efectivo físico reportado o esperado al cerrar el último turno. Haz clic aquí para ver más detalles del turno."
                      colorVariant="blue"
                    />
                  </div>

                  {/* Ingresos último turno */}
                  <KpiCard
                    title="Ingresos"
                    value={ultimaCaja ? formatCurrency(ultimaCaja.totalIngresosEnVivo ?? 0) : "—"}
                    description="Último turno"
                    backMessage="Suma total de todos los pagos registrados durante el último turno operativo (efectivo y digitales)."
                    colorVariant="green"
                  />

                  {/* Turnos recientes */}
                  <KpiCard
                    title="Turnos Totales"
                    value={(caja as any)?.cantidadTurnos ?? 0}
                    description="Registrados en el sistema"
                    backMessage="Cantidad total de turnos que has guardado en tu historial."
                    colorVariant="purple"
                  />

                  {/* Fecha último turno */}
                  <KpiCard
                    title="Último turno"
                    value={ultimaCaja ? format(new Date(ultimaCaja.fechaApertura), "dd MMM") : "—"}
                    description={ultimaCaja ? format(new Date(ultimaCaja.fechaApertura), "HH:mm 'hs'") : "Sin registros"}
                    backMessage="Día y hora exactos de apertura del turno inmediatamente anterior al actual."
                    colorVariant="orange"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Historial */}
        <section className="fade-in">
          <CajaHistorial />
        </section>
      </div>
    </div>
  )
}
