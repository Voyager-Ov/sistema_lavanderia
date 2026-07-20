import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/overlays/popover"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface PedidosHeaderProps {
  fechaInicio: string
  setFechaInicio: (val: string) => void
  fechaFin: string
  setFechaFin: (val: string) => void
  setQuickFilter: (type: "hoy" | "semana" | "mes" | "anio") => void
  onClearFilters: () => void
}

export function PedidosHeader({
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  setQuickFilter,
  onClearFilters
}: PedidosHeaderProps) {
  const router = useRouter()

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split('-').reverse().join('/');
  }

  const hasFilter = fechaInicio || fechaFin;
  let filterText = "Filtrar por Fecha";
  if (fechaInicio && fechaFin) {
    filterText = `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`;
  } else if (fechaInicio) {
    filterText = `Desde ${formatDate(fechaInicio)}`;
  } else if (fechaFin) {
    filterText = `Hasta ${formatDate(fechaFin)}`;
  }

  return (
    <div className="fade-item flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Pedidos</h1>
        <p className="text-gray-500 font-medium text-sm">Gestiona y haz seguimiento de todos los tickets activos.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`rounded-full h-12 font-bold text-gray-700 bg-white border-2 border-gray-100 shadow-sm gap-2 ${hasFilter ? 'pr-3' : ''}`}>
              <CalendarIcon className="h-4 w-4" />
              {filterText}
              {hasFilter && (
                <div 
                  role="button"
                  tabIndex={0}
                  className="ml-1 hover:bg-gray-100 p-1 rounded-full flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClearFilters();
                  }}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-2xl" align="end">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">Rango de fechas</h4>
              
              <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => setQuickFilter("hoy")}>Hoy</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => setQuickFilter("semana")}>Esta sem.</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => setQuickFilter("mes")}>Este mes</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => setQuickFilter("anio")}>Este año</Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Desde</label>
                  <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Hasta</label>
                  <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="h-10 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={onClearFilters}>Limpiar</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={() => router.push('/admin/pedidos/nuevo')} className="rounded-full h-12 px-6 shadow-sm hover:shadow-md transition-all font-bold gap-2">
          <span className="text-lg leading-none">+</span> Crear Nuevo Pedido
        </Button>
      </div>
    </div>
  )
}
