import { useState, useCallback, useEffect } from "react"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { empleadosApi, EmpleadoDTO } from "@/domains/empleados/api/empleados.api"

export type { EmpleadoDTO as Empleado }

export function useEmpleadosData() {
  const { token } = useAuthStore()
  const [empleados, setEmpleados] = useState<EmpleadoDTO[]>([])
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0 })
  const [isTableFetching, setIsTableFetching] = useState(false)
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalPages, setTotalPages] = useState(1)
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([])

  const fetchEmpleados = useCallback(async () => {
    if (!token) return
    setIsTableFetching(true)
    try {
      const data = await empleadosApi.obtenerEmpleados({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchTerm || undefined,
        sortBy: sorting.length > 0 ? sorting[0].id : undefined,
        sortOrder: sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined
      })

      if (data) {
        setEmpleados(data.items || [])
        setTotalPages(data.meta?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error al obtener empleados:", error)
    } finally {
      setIsTableFetching(false)
    }
  }, [token, pagination, searchTerm, sorting])

  const fetchStats = useCallback(async () => {
    if (!token) return
    setIsStatsLoading(true)
    try {
      const data = await empleadosApi.obtenerEmpleados({ limit: 1000 })
      if (data) {
        const items = data.items || []
        const total = items.length
        const activos = items.filter((emp: EmpleadoDTO) => emp.activo).length
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

