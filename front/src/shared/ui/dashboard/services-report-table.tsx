"use client"

import React from "react"
import { cn } from "@/shared/lib/utils"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

export interface ServiceReportData {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  ingresos: number
  porcentajeVentas: number
  tendencia: "up" | "down" | "flat"
}

interface ServicesReportTableProps {
  data: ServiceReportData[]
  className?: string
}

export function ServicesReportTable({ data, className }: ServicesReportTableProps) {
  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col",
      className
    )}>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-extrabold text-gray-900 tracking-wider uppercase">
          Rendimiento Detallado
        </h3>
        <button className="text-xs font-bold bg-gray-100 px-4 py-2 rounded-full uppercase tracking-wider hover:bg-gray-200 transition-colors">
          Exportar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-4 px-2 text-xs font-black text-gray-400 uppercase tracking-widest w-[30%]">Servicio</th>
              <th className="py-4 px-2 text-xs font-black text-gray-400 uppercase tracking-widest">Categoría</th>
              <th className="py-4 px-2 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Volumen</th>
              <th className="py-4 px-2 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ingresos</th>
              <th className="py-4 px-2 text-xs font-black text-gray-400 uppercase tracking-widest text-right">% Total</th>
              <th className="py-4 px-2 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={row.id} 
                className={cn(
                  "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                  index === data.length - 1 ? "border-0" : ""
                )}
              >
                <td className="py-4 px-2">
                  <span className="font-bold text-gray-900">{row.nombre}</span>
                </td>
                <td className="py-4 px-2">
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {row.categoria}
                  </span>
                </td>
                <td className="py-4 px-2 text-right font-black text-gray-900 text-lg">
                  {row.cantidad}
                </td>
                <td className="py-4 px-2 text-right font-bold text-gray-700">
                  ${row.ingresos.toLocaleString()}
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-bold text-gray-900 w-8">{row.porcentajeVentas}%</span>
                    {/* Tiny inline progress bar */}
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.porcentajeVentas}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <div className="flex justify-center items-center">
                    {row.tendencia === "up" && <ArrowUp className="w-5 h-5 text-green-500" strokeWidth={3} />}
                    {row.tendencia === "down" && <ArrowDown className="w-5 h-5 text-red-500" strokeWidth={3} />}
                    {row.tendencia === "flat" && <Minus className="w-5 h-5 text-gray-300" strokeWidth={3} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
