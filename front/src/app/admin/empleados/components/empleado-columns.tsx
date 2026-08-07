import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, PowerOff, ShieldCheck } from "lucide-react"
import { Empleado } from "../hooks/useEmpleadosData"
import { Button } from "@/shared/ui/forms/button"

interface GetColumnsProps {
  onView: (empleado: Empleado) => void
  onEdit: (empleado: Empleado) => void
  onDesactivar: (empleado: Empleado) => void
}

export const getEmpleadoColumns = ({ onView, onEdit, onDesactivar }: GetColumnsProps): ColumnDef<Empleado>[] => [
  {
    accessorKey: "nombre",
    header: "Empleado",
    cell: ({ row }) => {
      const nombre = row.original.nombre
      const inicial = nombre.charAt(0).toUpperCase()
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-sm font-black shrink-0">
            {inicial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 truncate">{nombre}</span>
            <span className="text-xs text-gray-500">{row.original.email || "Sin email"}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "rol",
    header: "Rol",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{row.original.rol}</span>
      </div>
    ),
  },
  {
    accessorKey: "sueldoBase",
    header: "Sueldo Base",
    cell: ({ row }) => {
      const sueldo = row.original.sueldoBase
      return (
        <span className="text-sm text-gray-600 font-medium">
          {sueldo ? `$${Number(sueldo).toLocaleString("es-AR")}` : "No definido"}
        </span>
      )
    },
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) => {
      const isActivo = row.original.activo
      return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
          isActivo 
            ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
            : "text-red-700 bg-red-50 border-red-100"
        }`}>
          <span className="uppercase opacity-80">{isActivo ? "Activo" : "Inactivo"}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const empleado = row.original
      return (
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors font-semibold px-3"
            onClick={() => onView(empleado)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalles
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors font-semibold px-3"
            onClick={() => onEdit(empleado)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>

          {empleado.activo && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-semibold px-3"
              onClick={() => onDesactivar(empleado)}
            >
              <PowerOff className="w-4 h-4 mr-2" />
              Desactivar
            </Button>
          )}
        </div>
      )
    },
  },
]
