import { useState } from "react"
import { Cliente } from "@/domains/clientes/api"

export function useClientesModals() {
  // Desactivar Cliente
  const [isDesactivarOpen, setIsDesactivarOpen] = useState(false)
  const [clienteToDesactivar, setClienteToDesactivar] = useState<Cliente | null>(null)

  const modalsProps = {
    isDesactivarOpen, setIsDesactivarOpen,
    clienteToDesactivar, setClienteToDesactivar
  }

  return { modalsProps }
}

