"use client"

import React, { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Pedido, getPedidos, cambiarEstadoPedido } from "@/domains/pedidos/api"
import { getDashboardStats, DashboardStatsResponse } from "@/domains/dashboard/api"
import { KpiCard as DashboardKpi } from "@/shared/ui/data-display/kpi-card"
import { Input } from "@/shared/ui/forms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Button } from "@/shared/ui/forms/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/overlays/popover"
import { Calendar as CalendarIcon, Download, Search, CheckCircle } from "lucide-react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { getPedidoColumns } from "./components/pedido-columns"
import { CancelOrderSheet } from "./components/cancel-order-sheet"
import { BulkAction } from "@/shared/ui/data-display/data-table-bulk-actions"
import { useRouter } from "next/navigation"
import { SortingState } from "@tanstack/react-table"

export default function PedidosPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("TODOS")
  
  // Advanced filters state
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  
  // Pagination & Sorting state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  // DataTable uses state { id: "colName", desc: boolean }[]
  const [sorting, setSorting] = useState<SortingState>([])

  // Cancel order state
  const [pedidoToCancel, setPedidoToCancel] = useState<Pedido | null>(null)
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false)

  // Loading row state (for optimistic updates)
  const [loadingRowIds, setLoadingRowIds] = useState<string[]>([])
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  gsap.registerPlugin(useGSAP)

  const fetchOrdersAndStats = async () => {
    setIsLoading(true)
    try {
      const queryParams: any = {
        estado: activeFilter !== "TODOS" ? activeFilter : undefined,
        search: searchTerm || undefined,
        limit: pagination.pageSize,
        page: pagination.pageIndex + 1
      }
      
      if (fechaInicio) queryParams.fechaInicio = fechaInicio;
      if (fechaFin) queryParams.fechaFin = fechaFin;
      
      if (sorting.length > 0) {
        queryParams.sortBy = sorting[0].id
        queryParams.sortOrder = sorting[0].desc ? "desc" : "asc"
      }

      const [pedidosRes, statsRes] = await Promise.allSettled([
        getPedidos(queryParams),
        getDashboardStats()
      ])

      if (pedidosRes.status === "fulfilled" && pedidosRes.value) {
        setPedidos(pedidosRes.value.data?.items || [])
        const { totalItems, totalPages, currentPage } = pedidosRes.value.data?.meta || { totalItems: 0, totalPages: 0, currentPage: 1 }
        setTotalItems(totalItems)
        setTotalPages(totalPages)
        setPagination(prev => ({
          ...prev,
          pageIndex: currentPage - 1
        }))
      } else {
        console.error("Error cargando pedidos", pedidosRes)
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value)
      } else {
        console.error("Error cargando stats", statsRes)
      }

    } catch (error) {
      console.error("Error fetching pedidos data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to load when filter, date, pagination, sorting changes
  // Used debounce internally for searching
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrdersAndStats()
    }, 300)
    return () => clearTimeout(handler)
  }, [activeFilter, fechaInicio, fechaFin, pagination.pageIndex, pagination.pageSize, sorting, searchTerm])

  // Animations
  useGSAP(() => {
    const items = gsap.utils.toArray('.fade-item')
    if (items.length > 0) {
      gsap.fromTo(items, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      )
    }
  }, { scope: containerRef, dependencies: [pedidos] })

  const handleStatusChange = async (pedidoId: number, nuevoEstado: string) => {
    const rowId = pedidoId.toString()
    setLoadingRowIds(prev => [...prev, rowId])
    setRowErrors(prev => {
      const { [rowId]: _, ...rest } = prev
      return rest
    })

    try {
      await cambiarEstadoPedido(pedidoId, nuevoEstado)
      // Update local state without full reload
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado as any } : p))
      
      getDashboardStats().then(setStats).catch(console.error)
    } catch (error: any) {
      console.error("Error al cambiar estado:", error)
      setRowErrors(prev => ({ 
        ...prev, 
        [rowId]: error.response?.data?.message || "Error al cambiar el estado" 
      }))
    } finally {
      setLoadingRowIds(prev => prev.filter(id => id !== rowId))
    }
  }

  const handleConfirmCancel = async (pedidoId: number, motivo: string, descripcion: string) => {
    const comentario = `Cancelado: ${motivo}. ${descripcion}`.trim()
    await cambiarEstadoPedido(pedidoId, "CANCELADO", comentario)
    fetchOrdersAndStats()
  }

  const columns = React.useMemo(() => getPedidoColumns({
    onView: (pedido) => router.push(`/admin/pedidos/${pedido.id}`),
    onEdit: (pedido) => router.push(`/admin/pedidos/editar/${pedido.id}`),
    onCancel: (pedido) => {
      setPedidoToCancel(pedido)
      setIsCancelSheetOpen(true)
    },
    onChangeStatus: handleStatusChange
  }), [])

  const bulkActions: BulkAction<Pedido>[] = [
    {
      label: "Marcar como Listos",
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: async (selectedRows) => {
        // En un caso real llamaríamos a un endpoint de bulk
        alert(`Acción masiva simulada: ${selectedRows.length} marcados como Listos`)
      }
    },
    {
      label: "Exportar CSV",
      icon: <Download className="h-4 w-4" />,
      onClick: (selectedRows) => alert("Exportando " + selectedRows.length + " filas")
    }
  ]

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6">

      <div className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="fade-item flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Pedidos</h1>
            <p className="text-gray-500 font-medium text-sm">Gestiona y haz seguimiento de todos los tickets activos.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-xl h-12 font-bold text-gray-700 bg-white border-2 border-gray-100 shadow-sm gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Filtrar por Fecha
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-2xl" align="end">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900">Rango de fechas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Desde</label>
                      <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="h-10 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Hasta</label>
                      <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="h-10 text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => { setFechaInicio(""); setFechaFin(""); }}>Limpiar</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button className="rounded-xl h-12 px-6 shadow-sm hover:shadow-md transition-all font-bold gap-2">
              <span className="text-lg leading-none">+</span> Crear Nuevo Pedido
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="fade-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardKpi title="Total Facturado (Hoy)" value={`$${(stats.ingresos?.hoyTotalPedidos || 0).toLocaleString("es-AR")}`} trend="up" subtitle="Ingresos en caja hoy" />
            <DashboardKpi title="Pedidos Pendientes" value={(stats.pedidosActivos?.PENDIENTE || 0).toString()} trend="neutral" subtitle="A la espera de iniciar" highlight="blue" />
            <DashboardKpi title="En Proceso" value={(stats.pedidosActivos?.EN_PROCESO || 0).toString()} trend="neutral" subtitle="Lavando/Secando ahora" />
            <DashboardKpi title="Listos para Retirar" value={(stats.pedidosActivos?.LISTO_PARA_RETIRAR || stats.pedidosActivos?.LISTO || 0).toString()} trend="neutral" subtitle="Avisar a clientes" highlight="blue" />
          </div>
        )}

        {/* DataTable */}
        <div className="fade-item relative z-0">
          <DataTable
            columns={columns}
            data={pedidos}
            loadingRowIds={loadingRowIds}
            rowErrors={rowErrors}
            onClearRowError={(id) => setRowErrors(prev => { const newObj = {...prev}; delete newObj[id]; return newObj; })}
            
            // Integracion con buscador interno de DataTable
            searchPlaceholder="Buscar por cliente o ticket..."
            globalFilter={searchTerm}
            onGlobalFilterChange={(val) => { setSearchTerm(val); setPagination(p => ({ ...p, pageIndex: 0 })) }}
            
            // Filtros extras en la barra de herramientas
            toolbarExtras={
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 hidden sm:inline-block">Estado:</span>
                <Select
                  value={activeFilter}
                  onValueChange={(val) => { setActiveFilter(val); setPagination(p => ({ ...p, pageIndex: 0 })) }}
                >
                  <SelectTrigger className="w-[180px] h-9 text-xs rounded-full bg-white shadow-sm font-bold border-gray-200">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                    <SelectItem value="LISTO_PARA_RETIRAR">Listo para Retirar</SelectItem>
                    <SelectItem value="ENTREGADO">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }

            // Server pagination props
            manualPagination={true}
            pageCount={totalPages}
            pagination={pagination}
            onPaginationChange={setPagination}
            
            // Server sorting props
            manualSorting={true}
            sorting={sorting}
            onSortingChange={setSorting}
            
            bulkActions={bulkActions}
          />
        </div>
      </div>
      
      <CancelOrderSheet 
        pedido={pedidoToCancel}
        open={isCancelSheetOpen}
        onOpenChange={setIsCancelSheetOpen}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
