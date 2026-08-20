"use client"

import React, { useState } from "react"
import { Users, UserPlus, Zap } from "lucide-react"
import { Cliente, crearCliente } from "@/domains/clientes/api"
import { ClientSearch } from "@/app/admin/pedidos/nuevo/components/client-search"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"
import { toast } from "sonner"
import { 
  ResponsiveSheet, 
  ResponsiveSheetContent, 
  ResponsiveSheetHeader, 
  ResponsiveSheetTitle, 
  ResponsiveSheetDescription 
} from "@/shared/ui/overlays/responsive-sheet"

interface PosClientSearchProps {
  selectedClient: Cliente | null
  onSelectClient: (cliente: Cliente | null) => void
}

export function PosClientSearch({ selectedClient, onSelectClient }: PosClientSearchProps) {
  const [isExpressOpen, setIsExpressOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ nombre: "", telefono: "" })

  const handleConsumidorFinal = () => {
    // Si tu backend tiene un ID especial (ej. 1) para consumidor final, úsalo.
    onSelectClient({ id: 1, nombre: "Consumidor Final (Mostrador)", telefono: "---" } as Cliente)
  }

  const handleExpressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast.error("El nombre y teléfono son obligatorios")
      return
    }

    setIsSubmitting(true)
    try {
      // Intentar crear el cliente
      const nuevoCliente = await crearCliente({
        nombre: formData.nombre,
        telefono: formData.telefono,
      })
      onSelectClient(nuevoCliente)
      setIsExpressOpen(false)
      setFormData({ nombre: "", telefono: "" })
      toast.success("Cliente guardado y seleccionado")
    } catch (error) {
      console.error(error)
      toast.error("Error al crear el cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input wrapped to share layout with quick buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <ClientSearch 
            selectedClient={selectedClient} 
            onSelectClient={onSelectClient} 
          />
        </div>
        
        {/* Quick Actions (only show if no client is selected to save space) */}
        {!selectedClient && (
          <div className="flex gap-2 w-full sm:w-auto h-[44px]">
            <Button 
              variant="outline" 
              onClick={handleConsumidorFinal}
              className="flex-1 sm:flex-none border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 dark:bg-neutral-800 h-full rounded-xl whitespace-nowrap"
            >
              <Users className="w-4 h-4 mr-2" />
              Consumidor Final
            </Button>
            <Button 
              variant="default" 
              onClick={() => setIsExpressOpen(true)}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white h-full rounded-xl whitespace-nowrap"
            >
              <Zap className="w-4 h-4 mr-2" />
              Express
            </Button>
          </div>
        )}
      </div>

      {/* Express Client Modal using ResponsiveSheet */}
      <ResponsiveSheet open={isExpressOpen} onOpenChange={setIsExpressOpen}>
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader>
            <ResponsiveSheetTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Cliente Express
            </ResponsiveSheetTitle>
            <ResponsiveSheetDescription>
              Registra un cliente rápidamente sin pedirle todos los datos. Ideal para horas pico.
            </ResponsiveSheetDescription>
          </ResponsiveSheetHeader>
          
          <form onSubmit={handleExpressSubmit} className="mt-6 flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="express-nombre">Nombre y Apellido</Label>
              <Input 
                id="express-nombre" 
                placeholder="Ej. Juan Pérez" 
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="express-telefono">Teléfono (WhatsApp)</Label>
              <Input 
                id="express-telefono" 
                type="tel"
                placeholder="Ej. +54 9 11 1234-5678" 
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Obligatorio para enviarle notificaciones cuando esté listo.</p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsExpressOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                {isSubmitting ? "Guardando..." : "Guardar y Usar"}
              </Button>
            </div>
          </form>
        </ResponsiveSheetContent>
      </ResponsiveSheet>
    </div>
  )
}
