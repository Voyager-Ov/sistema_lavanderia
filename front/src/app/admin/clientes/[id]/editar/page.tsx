"use client"

import React, { useRef, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowLeft, User, Phone, Mail, Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { useClienteDetail } from "../../hooks/useClienteDetail"
import { actualizarCliente } from "@/domains/clientes/api"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = Number(params.id)

  const { cliente, isLoading } = useClienteDetail(clienteId)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
  })

  // Pre-fill form when data loads
  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
      })
    }
  }, [cliente])

  gsap.registerPlugin(useGSAP)
  useGSAP(() => {
    if (!isLoading && cliente) {
      gsap.fromTo(
        ".fade-in-up",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: "power3.out", clearProps: "transform" }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading, !!cliente] })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    setIsSubmitting(true)
    try {
      await actualizarCliente(clienteId, {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
      })
      toast.success("Cliente actualizado correctamente")
      router.push(`/admin/clientes/${clienteId}`)
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error al actualizar el cliente"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
        <h2 className="text-2xl font-black text-gray-900">Cliente no encontrado</h2>
        <Button onClick={() => router.push("/admin/clientes")} className="mt-6 rounded-full">
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-full bg-gray-50/40">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="fade-in-up flex items-center gap-4 px-4 sm:px-8 pt-6 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={() => router.push(`/admin/clientes/${clienteId}`)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editando</p>
          <h1 className="text-xl font-black text-gray-900 leading-none">{cliente.nombre}</h1>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl">

          {/* Avatar decorativo */}
          <div className="fade-in-up flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-md shadow-amber-200/50">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{cliente.nombre}</h2>
              <p className="text-gray-400 text-sm font-medium">Modifica los datos y guardá los cambios.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nombre */}
            <div className="fade-in-up bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                Nombre Completo *
              </label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 font-medium focus:bg-white transition-colors"
                placeholder="Nombre del cliente"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="fade-in-up bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                </div>
                Teléfono
              </label>
              <Input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value }))}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 font-medium focus:bg-white transition-colors"
                placeholder="Ej: 11 1234 5678"
              />
              <p className="text-xs text-gray-400 font-medium">
                Se usará para comunicaciones por WhatsApp
              </p>
            </div>

            {/* Email */}
            <div className="fade-in-up bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                </div>
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 font-medium focus:bg-white transition-colors"
                placeholder="cliente@email.com"
              />
            </div>

            {/* Actions */}
            <div className="fade-in-up flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full h-12 px-6 font-bold flex-1"
                onClick={() => router.push(`/admin/clientes/${clienteId}`)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full h-12 px-8 font-bold shadow-sm flex-1 gap-2"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
