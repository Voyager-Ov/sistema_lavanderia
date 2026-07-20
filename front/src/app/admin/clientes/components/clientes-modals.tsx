import React from "react"
import { DesactivarClienteModal } from "../_components/desactivar-cliente-modal"

interface ClientesModalsProps {
  props: any
  onActionSuccess: () => void
}

export function ClientesModals({ props, onActionSuccess }: ClientesModalsProps) {
  const {
    isDesactivarOpen, setIsDesactivarOpen,
    clienteToDesactivar, setClienteToDesactivar
  } = props

  return (
    <>
      <DesactivarClienteModal
        isOpen={isDesactivarOpen}
        onOpenChange={setIsDesactivarOpen}
        cliente={clienteToDesactivar}
        onSuccess={() => {
          setIsDesactivarOpen(false)
          onActionSuccess()
        }}
      />
    </>
  )
}

