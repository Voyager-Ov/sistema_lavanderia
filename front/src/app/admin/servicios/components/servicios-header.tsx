import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { LayoutGrid, Plus } from "lucide-react"

export function ServiciosHeader({ 
  onNewService, onManageCategories 
}: any) {
  return (
    <div className="fade-item flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Servicios</h1>
        <p className="text-gray-500 font-medium text-sm">Gestiona el catálogo de servicios, categorías y sus precios.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Button 
          variant="outline" 
          onClick={onManageCategories}
          className="rounded-full h-12 px-6 font-bold text-gray-700 bg-white border-2 border-gray-100 shadow-sm gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          Categorías
        </Button>

        <Button 
          onClick={onNewService}
          className="rounded-full h-12 px-6 shadow-sm hover:shadow-md transition-all font-bold gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white"
        >
          <Plus className="h-5 w-5" />
          Nuevo Servicio
        </Button>
      </div>
    </div>
  )
}
