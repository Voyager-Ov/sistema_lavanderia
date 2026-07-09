"use client"

import React, { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { Plus, Download, Play, Loader2 } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

// Import Dashboard API
import { getDashboardStats, DashboardStatsResponse } from "@/domains/dashboard/api"

// Import new Dashboard Components
import { DashboardKpi } from "@/shared/ui/dashboard/dashboard-kpi"
import { DashboardBarChart } from "@/shared/ui/dashboard/dashboard-bar-chart"
import { DashboardGauge } from "@/shared/ui/dashboard/dashboard-gauge"
import { DashboardListCard, DashboardListItem } from "@/shared/ui/dashboard/dashboard-list-card"
import { DashboardActionCard } from "@/shared/ui/dashboard/dashboard-action-card"

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-brand-blue" />
        <p className="text-lg font-medium">Cargando estadísticas...</p>
      </div>
    )
  }

  // --- Transform Data for UI ---
  const barChartColors = [
    "var(--color-brand-blue)",
    "var(--color-brand-green)",
    "var(--color-brand-yellow)",
    "var(--color-brand-red)",
  ]

  const chartData = stats.ventasPorDia.map((d, index) => ({
    name: d.name,
    ventas: d.ventas,
    isSolid: index % 2 === 0, // Alternate solid vs striped
    color: barChartColors[index % barChartColors.length]
  }))

  const recentOrdersList: DashboardListItem[] = stats.ultimosPedidos.map(p => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    badgeText: p.badgeText,
    badgeColor: p.badgeColor,
  }))

  const topClientesList: DashboardListItem[] = stats.topClientes.map((c, i) => ({
    id: c.id,
    avatar: `https://i.pravatar.cc/150?u=client${c.id}`,
    title: c.nombre,
    subtitle: `${c.pedidos} Pedidos este mes`,
    badgeText: i === 0 ? "VIP" : "Frecuente",
    badgeColor: i === 0 ? "yellow" : "blue"
  }))

  // Calculations
  const incrementPedidos = stats.pedidosDelDia.hoy - stats.pedidosDelDia.ayer
  const incrementIngresos = stats.ingresos.hoyCobrado - stats.ingresos.ayerCobrado
  const progresoActual = stats.pedidosActivos.ENTREGADO + stats.pedidosActivos.PAGADO
  const metaDiaria = stats.pedidosDelDia.hoy > 0 ? stats.pedidosDelDia.hoy : 1 // avoid div by zero

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full pb-10 min-h-screen">
      
      {/* Header & Global Actions */}
      <div className="fade-up flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[2.5rem] font-bold text-gray-900 tracking-tight leading-none mb-2">
            Dashboard
          </h1>
          <p className="text-sm font-medium text-gray-500">Planifica, prioriza y cumple tus tareas con facilidad.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin/pedidos/nuevo')}
            className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Pedido
          </button>
          <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exportar Info
          </button>
        </div>
      </div>

      {/* Row 1: KPIs */}
      <div className="fade-up grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardKpi 
          title="Pedidos del Día" 
          value={stats.pedidosDelDia.hoy.toString()} 
          trendValue={incrementPedidos} 
          subtitle="Incremento vs ayer"
          backMessage="Total de pedidos recibidos durante el día de hoy en todas las sucursales."
          href="/admin/pedidos"
          variant="active"
        />
        <DashboardKpi 
          title="Ingresos Hoy" 
          value={`$${stats.ingresos.hoyCobrado.toLocaleString()}`} 
          trendValue={incrementIngresos} 
          subtitle="Cobrado vs ayer"
          backMessage={`Dinero en mano hoy. Potencial del día si se cobra todo: $${stats.ingresos.hoyTotalPedidos.toLocaleString()}`}
          href="/admin/caja"
        />
        <DashboardKpi 
          title="Servicios Activos" 
          value={stats.pedidosActivos.EN_PROCESO.toString()} 
          subtitle="Pedidos en proceso"
          backMessage="Lavadoras, secadoras o planchas que actualmente están procesando un pedido."
          href="/admin/servicios"
        />
        <DashboardKpi 
          title="Entregas Pend." 
          value={stats.pedidosActivos.LISTO.toString()} 
          subtitle="Listos para retirar"
          backMessage="Pedidos listos que el cliente debe retirar el día de hoy."
          href="/admin/pedidos?filtro=listos"
        />
      </div>

      {/* Row 2: Analytics, Actions, Projects */}
      <div className="fade-up grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5">
          <DashboardBarChart 
            title="Ingresos por Día ($)" 
            data={chartData} 
            dataKeyX="name" 
            dataKeyY="ventas"
            unit="$"
            className="h-full"
          />
        </div>
        <div className="xl:col-span-3">
          <DashboardActionCard 
            title="Acción Rápida" 
            mainText="Cerrar Caja" 
            subText="Finaliza el turno actual de forma segura" 
            buttonText="Hacer Arqueo" 
            buttonIcon={<Play className="w-5 h-5 fill-current" />}
            color="yellow"
            className="h-full"
            onButtonClick={() => router.push('/admin/caja/arqueo')}
          />
        </div>
        <div className="xl:col-span-4">
          <DashboardListCard 
            title="Últimos Pedidos" 
            actionButtonText="+ Nuevo"
            onActionClick={() => router.push('/admin/pedidos/nuevo')}
            items={recentOrdersList}
            className="h-full max-h-[350px]"
          />
        </div>
      </div>

      {/* Row 3: Team, Progress, Time Tracker */}
      <div className="fade-up grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5">
          <DashboardListCard 
            title="Mejores Clientes" 
            actionButtonText="Ver Todos"
            onActionClick={() => router.push('/admin/clientes')}
            items={topClientesList}
            className="h-full max-h-[350px]"
          />
        </div>
        <div className="xl:col-span-4">
          <DashboardGauge 
            title="Progreso del Día" 
            currentValue={progresoActual} 
            targetValue={metaDiaria}
            subtitle="Pedidos entregados vs recibidos hoy"
            color="green"
            className="h-full"
          />
        </div>
        <div className="xl:col-span-3">
          {/* Cash Register status */}
          <div className="bg-brand-red rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between border border-transparent shadow-sm relative overflow-hidden h-full min-h-[250px]">
            {/* Wavy background decoration */}
            <div className="absolute top-0 right-0 left-0 h-[100px] bg-red-900/20 blur-[20px] rounded-full -translate-y-1/2 scale-150 pointer-events-none"></div>
            
            <h3 className="text-base font-semibold text-red-50 relative z-10">Caja Actual (Hoy)</h3>
            
            <div className="relative z-10 flex flex-col items-center mt-4">
              <span className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
                ${stats.ingresos.hoyCobrado.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-red-200 mb-6">Efectivo en caja</span>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/admin/caja/ingreso')}
                  className="px-6 py-2 rounded-full bg-white text-brand-red font-bold shadow-md hover:scale-105 transition-transform"
                >
                  Ingreso
                </button>
                <button 
                  onClick={() => router.push('/admin/caja/retiro')}
                  className="px-6 py-2 rounded-full bg-white/20 text-white font-bold hover:scale-105 transition-transform"
                >
                  Retiro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
