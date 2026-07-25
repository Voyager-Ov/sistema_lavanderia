import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, FilterX } from "lucide-react"
import { Button } from "@/shared/ui/forms/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/overlays/popover"
import { Calendar } from "@/shared/ui/data-display/calendar"
import { cn } from "@/shared/lib/utils"

interface EmpleadosReportHeaderProps {
  fechaInicio: Date | undefined
  setFechaInicio: (date: Date | undefined) => void
  fechaFin: Date | undefined
  setFechaFin: (date: Date | undefined) => void
  setQuickFilter: (type: "today" | "yesterday" | "thisWeek" | "thisMonth" | "lastMonth") => void
  onClearFilters: () => void
}

export function EmpleadosReportHeader({
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  setQuickFilter,
  onClearFilters
}: EmpleadosReportHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm stagger-block opacity-0">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
          Reporte de Empleados
        </h1>
        <p className="text-gray-500 font-medium">
          Rendimiento, cajas y métodos de cobro
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <Button variant="outline" size="sm" onClick={() => setQuickFilter("today")} className="rounded-full text-xs font-bold px-4">
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickFilter("thisWeek")} className="rounded-full text-xs font-bold px-4">
            Semana
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickFilter("thisMonth")} className="rounded-full text-xs font-bold px-4 bg-gray-50">
            Mes
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Rango de Fechas */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-semibold rounded-full border-gray-200",
                    !fechaInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-brand-blue" />
                  {fechaInicio ? format(fechaInicio, "dd MMM yyyy", { locale: es }) : "Inicio"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                <Calendar
                  mode="single"
                  selected={fechaInicio}
                  onSelect={setFechaInicio}
                  className="rounded-2xl"
                />
              </PopoverContent>
            </Popover>

            <span className="text-gray-300 font-bold">-</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-semibold rounded-full border-gray-200",
                    !fechaFin && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-brand-blue" />
                  {fechaFin ? format(fechaFin, "dd MMM yyyy", { locale: es }) : "Fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                <Calendar
                  mode="single"
                  selected={fechaFin}
                  onSelect={setFechaFin}
                  className="rounded-2xl"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFilters}
            className="rounded-full h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Limpiar filtros"
          >
            <FilterX className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
