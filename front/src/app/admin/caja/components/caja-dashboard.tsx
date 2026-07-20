"use client"

import { useState, useRef } from "react"
import { CajaActual } from "@/domains/caja/caja.api"
import { Wallet, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RegistrarGastoModal } from "./registrar-gasto-modal"
import { CerrarCajaModal } from "./cerrar-caja-modal"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Button } from "@/shared/ui/forms/button"

import { CajaMetricas } from "./caja-metricas"
import { CajaMovimientosTabla } from "./caja-movimientos-tabla"
import { CajaGraficoBalance } from "./caja-grafico-balance"
import { CajaActividadTurno } from "./caja-actividad-turno"

interface CajaDashboardProps {
  caja: CajaActual
  onRefresh: () => void
  isHistoricalView?: boolean
}

export function CajaDashboard({ caja, onRefresh, isHistoricalView = false }: CajaDashboardProps) {
  const [isRegistrarGastoOpen, setIsRegistrarGastoOpen] = useState(false)
  const [isCerrarCajaOpen, setIsCerrarCajaOpen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Stagger animation for cards
    gsap.fromTo(
      ".metric-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    )
    
    // Animation for the table/chart area
    gsap.fromTo(
      ".data-section",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out" }
    )
  }, [caja])

  return (
    <div className="space-y-8" ref={containerRef}>
      {/* HEADER ACTIVO */}
      <div className="metric-card flex flex-col md:flex-row md:items-center justify-between bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${caja.estado === 'ABIERTA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {caja.estado === 'ABIERTA' ? 'Turno en curso' : 'Turno cerrado'}
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" /> 
                {format(new Date(caja.fechaApertura), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                {caja.usuario && ` • Por ${caja.usuario.nombre}`}
              </p>
            </div>
          </div>
        </div>
        {!isHistoricalView && caja.estado === "ABIERTA" && (
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="outlineRed"
              onClick={() => setIsRegistrarGastoOpen(true)}
              className="rounded-xl px-5"
            >
              Registrar Gasto
            </Button>
            <Button 
              variant="default"
              onClick={() => setIsCerrarCajaOpen(true)}
              className="rounded-xl px-5 shadow-md"
            >
              Cerrar Caja
            </Button>
          </div>
        )}
      </div>

      {/* METRICAS */}
      <CajaMetricas 
        montoInicial={Number(caja.montoInicial || 0)}
        totalIngresosEfectivo={Number(caja.totalIngresosEfectivo || 0)}
        totalIngresosDigitales={Number(caja.totalIngresosDigitales || 0)}
        efectivoEsperado={Number(caja.efectivoEsperadoEnVivo || 0)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 data-section">
        {/* GRÁFICO DINÁMICO */}
        <div className="lg:col-span-2">
          <CajaGraficoBalance totalesPorMetodo={caja.totalesPorMetodo || []} />
        </div>

        {/* ACTIVIDAD DE TURNO */}
        <div className="lg:col-span-1">
          <CajaActividadTurno actividades={caja.actividadTurno || []} />
        </div>

        {/* TABLA UNIFICADA DE MOVIMIENTOS */}
        <div className="lg:col-span-3 mt-2">
          <CajaMovimientosTabla 
            pagos={caja.pagos || []} 
            gastos={caja.gastos || []} 
          />
        </div>
      </div>

      {/* MOBILE BOTTOM ISLAND PARA ACCIONES */}
      {!isHistoricalView && caja.estado === "ABIERTA" && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 flex items-center gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200">
          <Button 
            variant="outlineRed"
            onClick={() => setIsRegistrarGastoOpen(true)}
            className="flex-1 rounded-xl font-medium"
          >
            Registrar Gasto
          </Button>
          <Button 
            variant="default"
            onClick={() => setIsCerrarCajaOpen(true)}
            className="flex-1 rounded-xl shadow-md font-medium"
          >
            Cerrar Caja
          </Button>
        </div>
      )}

      {/* Modales */}
      {isRegistrarGastoOpen && (
        <RegistrarGastoModal
          open={isRegistrarGastoOpen}
          onOpenChange={setIsRegistrarGastoOpen}
          onSuccess={onRefresh}
        />
      )}

      {isCerrarCajaOpen && (
        <CerrarCajaModal
          open={isCerrarCajaOpen}
          onOpenChange={setIsCerrarCajaOpen}
          caja={caja}
          onSuccess={() => {
            setIsCerrarCajaOpen(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
