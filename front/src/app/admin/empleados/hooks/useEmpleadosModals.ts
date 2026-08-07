import { useState } from "react"
import { Empleado } from "./useEmpleadosData"

export function useEmpleadosModals() {
  const [isCrearOpen, setIsCrearOpen] = useState(false)
  const [isEditarOpen, setIsEditarOpen] = useState(false)
  const [isDesactivarOpen, setIsDesactivarOpen] = useState(false)
  const [empleadoToEdit, setEmpleadoToEdit] = useState<Empleado | null>(null)
  const [empleadoToDesactivar, setEmpleadoToDesactivar] = useState<Empleado | null>(null)

  return {
    modalsProps: {
      isCrearOpen, setIsCrearOpen,
      isEditarOpen, setIsEditarOpen,
      isDesactivarOpen, setIsDesactivarOpen,
      empleadoToEdit, setEmpleadoToEdit,
      empleadoToDesactivar, setEmpleadoToDesactivar
    }
  }
}
