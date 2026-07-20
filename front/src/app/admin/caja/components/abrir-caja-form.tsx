"use client"

import { useState } from "react"
import { DollarSign, Wallet } from "lucide-react"
import { toast } from "sonner"
import { abrirCaja } from "@/domains/caja/caja.api"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"

interface AbrirCajaFormProps {
  onSuccess: () => void
}

export function AbrirCajaForm({ onSuccess }: AbrirCajaFormProps) {
  const [montoInicial, setMontoInicial] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!montoInicial || isNaN(Number(montoInicial))) {
      toast.error("Por favor ingrese un monto válido")
      return
    }

    try {
      setIsLoading(true)
      await abrirCaja(Number(montoInicial))
      toast.success("Caja abierta exitosamente")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Error al abrir la caja")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-brand-blue/10 rounded-[1rem] flex items-center justify-center mb-4 text-brand-blue">
          <Wallet className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 text-center">Fondo de Caja</h3>
        <p className="text-slate-500 text-center mt-1.5 text-sm max-w-[280px]">
          Ingresa el monto de dinero físico con el que iniciarás este turno.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-slate-700">Monto Inicial en Efectivo</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              className="pl-11 h-14 text-xl font-bold bg-slate-50 border-slate-200 focus-visible:ring-brand-blue"
              placeholder="0.00"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !montoInicial}
          className="w-full h-14 text-base shadow-md"
        >
          {isLoading ? (
            "Abriendo turno..."
          ) : (
            <>
              Abrir Turno
              <Wallet className="w-5 h-5 ml-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
