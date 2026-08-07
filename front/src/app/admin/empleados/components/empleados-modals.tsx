import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/overlays/dialog"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { apiClient } from "@/shared/lib/api-client"

const createSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  sueldoBase: z.coerce.number().min(0).optional(),
  horasSemanalesObjetivo: z.coerce.number().min(0).optional().default(40),
})

const editSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  sueldoBase: z.coerce.number().min(0).optional(),
  horasSemanalesObjetivo: z.coerce.number().min(0).optional().default(40),
})

export function EmpleadosModals({ props, onActionSuccess }: { props: any, onActionSuccess: () => void }) {
  const { token } = useAuthStore()
  
  const createForm = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      sueldoBase: 0,
      horasSemanalesObjetivo: 40
    }
  })

  const editForm = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nombre: "",
      sueldoBase: 0,
      horasSemanalesObjetivo: 40
    }
  })

  useEffect(() => {
    if (props.empleadoToEdit && props.isEditarOpen) {
      editForm.reset({
        nombre: props.empleadoToEdit.nombre,
        sueldoBase: props.empleadoToEdit.sueldoBase || 0,
        horasSemanalesObjetivo: props.empleadoToEdit.horasSemanalesObjetivo || 40,
      })
    }
  }, [props.empleadoToEdit, props.isEditarOpen, editForm])

  useEffect(() => {
    const handleOpenCrear = () => props.setIsCrearOpen(true)
    document.addEventListener('openCrearEmpleado', handleOpenCrear)
    return () => document.removeEventListener('openCrearEmpleado', handleOpenCrear)
  }, [props])

  const onSubmitCreate = async (data: any) => {
    try {
      const res = await apiClient.post<any>(`/usuarios`, { ...data, rol: "EMPLEADO" })
      if (res.success || res.data) {
        props.setIsCrearOpen(false)
        createForm.reset()
        onActionSuccess()
      } else {
        alert("Error al crear empleado")
      }
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Error al crear empleado")
    }
  }

  const onSubmitEdit = async (data: any) => {
    if (!props.empleadoToEdit) return
    try {
      const res = await apiClient.put<any>(`/usuarios/${props.empleadoToEdit.id}`, data)
      if (res.success || res.data) {
        props.setIsEditarOpen(false)
        onActionSuccess()
      } else {
        alert("Error al editar empleado")
      }
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Error al editar empleado")
    }
  }

  const onDesactivar = async () => {
    if (!props.empleadoToDesactivar) return
    try {
      const res = await apiClient.patch<any>(`/usuarios/${props.empleadoToDesactivar.id}/estado`, {})
      if (res.success || res.data) {
        props.setIsDesactivarOpen(false)
        onActionSuccess()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <ResponsiveSheet open={props.isCrearOpen} onOpenChange={props.setIsCrearOpen}>
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader className="mb-6">
            <ResponsiveSheetTitle>Nuevo Empleado</ResponsiveSheetTitle>
            <ResponsiveSheetDescription>
              Crea un nuevo empleado. Se le asignará el rol EMPLEADO.
            </ResponsiveSheetDescription>
          </ResponsiveSheetHeader>
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
              <input 
                {...createForm.register("nombre")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ej. Juan Pérez"
              />
              {createForm.formState.errors.nombre && (
                <span className="text-red-500 text-xs">{createForm.formState.errors.nombre.message as string}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input 
                {...createForm.register("email")}
                type="email"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="juan@ejemplo.com"
              />
              {createForm.formState.errors.email && (
                <span className="text-red-500 text-xs">{createForm.formState.errors.email.message as string}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <input 
                {...createForm.register("password")}
                type="password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="******"
              />
              {createForm.formState.errors.password && (
                <span className="text-red-500 text-xs">{createForm.formState.errors.password.message as string}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Sueldo Base</label>
                <input 
                  {...createForm.register("sueldoBase")}
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Horas Objetivo (sem.)</label>
                <input 
                  {...createForm.register("horasSemanalesObjetivo")}
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="40"
                />
              </div>
            </div>
            <div className="mt-auto pt-6 flex gap-3">
              <button 
                type="button" 
                onClick={() => props.setIsCrearOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={createForm.formState.isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Crear Empleado
              </button>
            </div>
          </form>
        </ResponsiveSheetContent>
      </ResponsiveSheet>

      <ResponsiveSheet open={props.isEditarOpen} onOpenChange={props.setIsEditarOpen}>
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader className="mb-6">
            <ResponsiveSheetTitle>Editar Empleado</ResponsiveSheetTitle>
            <ResponsiveSheetDescription>
              Modifica los detalles del empleado.
            </ResponsiveSheetDescription>
          </ResponsiveSheetHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
              <input 
                {...editForm.register("nombre")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {editForm.formState.errors.nombre && (
                <span className="text-red-500 text-xs">{editForm.formState.errors.nombre.message as string}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Sueldo Base</label>
                <input 
                  {...editForm.register("sueldoBase")}
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Horas Objetivo (sem.)</label>
                <input 
                  {...editForm.register("horasSemanalesObjetivo")}
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="mt-auto pt-6 flex gap-3">
              <button 
                type="button" 
                onClick={() => props.setIsEditarOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={editForm.formState.isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </ResponsiveSheetContent>
      </ResponsiveSheet>

      <Dialog open={props.isDesactivarOpen} onOpenChange={props.setIsDesactivarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar Empleado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas desactivar a {props.empleadoToDesactivar?.nombre}?
              Ya no podrá acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button 
              onClick={() => props.setIsDesactivarOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={onDesactivar}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Desactivar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
