import { useState, useEffect } from "react"
import { SortingState } from "@tanstack/react-table"
import { Cliente, getClientes } from "@/domains/clientes/api"
import { getDashboardStats, DashboardStatsResponse } from "@/domains/dashboard/api"

export function useClientesData() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [isTableFetching, setIsTableFetching] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Pagination & Sorting state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  // State restore flag
  const [isRestored, setIsRestored] = useState(false)

  const fetchClients = async () => {
    setIsTableFetching(true)
    try {
      const queryParams: Record<string, any> = {
        search: searchTerm || undefined,
        limit: pagination.pageSize,
        page: pagination.pageIndex + 1
      }
      
      if (sorting.length > 0) {
        queryParams.sortBy = sorting[0].id
        queryParams.sortOrder = sorting[0].desc ? "desc" : "asc"
      }

      const res = await getClientes(queryParams).catch(e => { console.error("Error cargando clientes", e); return null; })

      if (res && res.data) {
        setClientes(res.data.items || [])
        const { totalItems, totalPages, currentPage } = res.data.meta || { totalItems: 0, totalPages: 0, currentPage: 1 }
        setTotalItems(totalItems)
        setTotalPages(totalPages)
        setPagination(prev => ({
          ...prev,
          pageIndex: currentPage > 0 ? currentPage - 1 : 0
        }))
      }
    } catch (error) {
      console.error("Error fetching clientes data:", error)
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

  // Restore state on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('clientes_state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm)
        if (parsed.pagination) setPagination(parsed.pagination)
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
      sessionStorage.setItem('clientes_state', JSON.stringify({
        searchTerm, pagination, sorting
      }))
    }
  }, [searchTerm, pagination, sorting, isRestored])

  // Effect to load when pagination, sorting, or searching changes
  // Debounce internally for searching
  useEffect(() => {
    if (!isRestored) return
    const handler = setTimeout(() => {
      fetchClients()
    }, 300)
    return () => clearTimeout(handler)
  }, [pagination.pageIndex, pagination.pageSize, sorting, searchTerm, isRestored])

  return {
    clientes,
    setClientes,
    stats,
    isTableFetching,
    isStatsLoading,
    searchTerm,
    setSearchTerm,
    pagination,
    setPagination,
    sorting,
    setSorting,
    totalItems,
    totalPages,
    fetchClients,
    fetchStats,
  }
}
