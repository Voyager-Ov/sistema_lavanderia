import { useState, useCallback } from "react"
import { Servicio } from "@/domains/productos/api"

export function useServiciosModals() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false)
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState<boolean>(false)
  
  const [servicioToEdit, setServicioToEdit] = useState<Servicio | null>(null)
  const [servicioToHistory, setServicioToHistory] = useState<Servicio | null>(null)

  const handleEdit = useCallback((servicio: Servicio) => {
    setServicioToEdit(servicio)
    setIsEditModalOpen(true)
  }, [])

  const handleHistory = useCallback((servicio: Servicio) => {
    setServicioToHistory(servicio)
    setIsHistoryModalOpen(true)
  }, [])

  return {
    isCreateModalOpen, setIsCreateModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isHistoryModalOpen, setIsHistoryModalOpen,
    isCategoriesModalOpen, setIsCategoriesModalOpen,
    servicioToEdit, setServicioToEdit,
    servicioToHistory, setServicioToHistory,
    handleEdit, handleHistory
  }
}
