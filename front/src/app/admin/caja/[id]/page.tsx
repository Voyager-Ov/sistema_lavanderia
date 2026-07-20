"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { CajaActual, obtenerCajaPorId } from "@/domains/caja/caja.api"
import { CajaDashboard } from "../components/caja-dashboard"
import { Skeleton } from "@/shared/ui/feedback/skeleton"
import { ArrowLeft, Wallet } from "lucide-react"
import { Badge } from "@/shared/ui/data-display/badge"

export default function CajaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  
  const [caja, setCaja] = useState<CajaActual | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNaN(id)) {
      setError("ID de caja inválido")
      setIsLoading(false)
      return
    }
    fetchCaja()
  }, [id])

  const fetchCaja = async () => {
    try {
      setIsLoading(true)
      const data = await obtenerCajaPorId(id)
      setCaja(data)
    } catch (err: any) {
      console.error("Error al cargar la caja", err)
      setError(err.message || "Error al cargar la caja")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full gap-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/caja")}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Detalle de Caja
            {caja && (
              <Badge 
                variant={caja.estado === 'ABIERTA' ? 'success' : 'secondary'} 
                className="text-sm px-3 py-1"
              >
                {caja.estado === 'ABIERTA' ? 'Activa' : 'Cerrada'}
              </Badge>
            )}
          </h1>
          <p className="text-slate-500 mt-1">Visualizando los datos históricos del turno #{id}.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col mt-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
          </div>
        ) : error || !caja ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No se pudo cargar la caja</h3>
            <p className="text-slate-500 max-w-md mx-auto">{error || "La caja solicitada no existe o no tienes permisos para verla."}</p>
            <button
              onClick={() => router.push("/admin/caja")}
              className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Volver a Caja
            </button>
          </div>
        ) : (
          <CajaDashboard 
            caja={caja} 
            onRefresh={fetchCaja} 
            isHistoricalView={true} 
          />
        )}
      </div>
    </div>
  )
}
