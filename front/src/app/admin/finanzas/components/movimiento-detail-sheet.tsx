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
  const color = esIngreso ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
  const bgIcon = esIngreso ? "bg-emerald-100 dark:bg-emerald-950/60" : "bg-rose-100 dark:bg-rose-950/60"
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
        <ResponsiveSheetHeader className="pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgIcon}`}>
              <IconoMovimiento className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <ResponsiveSheetTitle className="text-xl dark:text-neutral-100">
                Detalle de {esIngreso ? "Ingreso" : "Egreso"}
              </ResponsiveSheetTitle>
              <ResponsiveSheetDescription className="dark:text-neutral-400">
                Información completa del movimiento
              </ResponsiveSheetDescription>
            </div>
          </div>
        </ResponsiveSheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Main Amount */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-100 dark:border-neutral-700/60 transition-colors">
            <span className="text-sm text-slate-500 dark:text-neutral-400 mb-1 font-medium">Monto Total</span>
            <span className={`text-4xl font-extrabold tracking-tight ${color}`}>
              {esIngreso ? "+" : "-"}{formattedMonto}
            </span>
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${
              movimiento.estado === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 
              movimiento.estado === 'ANULADO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {movimiento.estado}
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 uppercase tracking-wider">Información General</h4>
            
            <div className="grid gap-3">
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Fecha y Hora" value={formattedDate} />
              
              <DetailRow 
                icon={<Tag className="w-4 h-4" />} 
                label={esIngreso ? "Referencia" : "Categoría"} 
                value={
                  esIngreso ? (
                    <Link 
                      href={`/admin/pedidos/${movimiento.referenciaId}`}
                      className="inline-flex items-center gap-1 text-brand-blue hover:text-blue-700 hover:underline font-bold dark:text-blue-400 dark:hover:text-blue-300"
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
            <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Descripción
            </h4>
            <div className="p-4 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-100 dark:border-neutral-700/60 text-slate-700 dark:text-neutral-300 text-sm leading-relaxed transition-colors">
              {movimiento.descripcion || <span className="italic text-slate-400 dark:text-neutral-500">Sin descripción adicional</span>}
            </div>
          </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/80 transition-colors">
      <div className="flex items-center gap-2.5 text-slate-500 dark:text-neutral-400">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-neutral-100 text-right">
        {value}
      </div>
    </div>
  )
}
