import { useState, useEffect } from "react"
import { SortingState } from "@tanstack/react-table"
import { Pedido, getPedidos } from "@/domains/pedidos/api"
import { getDashboardStats, DashboardStatsResponse } from "@/domains/dashboard/api"

export function usePedidosData() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [isTableFetching, setIsTableFetching] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("TODOS")
  
  // Advanced filters state
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  
  // Pagination & Sorting state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  // State restore flag
  const [isRestored, setIsRestored] = useState(false)

  const fetchOrders = async () => {
    setIsTableFetching(true)
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

      const pedidosRes = await getPedidos(queryParams).catch(e => { console.error("Error cargando pedidos", e); return null; })

      if (pedidosRes) {
        setPedidos(pedidosRes.data?.items || [])
        const { totalItems, totalPages, currentPage } = pedidosRes.data?.meta || { totalItems: 0, totalPages: 0, currentPage: 1 }
        setTotalItems(totalItems)
        setTotalPages(totalPages)
        setPagination(prev => ({
          ...prev,
          pageIndex: currentPage - 1
        }))
      }
    } catch (error) {
      console.error("Error fetching pedidos data:", error)
    } finally {
      setIsTableFetching(false)
    }
  }

  const fetchStats = async () => {
    setIsStatsLoading(true)
    try {
      const statsRes = await getDashboardStats().catch(e => { console.error("Error cargando stats", e); return null; })
      if (statsRes) {
        setStats(statsRes)
      }
    } catch (error) {
      console.error("Error fetching stats data:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  // Effect to load stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  // Restore state on mount - always reset to page 0 to see latest data
  useEffect(() => {
    const saved = sessionStorage.getItem('pedidos_state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm)
        if (parsed.activeFilter) setActiveFilter(parsed.activeFilter)
        if (parsed.fechaInicio !== undefined) setFechaInicio(parsed.fechaInicio)
        if (parsed.fechaFin !== undefined) setFechaFin(parsed.fechaFin)
        // Always reset to page 0 on mount so new orders/clients are always visible
        if (parsed.pagination) setPagination({ ...parsed.pagination, pageIndex: 0 })
        if (parsed.sorting) setSorting(parsed.sorting)
      } catch (e) {
        console.error("Error parsing stored state", e)
      }
    }
    setIsRestored(true)
  }, [])

  // Save state on change
  useEffect(() => {
    if (isRestored) {
      sessionStorage.setItem('pedidos_state', JSON.stringify({
        searchTerm, activeFilter, fechaInicio, fechaFin, pagination, sorting
      }))
    }
  }, [searchTerm, activeFilter, fechaInicio, fechaFin, pagination, sorting, isRestored])

  // Effect to load when filter, date, pagination, sorting changes
  // Used debounce internally for searching
  useEffect(() => {
    if (!isRestored) return
    const handler = setTimeout(() => {
      fetchOrders()
    }, 300)
    return () => clearTimeout(handler)
  }, [activeFilter, fechaInicio, fechaFin, pagination.pageIndex, pagination.pageSize, sorting, searchTerm, isRestored])

  const setQuickFilter = (type: "hoy" | "semana" | "mes" | "anio") => {
    const today = new Date();
    const toDateString = (d: Date) => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
    };
    
    let start = new Date();
    let end = new Date();

    switch (type) {
      case "hoy":
        break;
      case "semana":
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today.setDate(diff));
        end = new Date(today.setDate(diff + 6));
        break;
      case "mes":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "anio":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }
    
    setFechaInicio(toDateString(start));
    setFechaFin(toDateString(end));
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }

  return {
    pedidos,
    setPedidos,
    stats,
    isTableFetching,
    isStatsLoading,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    pagination,
    setPagination,
    sorting,
    setSorting,
    totalItems,
    totalPages,
    fetchOrders,
    fetchStats,
    setQuickFilter,
  }
}
