"use client"

import React, { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { Plus, Download, Play, Loader2, Trophy } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

// Import Dashboard API
import { getDashboardStats, DashboardStatsResponse } from "@/domains/dashboard/api"
import { obtenerCajaActual, CajaActual } from "@/domains/caja/caja.api"
import { getPedidos } from "@/domains/pedidos/api"
import { toast } from "sonner"
import { format, isBefore, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { RegistrarGastoModal } from "@/app/admin/caja/components/registrar-gasto-modal"

// Import new Dashboard Components
import { DashboardKpi } from "@/shared/ui/dashboard/dashboard-kpi"
import { DashboardBarChart } from "@/shared/ui/dashboard/dashboard-bar-chart"
import { DashboardGauge } from "@/shared/ui/dashboard/dashboard-gauge"
import { DashboardListCard, DashboardListItem } from "@/shared/ui/dashboard/dashboard-list-card"
import { DashboardActionCard } from "@/shared/ui/dashboard/dashboard-action-card"
import { formatCurrency } from "@/shared/lib/utils"

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [caja, setCaja] = useState<CajaActual | null>(null)
  const [alertas, setAlertas] = useState<DashboardListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false)

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
        getPedidos({ estado: 'PENDIENTE', limit: 5, sortBy: 'fechaEntregaEstimada', sortOrder: 'asc' }).catch(() => null)
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

  const handleRetiroClick = () => {
    if (!caja) {
      toast.error("Debes abrir un turno (caja) antes de registrar un retiro.")
      return
    }
    setIsGastoModalOpen(true)
  }

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
          value={(stats.pedidosDelDia.hoy || 0).toString()} 
          trendValue={incrementPedidos} 
          subtitle="Incremento vs ayer"
          backMessage="Total de pedidos recibidos durante el día de hoy en todas las sucursales."
          href="/admin/pedidos"
          variant="active"
        />
        <DashboardKpi 
          title="Ingresos Hoy" 
          value={formatCurrency(stats.ingresos.hoyCobrado || 0)}
          trendValue={incrementIngresos} 
          subtitle="Cobrado vs ayer"
          backMessage={`Dinero en mano hoy. Potencial del día si se cobra todo: ${formatCurrency(stats.ingresos.hoyTotalPedidos || 0)}`}
          href="/admin/caja"
        />
        <DashboardKpi 
          title="Servicios Activos" 
          value={(stats.pedidosActivos.EN_PROCESO || 0).toString()} 
          subtitle="Pedidos en proceso"
          backMessage="Lavadoras, secadoras o planchas que actualmente están procesando un pedido."
          href="/admin/servicios"
        />
        <DashboardKpi 
          title="Entregas Pend." 
          value={(stats.pedidosActivos.LISTO_PARA_RETIRAR || 0).toString()} 
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
            title="Estado de Caja" 
            mainText={caja ? 'Turno en Curso' : 'Caja Cerrada'} 
            subText={caja ? `Efectivo: ${formatCurrency(stats.ingresos.hoyCobrado)}` : 'Abre un turno para operar'} 
            buttonText={caja ? 'Ver Caja' : 'Abrir Caja'} 
            buttonIcon={<Play className="w-5 h-5 fill-current" />}
            color="yellow"
            className="h-full"
            onButtonClick={() => router.push('/admin/caja')}
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
        <div className="xl:col-span-7">
          <DashboardListCard 
            title="Alertas (Pendientes)" 
            actionButtonText="Ir a Pedidos"
            onActionClick={() => router.push('/admin/pedidos?estado=PENDIENTE')}
            items={alertas.length > 0 ? alertas : [{
              id: "empty",
              title: "Todo al día",
              subtitle: "No hay pedidos pendientes urgentes",
              badgeText: "OK",
              badgeColor: "green"
            }]}
            className="h-full max-h-[350px]"
          />
        </div>
        <div className="xl:col-span-5">
          <DashboardGauge 
            title="Progreso del Día" 
            currentValue={progresoActual} 
            targetValue={metaDiaria}
            subtitle="Pedidos entregados vs recibidos hoy"
            color="green"
            className="h-full"
          />
        </div>
      </div>

      {/* Modals */}
      <RegistrarGastoModal 
        open={isGastoModalOpen}
        onOpenChange={setIsGastoModalOpen}
        onSuccess={fetchStats}
      />
    </div>
  )
}
