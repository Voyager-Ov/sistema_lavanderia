import { useState, useEffect, useCallback } from "react"
import { SortingState } from "@tanstack/react-table"
import { getFinanzasKPIs, getMovimientos, FinanzasKPIs, MovimientoFinanciero } from "@/domains/finanzas/finanzas.api"
import { useSocket } from "@/shared/hooks/useSocket"

export function useFinanzasData() {
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([])
  const [chartMovimientos, setChartMovimientos] = useState<MovimientoFinanciero[]>([])
  const [kpis, setKpis] = useState<FinanzasKPIs | null>(null)
  
  const [isTableFetching, setIsTableFetching] = useState(true)
  const [isKpisLoading, setIsKpisLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  const [isRestored, setIsRestored] = useState(false)

  const fetchKpis = useCallback(async () => {
    try {
      setIsKpisLoading(true)
      const data = await getFinanzasKPIs({ fechaDesde: fechaInicio, fechaHasta: fechaFin })
      setKpis(data)
    } catch (error) {
      console.error("Error fetching finanzas KPIs:", error)
    } finally {
      setIsKpisLoading(false)
    }
  }, [fechaInicio, fechaFin])

  const fetchMovimientos = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsTableFetching(true)
      const queryParams: any = {
        search: searchTerm || undefined,
        limit: pagination.pageSize,
        page: pagination.pageIndex + 1
      }
      
      if (fechaInicio) queryParams.fechaDesde = fechaInicio;
      if (fechaFin) queryParams.fechaHasta = fechaFin;

      const res = await getMovimientos(queryParams)
      
      let items = res.data;
      
      // Client-side sorting implementation since the API doesn't support generic sorting parameters yet
      if (sorting.length > 0) {
        const sortKey = sorting[0].id as keyof MovimientoFinanciero;
        const desc = sorting[0].desc;
        items = items.sort((a, b) => {
          const valA = a[sortKey];
          const valB = b[sortKey];
          if (valA < valB) return desc ? 1 : -1;
          if (valA > valB) return desc ? -1 : 1;
          return 0;
        });
      }

      setMovimientos(items)
      setTotalPages(res.pagination.totalPages)
      setTotalRecords(res.pagination.totalRecords)
      
      // Update pagination limit if backend forced a different one (unlikely but safe)
      setPagination(prev => ({ ...prev, pageIndex: res.pagination.currentPage - 1 }))
      
    } catch (error) {
      console.error("Error fetching finanzas data:", error)
    } finally {
      if (!silent) setIsTableFetching(false)
    }
  }, [fechaInicio, fechaFin, searchTerm, pagination.pageSize, pagination.pageIndex, sorting])

  const fetchChartData = useCallback(async () => {
    try {
      setIsChartLoading(true)
      const queryParams: any = {
        limit: 10000,
        page: 1
      }
      if (fechaInicio) queryParams.fechaDesde = fechaInicio;
      if (fechaFin) queryParams.fechaHasta = fechaFin;

      const res = await getMovimientos(queryParams)
      setChartMovimientos(res.data)
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsChartLoading(false)
    }
  }, [fechaInicio, fechaFin])

  const refreshAll = useCallback((silent = false) => {
    fetchKpis()
    fetchMovimientos(silent)
    fetchChartData()
  }, [fetchKpis, fetchMovimientos, fetchChartData])

  // Restore state on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('finanzas_state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm)
        if (parsed.fechaInicio !== undefined) setFechaInicio(parsed.fechaInicio)
        if (parsed.fechaFin !== undefined) setFechaFin(parsed.fechaFin)
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
      sessionStorage.setItem('finanzas_state', JSON.stringify({
        searchTerm, fechaInicio, fechaFin, pagination, sorting
      }))
    }
  }, [searchTerm, fechaInicio, fechaFin, pagination, sorting, isRestored])

  // Effect to load when filters, date, pagination, sorting changes
  useEffect(() => {
    if (!isRestored) return
    const handler = setTimeout(() => {
      fetchMovimientos()
    }, 300)
    return () => clearTimeout(handler)
  }, [fechaInicio, fechaFin, pagination.pageIndex, pagination.pageSize, sorting, searchTerm, isRestored, fetchMovimientos])

  // Effect to load chart data and KPIs ONLY when date changes
  useEffect(() => {
    if (!isRestored) return
    fetchKpis()
    fetchChartData()
  }, [fechaInicio, fechaFin, isRestored, fetchKpis, fetchChartData])

  // WebSocket real-time updates
  const { socket } = useSocket()
  useEffect(() => {
    if (!socket || !isRestored) return;
    
    const handleUpdate = () => {
      refreshAll(true) // silent update
    }
    socket.on('pago_registrado', handleUpdate)
    socket.on('caja_actualizada', handleUpdate)
    socket.on('gasto_registrado', handleUpdate)
    
    return () => {
      socket.off('pago_registrado', handleUpdate)
      socket.off('caja_actualizada', handleUpdate)
      socket.off('gasto_registrado', handleUpdate)
    }
  }, [socket, isRestored, refreshAll])

  const setQuickFilter = (type: "hoy" | "semana" | "mes" | "anio") => {
    const end = new Date()
    const start = new Date()
    
    if (type === "hoy") {
      // already today
    } else if (type === "semana") {
      const day = start.getDay() || 7
      start.setDate(start.getDate() - day + 1)
    } else if (type === "mes") {
      start.setDate(1)
    } else if (type === "anio") {
      start.setMonth(0, 1)
    }
    
    setFechaInicio(start.toISOString().split('T')[0])
    setFechaFin(end.toISOString().split('T')[0])
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  return {
    movimientos,
    chartMovimientos,
    setMovimientos,
    kpis,
    isTableFetching,
    isKpisLoading,
    isChartLoading,
    searchTerm,
    setSearchTerm,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    pagination,
    setPagination,
    sorting,
    setSorting,
    totalRecords,
    totalPages,
    setQuickFilter,
    refreshAll
  }
}
