"use client"

import React, { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, CheckCircle, Clock, Info, Loader2, ListTodo } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { format, isBefore, addDays } from "date-fns"
import { es } from "date-fns/locale"

// Import APIs
import { getDashboardStats, DashboardStatsResponse } from "@/domains/dashboard/api"
import { obtenerCajaActual, CajaActual } from "@/domains/caja/caja.api"
import { getPedidos } from "@/domains/pedidos/api"

// Import Components
import { DashboardKpi } from "@/shared/ui/dashboard/dashboard-kpi"
import { DashboardListCard, DashboardListItem } from "@/shared/ui/dashboard/dashboard-list-card"
import { DashboardActionCard } from "@/shared/ui/dashboard/dashboard-action-card"
import { DashboardGauge } from "@/shared/ui/dashboard/dashboard-gauge"

export default function PosDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [caja, setCaja] = useState<CajaActual | null>(null)
  const [alertas, setAlertas] = useState<DashboardListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  gsap.registerPlugin(useGSAP)

  useGSAP(() => {
    if (!isLoading) {
      gsap.fromTo(".fade-up", 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out"
        }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading] })

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const [statsData, cajaData, pedidosData] = await Promise.all([
        getDashboardStats(),
        obtenerCajaActual().catch(() => null), // Retorna null si es 404/cerrada
        getPedidos({ estado: 'PENDIENTE', limit: 8, sortBy: 'fechaEntregaEstimada', sortOrder: 'asc' }).catch(() => null)
      ])
      setStats(statsData)
      setCaja(cajaData)
      
      if (pedidosData && pedidosData.data) {
        const hoy = new Date()
        setAlertas(pedidosData.data.items.map(p => {
          let badgeText = "NORMAL"
          let badgeColor: "red" | "yellow" | "blue" | "green" | "default" = "blue"
          let rightText = ""

          if (p.fechaEntregaEstimada) {
            const fechaEst = new Date(p.fechaEntregaEstimada)
            rightText = format(fechaEst, "dd MMM HH:mm", { locale: es })
            
            if (isBefore(fechaEst, hoy)) {
              badgeText = "VENCIDO"
              badgeColor = "red"
            } else if (isBefore(fechaEst, addDays(hoy, 1))) {
              badgeText = "HOY"
              badgeColor = "yellow"
            }
          }

          return {
            id: p.id,
            title: p.cliente?.nombre || 'Cliente Final',
            subtitle: `Ticket #${p.id} - ${p.items?.length || 0} items`,
            badgeText,
            badgeColor,
            rightText
          }
        }))
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-brand-blue" />
        <p className="text-lg font-medium">Cargando estado de la sucursal...</p>
      </div>
    )
  }

  // --- Transform Data for UI ---
  const recentOrdersList: DashboardListItem[] = stats.ultimosPedidos.map(p => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    badgeText: p.badgeText,
    badgeColor: p.badgeColor,
  }))

  // Calculations for employee productivity
  const incrementPedidos = stats.pedidosDelDia.hoy - stats.pedidosDelDia.ayer
  const listosYEntregados = stats.pedidosActivos.LISTO_PARA_RETIRAR + stats.pedidosActivos.ENTREGADO + stats.pedidosActivos.PAGADO
  const metaDiaria = stats.pedidosDelDia.hoy > 0 ? stats.pedidosDelDia.hoy : 1

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full pb-10 min-h-screen">
      
      {/* Header & Global Actions */}
      <div className="fade-up flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-neutral-50 tracking-tight leading-none mb-2 transition-colors">
            Resumen del Turno
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-neutral-400 transition-colors">
            Estado de los pedidos, entregas de hoy y tareas pendientes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/pos/terminal')}
            className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Row 1: Employee KPIs (No Financials) */}
      <div className="fade-up grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardKpi 
          title="Pedidos del Día" 
          value={(stats.pedidosDelDia.hoy || 0).toString()} 
          trendValue={incrementPedidos} 
          subtitle="Incremento vs ayer"
          backMessage="Total de pedidos que recibimos durante el día de hoy."
          href="/pos/pedidos"
          variant="active"
        />
        <DashboardKpi 
          title="Pendientes" 
          value={(stats.pedidosActivos.PENDIENTE || 0).toString()} 
          subtitle="Esperando proceso"
          backMessage="Ropa sucia o pedidos que aún no han empezado a lavarse."
          href="/pos/pedidos?filtro=pendientes"
        />
        <DashboardKpi 
          title="En Proceso" 
          value={(stats.pedidosActivos.EN_PROCESO || 0).toString()} 
          subtitle="Lavando / Secando"
          backMessage="Pedidos que están actualmente ocupando máquinas."
          href="/pos/pedidos?filtro=en_proceso"
        />
        <DashboardKpi 
          title="Listos p/ Entregar" 
          value={(stats.pedidosActivos.LISTO_PARA_RETIRAR || 0).toString()} 
          subtitle="Esperando cliente"
          backMessage="Pedidos terminados. Si el cliente llega, entrégalos y cóbralos."
          href="/pos/pedidos?filtro=listos"
        />
      </div>

      {/* Row 2: Status, Gauge, & Priorities */}
      <div className="fade-up grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 flex flex-col gap-6">
          <DashboardActionCard 
            title="Estado de tu Turno" 
            mainText={caja ? 'Turno en Curso' : 'Caja Cerrada'} 
            subText={caja ? `Abierto desde ${format(new Date(caja.fechaApertura), "HH:mm")}` : 'Recuerda abrir caja antes de operar'} 
            buttonText={caja ? 'Ir a la Caja' : 'Abrir Turno'} 
            buttonIcon={caja ? <ListTodo className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            color={caja ? "blue" : "yellow"}
            className="flex-1"
            onButtonClick={() => router.push('/pos/caja')}
          />
          <DashboardGauge 
            title="Progreso de Producción" 
            currentValue={listosYEntregados} 
            targetValue={metaDiaria}
            subtitle="Pedidos terminados vs recibidos hoy"
            color="green"
            className="flex-1"
          />
        </div>
        
        <div className="xl:col-span-4">
          <DashboardListCard 
            title="Prioridades (Pendientes)" 
            actionButtonText="Ver Todos"
            onActionClick={() => router.push('/pos/pedidos?estado=PENDIENTE')}
            items={alertas.length > 0 ? alertas : [{
              id: "empty",
              title: "Todo controlado",
              subtitle: "No hay tareas urgentes",
              badgeText: "OK",
              badgeColor: "green"
            }]}
            className="h-full min-h-[400px]"
          />
        </div>

        <div className="xl:col-span-4">
          <DashboardListCard 
            title="Recién Ingresados" 
            actionButtonText="Ir al Terminal"
            onActionClick={() => router.push('/pos/terminal')}
            items={recentOrdersList}
            className="h-full min-h-[400px]"
          />
        </div>
      </div>
    </div>
  )
}
