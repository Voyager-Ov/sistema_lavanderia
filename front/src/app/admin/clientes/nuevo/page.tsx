"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { toast } from "sonner"
import { ArrowLeft, User, Phone, Mail } from "lucide-react"

import { crearCliente } from "@/domains/clientes/api"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"

export default function CrearClientePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Page entry animation
  useGSAP(() => {
    gsap.fromTo(
      ".fade-up-element",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    setIsSubmitting(true)
    try {
      await crearCliente({
        nombre: formData.nombre,
        telefono: formData.telefono,
        email: formData.email
      })
      toast.success("¡Cliente creado con éxito!")
      router.push("/admin/clientes")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Hubo un error al crear el cliente")
      console.error(error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="lg:h-[calc(100vh-220px)] min-h-screen bg-gray-50/50 -mx-4 -mt-4 p-4 sm:p-6 lg:p-6 flex flex-col">
      {/* Header */}
      <div className="fade-up-element flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Crear Nuevo Cliente</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Registra un nuevo cliente para gestionar sus pedidos y cuenta corriente.</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 max-w-2xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="fade-up-element bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              Nombre Completo *
            </label>
            <Input 
              placeholder="Ej: Juan Pérez" 
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-500" />
              Teléfono
            </label>
            <Input 
              placeholder="Ej: 3811234567" 
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              className="h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
            <p className="text-xs text-gray-500">Opcional. Necesario para notificaciones por WhatsApp.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-500" />
              Email
            </label>
            <Input 
              placeholder="Ej: juan@email.com" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
            <p className="text-xs text-gray-500">Opcional.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 mt-auto">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full px-6 h-12"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="rounded-full px-8 h-12 font-bold shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
