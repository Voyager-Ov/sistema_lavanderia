"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { getTrackingInfoAPI, TrackingResponse } from "@/domains/pedidos/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { CheckCircle2, Clock, MapPin, Package, AlertCircle } from "lucide-react"

export default function TrackingPage() {
  const params = useParams()
  const [data, setData] = useState<TrackingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  gsap.registerPlugin(useGSAP)

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        const res = await getTrackingInfoAPI(params.negocioId as string, params.codigo as string)
        if (mounted) setData(res)
      } catch (err: any) {
        if (mounted) setError(err.message || "No pudimos encontrar tu pedido.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [params.negocioId, params.codigo])

  useGSAP(() => {
    if (!loading && data) {
      // Entrance animation for header
      gsap.from(".track-header", { y: -30, opacity: 0, duration: 0.8, ease: "power3.out" })
      
      // Staggered reveal for cards
      gsap.from(".track-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.2
      })
      
      // Pulse animation for current status icon
      gsap.to(".status-pulse", {
        scale: 1.1,
        repeat: -1,
        yoyo: true,
        duration: 1,
        ease: "sine.inOut"
      })
    }
    
    if (!loading && error) {
      gsap.from(".error-box", { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(1.7)" })
    }
  }, { scope: containerRef, dependencies: [loading, data, error] })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div ref={containerRef} className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="error-box bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Ups...</h2>
          <p className="text-gray-500">{error || "Código de seguimiento inválido"}</p>
        </div>
      </div>
    )
  }

  const getStatusInfo = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return { text: "Recibido", color: "text-blue-500", bg: "bg-blue-500", icon: <Package /> }
      case "EN_PROCESO": return { text: "En Proceso", color: "text-yellow-500", bg: "bg-yellow-500", icon: <Clock /> }
      case "LISTO_PARA_RETIRAR": return { text: "Listo para Retirar", color: "text-brand-green", bg: "bg-brand-green", icon: <MapPin /> }
      case "ENTREGADO": return { text: "Entregado", color: "text-gray-800", bg: "bg-gray-800", icon: <CheckCircle2 /> }
      case "CANCELADO": return { text: "Cancelado", color: "text-red-500", bg: "bg-red-500", icon: <AlertCircle /> }
      default: return { text: estado, color: "text-gray-500", bg: "bg-gray-500", icon: <Package /> }
    }
  }

  const statusInfo = getStatusInfo(data.estado)
  
  // Status steps for the progress bar
  const steps = ["PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR", "ENTREGADO"]
  const currentIndex = steps.indexOf(data.estado)

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFDFD] font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-10">
        
        {/* Header Shape */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-brand-blue to-blue-600 rounded-b-[3rem] overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20"></div>
        </div>

        {/* Header Content */}
        <div className="track-header pt-12 px-8 pb-8 text-white">
          <h1 className="text-sm font-bold tracking-widest uppercase opacity-80 mb-1">Lavandería</h1>
          <h2 className="text-3xl font-black mb-1">¡Hola, {data.clienteNombre.split(' ')[0]}!</h2>
          <p className="opacity-90 font-medium">Seguimiento de tu pedido #{data.pedidoId}</p>
        </div>

        {/* Main Status Card */}
        <div className="px-6 -mt-4">
          <div className="track-card bg-white rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${statusInfo.bg}`}></div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`status-pulse w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg mb-4 ${statusInfo.bg}`}>
                {React.cloneElement(statusInfo.icon as React.ReactElement<any>, { size: 36 })}
              </div>
              <h3 className={`text-2xl font-black ${statusInfo.color}`}>{statusInfo.text}</h3>
              <p className="text-gray-500 font-medium mt-2">
                Actualizado el {format(new Date(), "dd/MM 'a las' HH:mm", { locale: es })}
              </p>
            </div>

            {/* Status Progress Bar */}
            {currentIndex >= 0 && currentIndex <= 3 && (
              <div className="mt-10 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                <div 
                  className={`absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full transition-all duration-1000 ${statusInfo.bg}`}
                  style={{ width: `${(currentIndex / 3) * 100}%` }}
                ></div>
                <div className="relative flex justify-between">
                  {steps.map((step, i) => (
                    <div key={step} className={`w-4 h-4 rounded-full border-4 bg-white z-10 transition-colors duration-500 ${i <= currentIndex ? 'border-' + statusInfo.bg.split('-')[1] + '-500' : 'border-gray-200'}`}></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Card */}
        <div className="px-6 mt-6">
          <div className="track-card bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-lg font-black text-gray-900 mb-4">Detalle de Servicios</h4>
            <div className="space-y-4">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-bold text-gray-700">
                    {item.cantidad}x
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.nombre}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Total a abonar</span>
                <span className="text-2xl font-black text-gray-900">
                  ${Number(data.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-3 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Estado del pago</span>
                {data.cobrado ? (
                  <span className="text-brand-green flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Pagado</span>
                ) : (
                  <span className="text-orange-500">Pendiente de pago</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
