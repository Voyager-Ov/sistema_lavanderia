import { useState, useCallback, useEffect } from "react"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { apiClient } from "@/shared/lib/api-client"

export interface Empleado {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  sueldoBase?: number
  horasSemanalesObjetivo?: number
}

export function useEmpleadosData() {
  const { token } = useAuthStore()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0 })
  const [isTableFetching, setIsTableFetching] = useState(false)
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalPages, setTotalPages] = useState(1)
  const [sorting, setSorting] = useState<any[]>([])

  const fetchEmpleados = useCallback(async () => {
    if (!token) return
    setIsTableFetching(true)
    try {
      const queryParams = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString()
      })
      if (searchTerm) queryParams.append("search", searchTerm)
      if (sorting.length > 0) {
        queryParams.append("sortBy", sorting[0].id)
        queryParams.append("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const res = await apiClient.get<any>(`/usuarios?${queryParams.toString()}`)
      if (res.data) {
        setEmpleados(res.data.items || [])
        setTotalPages(res.data.meta?.totalPages || 1)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsTableFetching(false)
    }
  }, [token, pagination, searchTerm, sorting])

  const fetchStats = useCallback(async () => {
    if (!token) return
    setIsStatsLoading(true)
    try {
      const res = await apiClient.get<any>(`/usuarios`)
      if (res.data) {
        const items = res.data.items || []
        const total = items.length
        const activos = items.filter((i: any) => i.activo).length
        const inactivos = total - activos
        setStats({ total, activos, inactivos })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }, [token])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEmpleados()
    }, 500)
    return () => clearTimeout(handler)
  }, [fetchEmpleados, searchTerm])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    empleados,
    stats,
    isTableFetching,
    isStatsLoading,
    searchTerm,
    setSearchTerm,
    pagination,
    setPagination,
    sorting,
    setSorting,
    totalPages,
    fetchEmpleados,
    fetchStats,
  }
}
