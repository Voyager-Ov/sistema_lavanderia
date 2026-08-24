import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/shared/lib/api-client"
import { Servicio, ServicioStats, ServiciosResponse } from "@/domains/productos/api"
import { Categoria, getCategorias } from "@/domains/categorias/api"
import { SortingState } from "@tanstack/react-table"

export function useServiciosData() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [stats, setStats] = useState<ServicioStats>({ total: 0, activos: 0, categorias: 0, masSolicitado: null })
  
  const [isTableFetching, setIsTableFetching] = useState<boolean>(true)
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true)
  
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("ALL")
  
  const [pagination, setPagination] = useState<{ pageIndex: number; pageSize: number }>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([])
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)

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
        const sortItem = sorting[0]
        searchParams.append("sortBy", sortItem.id)
        searchParams.append("sortOrder", sortItem.desc ? "DESC" : "ASC")
      }
      
      const response = await apiClient.get<ServiciosResponse>(`/servicios?${searchParams.toString()}`)
      setServicios(response.data.items)
      setTotalPages(response.data.meta.totalPages)
      setTotalItems(response.data.meta.totalItems)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido al cargar servicios"
      console.error("API error fetchServicios:", error)
      toast.error(`Error al cargar los servicios: ${msg}`)
    } finally {
      setIsTableFetching(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, categoriaFilter, activeFilter, sorting])

  const fetchCategorias = useCallback(async () => {
    try {
      const items = await getCategorias()
      setCategorias(items)
    } catch (error: unknown) {
      console.error("Error fetching categorias:", error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true)
    try {
      const response = await apiClient.get<{ success: boolean; data: ServicioStats }>(`/servicios/stats`)
      setStats(response.data)
    } catch (error: unknown) {
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
    totalItems,
    fetchServicios, fetchStats, fetchCategorias
  }
}
