"use client"

import { format } from "date-fns"
import { Activity, PackageCheck, PackagePlus, AlertCircle, RefreshCw } from "lucide-react"

interface Actividad {
  id: number;
  pedidoId: number;
  estadoAnterior?: string;
  estadoNuevo: string;
  comentario?: string;
  createdAt: string;
}

interface CajaActividadTurnoProps {
  actividades: Actividad[];
}

export function CajaActividadTurno({ actividades = [] }: CajaActividadTurnoProps) {
  
  const getIconForActivity = (estadoNuevo: string) => {
    switch (estadoNuevo.toUpperCase()) {
      case 'NUEVO':
        return <PackagePlus className="w-4 h-4 text-blue-500" />;
      case 'ENTREGADO':
        return <PackageCheck className="w-4 h-4 text-emerald-500" />;
      case 'CANCELADO':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
    }
  }

  const getActionText = (act: Actividad) => {
    if (!act.estadoAnterior && act.estadoNuevo === 'NUEVO') {
      return `Creó el Pedido #${act.pedidoId}`;
    }
    return `Cambió el Pedido #${act.pedidoId} a ${act.estadoNuevo}`;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="border-b border-slate-100 dark:border-neutral-800 pb-4 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-slate-500 dark:text-neutral-400" />
        <h3 className="font-semibold text-slate-800 dark:text-neutral-100">
          Historial del Turno
        </h3>
      </div>

      <div className="overflow-y-auto max-h-[400px]">
        {actividades.length > 0 ? (
          <div className="relative border-l border-slate-200 dark:border-neutral-800 ml-3 space-y-6">
            {actividades.map((act) => (
              <div key={act.id} className="relative pl-6">
                <span className="absolute -left-3 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 shadow-sm">
                  {getIconForActivity(act.estadoNuevo)}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500 mb-0.5">
                    {format(new Date(act.createdAt), "HH:mm")}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-neutral-200 font-medium">
                    {getActionText(act)}
                  </span>
                  {act.comentario && (
                    <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1 bg-slate-50 dark:bg-neutral-800/80 p-2 rounded-lg border border-slate-100 dark:border-neutral-700/60">
                      "{act.comentario}"
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Activity className="w-8 h-8 text-slate-200 dark:text-neutral-700 mb-2" />
            <p className="text-slate-400 dark:text-neutral-500 text-sm">No hay actividad registrada en este turno.</p>
          </div>
        )}
      </div>
    </div>
  )
}
