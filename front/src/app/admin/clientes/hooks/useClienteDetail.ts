import { useState, useEffect } from "react"
import { getClienteById, Cliente } from "@/domains/clientes/api"
import { toast } from "sonner"

export function useClienteDetail(id: number) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCliente = async () => {
    setIsLoading(true)
    try {
      const data = await getClienteById(id)
      setCliente(data)
    } catch (error) {
      toast.error("Error al cargar el detalle del cliente")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCliente()
    }
  }, [id])

  return { cliente, isLoading, refresh: fetchCliente }
}
