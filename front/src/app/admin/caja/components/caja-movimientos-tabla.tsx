"use client"

import { format } from "date-fns"
import { ChevronRight, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef } from "react"
import { Badge } from "@/shared/ui/data-display/badge"

interface Movimiento {
  id: string; // Puede ser pago-1 o gasto-1
  tipo: "INGRESO" | "EGRESO";
  fecha: Date;
  descripcion: string;
  referenciaId?: number; // Para navegar al pedido
  metodoPago: string;
  monto: number;
  montoAFavorGenerado?: number;
}

interface CajaMovimientosTablaProps {
  pagos: any[];
  gastos: any[];
}

export function CajaMovimientosTabla({ pagos = [], gastos = [] }: CajaMovimientosTablaProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animamos las filas cada vez que cambian los movimientos (ej. polling)
    gsap.fromTo(
      ".movimiento-row",
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "all" }
    );
  }, { scope: containerRef, dependencies: [pagos, gastos] });

  // Unificar y ordenar movimientos
  const movimientos: Movimiento[] = [
    ...pagos.map((p: any) => ({
      id: `pago-${p.id}`,
      tipo: "INGRESO" as const,
      fecha: new Date(p.createdAt),
      descripcion: `Cobro Pedido #${p.pedidoId}`,
      referenciaId: p.pedidoId,
      metodoPago: p.metodoPago?.nombre || 'Desconocido',
      monto: Number(p.monto),
      montoAFavorGenerado: p.montoAFavorGenerado ? Number(p.montoAFavorGenerado) : undefined
    })),
    ...gastos.map((g: any) => ({
      id: `gasto-${g.id}`,
      tipo: "EGRESO" as const,
      fecha: new Date(g.createdAt),
      descripcion: g.descripcion ? `${g.categoria}: ${g.descripcion}` : g.categoria,
      metodoPago: g.metodoPago?.nombre || 'Efectivo',
      monto: Number(g.monto)
    }))
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full" ref={containerRef}>
      <div className="border-b border-slate-100 dark:border-neutral-800 pb-4 mb-4 flex gap-6">
        <h3 className="font-semibold text-slate-800 dark:text-neutral-100">
          Movimientos de Caja ({movimientos.length})
        </h3>
      </div>

      <div className="p-0 overflow-y-auto max-h-[400px]">
        <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-300">
          <thead className="bg-white dark:bg-neutral-900 sticky top-0 z-10 shadow-sm border-b border-slate-100 dark:border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-400 dark:text-neutral-400 w-24">Hora</th>
              <th className="px-6 py-4 font-medium text-slate-400 dark:text-neutral-400">Descripción</th>
              <th className="px-6 py-4 font-medium text-slate-400 dark:text-neutral-400">Método</th>
              <th className="px-6 py-4 text-right font-medium text-slate-400 dark:text-neutral-400">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/60">
            {movimientos.length > 0 ? (
              movimientos.map((mov) => (
                <tr 
                  key={mov.id} 
                  onClick={() => mov.referenciaId ? router.push(`/admin/pedidos/${mov.referenciaId}`) : undefined}
                  className={`movimiento-row hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors ${mov.referenciaId ? 'cursor-pointer group' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-neutral-400">
                    {format(mov.fecha, "HH:mm")}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                    {mov.tipo === 'INGRESO' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    {mov.descripcion}
                    {mov.referenciaId && (
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-neutral-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                    )}
                    {mov.montoAFavorGenerado && mov.montoAFavorGenerado > 0 ? (
                      <span className="ml-2 inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-full w-fit">
                        + Generó ${mov.montoAFavorGenerado.toLocaleString('es-AR')} a favor
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">
                      {mov.metodoPago}
                    </Badge>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${mov.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {mov.tipo === 'INGRESO' ? '+' : '-'}${mov.monto.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-neutral-500">
                  No hay movimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
