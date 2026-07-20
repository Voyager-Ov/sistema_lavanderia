"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { apiClient } from "@/shared/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Textarea } from "@/shared/ui/forms/textarea"
import { Label } from "@/shared/ui/forms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Switch } from "@/shared/ui/forms/switch"
import {
  Loader2, ArrowLeft, Save, Plus, Upload, X,
  Package, Tag, Clock, DollarSign, FileText, CheckCircle
} from "lucide-react"

interface ServicioFormProps {
  id?: string
}

gsap.registerPlugin(useGSAP)

export function ServicioForm({ id }: ServicioFormProps) {
  const isEditing = !!id
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const dropZoneRef = useRef<HTMLLabelElement>(null)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precioActual: "",
    tiempoEstimadoMinutos: "",
    categoriaId: "",
    disponible: true,
    imagenUrl: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(".form-section",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out", clearProps: "all" }
      )
    }
  }, { scope: containerRef, dependencies: [loading] })

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
      setPreviewUrl(formData.imagenUrl
        ? (formData.imagenUrl.startsWith('http') ? formData.imagenUrl : `${baseUrl}${formData.imagenUrl}`)
        : "")
    }
  }, [imageFile, formData.imagenUrl])

  useEffect(() => {
    const init = async () => {
      try {
        const catRes: any = await apiClient.get("/categorias")
        setCategorias(catRes.data?.items || catRes.data || [])

        if (isEditing) {
          const sRes: any = await apiClient.get(`/productos/${id}`)
          const s = sRes.data
          setFormData({
            nombre: s.nombre || "",
            descripcion: s.descripcion || "",
            precioActual: s.precioActual?.toString() || "",
            tiempoEstimadoMinutos: s.tiempoEstimadoMinutos?.toString() || "",
            categoriaId: s.categoria?.id?.toString() || "",
            disponible: s.disponible,
            imagenUrl: s.imagenUrl || "",
          })
        }
      } catch (err: any) {
        toast.error("Error al cargar datos: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id, isEditing])

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Solo se permiten archivos JPG, PNG o WEBP")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 2MB")
      return
    }
    setImageFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.precioActual || !formData.categoriaId) {
      toast.error("El nombre, precio y categoría son obligatorios")
      return
    }

    setSaving(true)
    try {
      const payload = new FormData()
      payload.append("nombre", formData.nombre)
      payload.append("descripcion", formData.descripcion)
      payload.append("precioActual", formData.precioActual.toString())
      payload.append("categoriaId", formData.categoriaId.toString())
      payload.append("disponible", formData.disponible.toString())
      if (formData.tiempoEstimadoMinutos) {
        payload.append("tiempoEstimadoMinutos", formData.tiempoEstimadoMinutos.toString())
      }
      if (imageFile) {
        payload.append("imagen", imageFile)
      }

      if (isEditing) {
        await apiClient.putForm(`/productos/${id}`, payload)
        toast.success("Servicio actualizado correctamente")
        router.push(`/admin/servicios/${id}`)
      } else {
        await apiClient.postForm("/productos", payload)
        toast.success("Servicio creado exitosamente")
        router.push("/admin/servicios")
      }
    } catch (err: any) {
      toast.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el servicio: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
          <p className="text-sm font-medium text-gray-400">Cargando datos del servicio...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* Header */}
      <div className="form-section flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              {isEditing ? "Editar Servicio" : "Nuevo Servicio"}
            </h1>
            <span className="px-2 py-0.5 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-bold">
              {isEditing ? "Edición" : "Creación"}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEditing
              ? "Modificá los datos del servicio. Los cambios se aplican de inmediato."
              : "Completá los datos para agregar un nuevo servicio al catálogo."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column - main fields */}
          <div className="xl:col-span-2 space-y-4">

            {/* Imagen upload */}
            <div className="form-section bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-sm text-gray-700">Imagen del Servicio</span>
                <span className="text-xs text-gray-400 font-medium">(Punto de Venta)</span>
              </div>
              <div className="p-6">
                <div className="flex gap-4 items-start">
                  {/* Dropzone */}
                  <label
                    ref={dropZoneRef}
                    htmlFor="imagenFile"
                    className={`flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[140px] ${
                      isDragging
                        ? "border-brand-blue bg-brand-blue/5 scale-[1.01]"
                        : "border-gray-200 hover:border-brand-blue/50 hover:bg-gray-50/80"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      id="imagenFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFile(e.target.files[0])
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-600">
                        {imageFile ? imageFile.name : "Arrastrá o hacé click para subir"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — máx. 2MB</p>
                    </div>
                  </label>

                  {/* Preview */}
                  {previewUrl ? (
                    <div className="relative w-36 h-36 shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group">
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setFormData(p => ({ ...p, imagenUrl: "" }))
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] font-bold py-1 text-center">
                        VISTA PREVIA
                      </div>
                    </div>
                  ) : (
                    <div className="w-36 h-36 shrink-0 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-gray-200" />
                      <span className="text-[10px] font-bold text-gray-300 text-center">SIN IMAGEN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info general */}
            <div className="form-section bg-white rounded-2xl border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-sm text-gray-700">Información General</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre" className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Nombre del Servicio *
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ej: Lavado Acolchado 2 Plazas"
                      className="h-11 rounded-xl border border-gray-200 focus-visible:ring-brand-blue font-semibold bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="categoria" className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Categoría *
                    </Label>
                    <Select
                      value={formData.categoriaId || ""}
                      onValueChange={(val) => setFormData(p => ({ ...p, categoriaId: val }))}
                    >
                      <SelectTrigger id="categoria" className="h-11 rounded-xl border border-gray-200 font-semibold bg-gray-50/50">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="descripcion" className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Descripción
                  </Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion || ""}
                    onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Detalles del servicio, materiales utilizados, recomendaciones..."
                    className="min-h-[100px] rounded-xl border border-gray-200 focus-visible:ring-brand-blue font-medium resize-none bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column - pricing & settings */}
          <div className="space-y-4">

            {/* Precio y tiempo */}
            <div className="form-section bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-sm text-gray-700">Precio y Tiempo</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="precio" className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Precio Actual ($) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                    <Input
                      id="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precioActual || ""}
                      onChange={(e) => setFormData(p => ({ ...p, precioActual: e.target.value }))}
                      placeholder="0.00"
                      className="h-11 rounded-xl border border-gray-200 pl-7 font-bold text-gray-900 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tiempo" className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Tiempo Estimado
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="tiempo"
                      type="number"
                      min="0"
                      value={formData.tiempoEstimadoMinutos || ""}
                      onChange={(e) => setFormData(p => ({ ...p, tiempoEstimadoMinutos: e.target.value }))}
                      placeholder="minutos"
                      className="h-11 rounded-xl border border-gray-200 pl-10 font-semibold bg-gray-50/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="form-section bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Servicio Disponible</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium leading-relaxed">
                    Los servicios inactivos no aparecen en el Punto de Venta ni en nuevos pedidos.
                  </p>
                </div>
                <Switch
                  checked={formData.disponible}
                  onCheckedChange={(val) => setFormData(p => ({ ...p, disponible: val }))}
                  className="shrink-0 mt-0.5"
                />
              </div>
              <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                formData.disponible
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-gray-50 text-gray-500 border border-gray-100"
              }`}>
                <CheckCircle className="w-3.5 h-3.5" />
                {formData.disponible ? "Activo — visible en el catálogo" : "Inactivo — oculto del catálogo"}
              </div>
            </div>

            {/* Acciones */}
            <div className="form-section space-y-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-12 rounded-xl font-bold shadow-sm text-sm"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                  : isEditing
                    ? <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>
                    : <><Plus className="w-4 h-4 mr-2" />Crear Servicio</>
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl font-bold text-sm"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
