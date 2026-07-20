import { useState, useCallback } from "react"

export function useServiciosModals() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false)
  
  const [servicioToEdit, setServicioToEdit] = useState<any>(null)
  const [servicioToHistory, setServicioToHistory] = useState<any>(null)

  const handleEdit = useCallback((servicio: any) => {
    setServicioToEdit(servicio)
    setIsEditModalOpen(true)
  }, [])

  const handleHistory = useCallback((servicio: any) => {
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

