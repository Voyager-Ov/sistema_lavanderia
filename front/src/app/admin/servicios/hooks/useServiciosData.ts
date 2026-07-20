import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/shared/lib/api-client"

export function useServiciosData() {
  const [servicios, setServicios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [stats, setStats] = useState({ total: 0, activos: 0, categorias: 0, masSolicitado: null })
  
  const [isTableFetching, setIsTableFetching] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [categoriaFilter, setCategoriaFilter] = useState("ALL")
  
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState([])
  const [totalPages, setTotalPages] = useState(1)

  const fetchServicios = useCallback(async () => {
    setIsTableFetching(true)
    try {
      const searchParams = new URLSearchParams()
      searchParams.append("page", (pagination.pageIndex + 1).toString())
      searchParams.append("limit", pagination.pageSize.toString())
      if (searchTerm) searchParams.append("search", searchTerm)
      if (categoriaFilter !== "ALL") searchParams.append("categoriaId", categoriaFilter)
      if (activeFilter === "true") searchParams.append("disponible", "true")
      if (activeFilter === "false") searchParams.append("disponible", "false")
      if (sorting.length > 0) {
        searchParams.append("sortBy", (sorting[0] as any).id)
        searchParams.append("sortOrder", (sorting[0] as any).desc ? "DESC" : "ASC")
      }
      
      const data: any = await apiClient.get(`/productos?${searchParams.toString()}`)
      setServicios(data.data?.items || [])
      setTotalPages(data.data?.meta?.totalPages || 1)
    } catch (error: any) {
      console.error("API error fetchServicios:", error)
      toast.error(`Error al cargar los servicios: ${error.message}`)
    } finally {
      setIsTableFetching(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, categoriaFilter, activeFilter, sorting])

  const fetchCategorias = useCallback(async () => {
    try {
      const data: any = await apiClient.get(`/categorias`)
      setCategorias(data.data?.items || data.data || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true)
    try {
      const data: any = await apiClient.get(`/productos/stats`)
      setStats(data.data)
    } catch (error: any) {
      console.error("API error fetchStats:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServicios()
  }, [fetchServicios])

  useEffect(() => {
    fetchCategorias()
    fetchStats()
  }, [fetchCategorias, fetchStats])

  return {
    servicios, setServicios,
    categorias, setCategorias,
    stats,
    isTableFetching, isStatsLoading,
    searchTerm, setSearchTerm,
    activeFilter, setActiveFilter,
    categoriaFilter, setCategoriaFilter,
    pagination, setPagination,
    sorting, setSorting,
    totalPages,
    fetchServicios, fetchStats, fetchCategorias
  }
}
