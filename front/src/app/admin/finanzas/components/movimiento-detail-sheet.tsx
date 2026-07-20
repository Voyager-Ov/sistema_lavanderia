"use client"

import React from "react"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { MovimientoFinanciero } from "@/domains/finanzas/finanzas.api"
import { ArrowDownRight, ArrowUpRight, Calendar, User, Tag, CreditCard, Receipt, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"

interface MovimientoDetailSheetProps {
  movimiento: MovimientoFinanciero | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MovimientoDetailSheet({ movimiento, open, onOpenChange }: MovimientoDetailSheetProps) {
  if (!movimiento) return null

  const esIngreso = movimiento.tipoMovimiento === "INGRESO"
  const color = esIngreso ? "text-green-600" : "text-red-600"
  const bgIcon = esIngreso ? "bg-green-100" : "bg-red-100"
  const IconoMovimiento = esIngreso ? ArrowUpRight : ArrowDownRight

  const formattedMonto = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(movimiento.monto)

  const formattedDate = new Date(movimiento.fecha).toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short'
  })

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col">
        <ResponsiveSheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgIcon}`}>
              <IconoMovimiento className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <ResponsiveSheetTitle className="text-xl">
                Detalle de {esIngreso ? "Ingreso" : "Egreso"}
              </ResponsiveSheetTitle>
              <ResponsiveSheetDescription>
                Información completa del movimiento
              </ResponsiveSheetDescription>
            </div>
          </div>
        </ResponsiveSheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Main Amount */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-sm text-slate-500 mb-1 font-medium">Monto Total</span>
            <span className={`text-4xl font-bold tracking-tight ${color}`}>
              {esIngreso ? "+" : "-"}{formattedMonto}
            </span>
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
              movimiento.estado === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700' : 
              movimiento.estado === 'ANULADO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {movimiento.estado}
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Información General</h4>
            
            <div className="grid gap-3">
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Fecha y Hora" value={formattedDate} />
              
              <DetailRow 
                icon={<Tag className="w-4 h-4" />} 
                label={esIngreso ? "Referencia" : "Categoría"} 
                value={
                  esIngreso ? (
                    <Link 
                      href={`/admin/pedidos/${movimiento.referenciaId}`}
                      className="inline-flex items-center gap-1 text-brand-blue hover:text-blue-700 hover:underline font-bold"
                    >
                      Pedido #{movimiento.referenciaId}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span>{movimiento.referenciaId || "Sin categoría"}</span>
                  )
                } 
              />
              
              <DetailRow icon={<CreditCard className="w-4 h-4" />} label="Método de Pago" value={movimiento.metodoPago} />
              <DetailRow icon={<User className="w-4 h-4" />} label="Registrado Por" value={movimiento.registradoPor} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Descripción
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed">
              {movimiento.descripcion || <span className="italic text-slate-400">Sin descripción adicional</span>}
            </div>
          </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900 text-right">
        {value}
      </div>
    </div>
  )
}
