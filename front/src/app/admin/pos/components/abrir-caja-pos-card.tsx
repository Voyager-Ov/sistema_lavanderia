"use client"

import React, { useState, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Wallet, ArrowRight, ShieldCheck, PlayCircle, Lock } from "lucide-react"
import { toast } from "sonner"
import { abrirCaja, CajaActual } from "@/domains/caja/caja.api"
import { Button } from "@/shared/ui/forms/button"

interface AbrirCajaPosCardProps {
  onCajaAbierta: (caja: CajaActual) => void
}

const PRESET_AMOUNTS = [0, 5000, 10000, 20000, 50000]

export function AbrirCajaPosCard({ onCajaAbierta }: AbrirCajaPosCardProps) {
  const [montoInicial, setMontoInicial] = useState<number>(10000)
  const [customInput, setCustomInput] = useState<string>("10000")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" }
      )
    }
  }, [])

  const handleSelectPreset = (amount: number) => {
    setMontoInicial(amount)
    setCustomInput(amount.toString())
  }

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomInput(val)
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed >= 0) {
      setMontoInicial(parsed)
    } else {
      setMontoInicial(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (montoInicial < 0) {
      toast.error("El monto inicial debe ser mayor o igual a $0")
      return
    }

    setIsSubmitting(true)
    try {
      const nuevaCaja = await abrirCaja(montoInicial)
      toast.success("Turno de caja abierto correctamente")
      onCajaAbierta(nuevaCaja)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || err.message || "Error al abrir la caja"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      ref={cardRef}
      className="w-full max-w-lg bg-white dark:bg-neutral-900 border-2 border-brand-blue/80 dark:border-brand-blue/60 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative z-50 overflow-hidden"
    >
      {/* Header Title & Icon */}
      <div className="flex items-center gap-4 border-b border-gray-100 dark:border-neutral-800 pb-5">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-brand-blue flex items-center justify-center font-bold flex-shrink-0">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-brand-blue text-[11px] font-bold uppercase tracking-wider mb-1">
            <Lock className="w-3 h-3" /> Turno de Caja Requerido
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Apertura de Caja POS
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Ingresa el fondo inicial de efectivo para habilitar la terminal.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Quick Presets */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-600 dark:text-neutral-400 uppercase tracking-wider">
            Efectivo Inicial Sugerido
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = montoInicial === amt
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border-2 transition-all ${
                    isSelected
                      ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                      : "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:border-slate-300"
                  }`}
                >
                  ${amt.toLocaleString("es-AR")}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-600 dark:text-neutral-400 uppercase tracking-wider">
            Monto Personalizado
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 dark:text-neutral-500 font-bold text-lg pointer-events-none">
              $
            </span>
            <input
              type="number"
              min="0"
              step="50"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="0"
              className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:border-brand-blue transition-all"
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-3 p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-blue-900 dark:text-blue-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-brand-blue" />
          <p className="leading-snug">
            Este saldo servirá como base para el cálculo del efectivo esperado en el arqueo al cierre de turno.
          </p>
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all mt-1"
        >
          {isSubmitting ? (
            <span>Abriendo caja...</span>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              <span>Abrir Caja y Comenzar Turno</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
