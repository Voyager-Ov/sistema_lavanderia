import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { Users } from "lucide-react"

export function EmpleadosHeader() {
  return (
    <div className="fade-item flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Empleados</h1>
        <p className="text-gray-500 font-medium text-sm">Gestiona el personal de tu negocio.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Button 
          onClick={() => document.dispatchEvent(new CustomEvent('openCrearEmpleado'))} 
          className="rounded-full h-12 px-6 shadow-sm hover:shadow-md transition-all font-bold gap-2"
        >
          <span className="text-lg leading-none">+</span> Nuevo Empleado
        </Button>
      </div>
    </div>
  )
}
