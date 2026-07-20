import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { actualizarCliente, Cliente } from "@/domains/clientes/api"
import { User, Phone, Mail } from "lucide-react"

interface EditarClienteSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onSuccess: () => void
}

export function EditarClienteSheet({ isOpen, onOpenChange, cliente, onSuccess }: EditarClienteSheetProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (cliente && isOpen) {
      setFormData({
        nombre: cliente.nombre || "",
        telefono: cliente.telefono || "",
        email: cliente.email || ""
      })
    }
  }, [cliente, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente) return
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    setIsSubmitting(true)
    try {
      await actualizarCliente(cliente.id, formData)
      toast.success("Cliente actualizado con éxito")
      onSuccess()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error al actualizar el cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveSheet open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col bg-gray-50/50">
        <ResponsiveSheetHeader className="mb-6 text-left">
          <ResponsiveSheetTitle className="text-2xl font-black text-gray-900">Editar Cliente</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>Modifica los datos del cliente.</ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              Nombre Completo *
            </label>
            <Input 
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="h-12 rounded-xl bg-white border-gray-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-500" />
              Teléfono
            </label>
            <Input 
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              className="h-12 rounded-xl bg-white border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-500" />
              Email
            </label>
            <Input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12 rounded-xl bg-white border-gray-200"
            />
          </div>

          <div className="mt-auto pt-6 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full px-6 h-12 bg-white"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="rounded-full px-8 h-12 font-bold shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
