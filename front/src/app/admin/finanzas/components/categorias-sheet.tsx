"use client"

import { useState, useEffect } from "react"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { toast } from "sonner"
import { obtenerCategoriasGastos, crearCategoriaGasto, eliminarCategoriaGasto, CategoriaGasto } from "@/domains/caja/categorias-gastos.api"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"
import { Button } from "@/shared/ui/forms/button"
import { Plus, Trash2 } from "lucide-react"
import { Spinner } from "@/shared/ui/feedback/spinner"

interface CategoriasSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoriasSheet({ open, onOpenChange }: CategoriasSheetProps) {
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  const [isCargandoCategorias, setIsCargandoCategorias] = useState(false)
  
  const [nuevaCategoria, setNuevaCategoria] = useState("")
  const [isAgregandoCat, setIsAgregandoCat] = useState(false)

  useEffect(() => {
    if (open) {
      cargarCategorias()
    } else {
      setNuevaCategoria("")
    }
  }, [open])

  const cargarCategorias = async () => {
    try {
      setIsCargandoCategorias(true)
      const data = await obtenerCategoriasGastos()
      setCategorias(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCargandoCategorias(false)
    }
  }

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaCategoria.trim()) return
    try {
      setIsAgregandoCat(true)
      const nueva = await crearCategoriaGasto(nuevaCategoria.trim())
      setCategorias(prev => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNuevaCategoria("")
      toast.success("Categoría creada")
    } catch (e: any) {
      toast.error(e.message || "Error al crear categoría")
    } finally {
      setIsAgregandoCat(false)
    }
  }

  const handleEliminarCategoria = async (id: number) => {
    if(!confirm("¿Seguro que deseas eliminar esta categoría? No afectará a los gastos ya registrados.")) return;
    try {
      await eliminarCategoriaGasto(id)
      setCategorias(prev => prev.filter(c => c.id !== id))
      toast.success("Categoría eliminada")
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar categoría")
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="flex flex-col">
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Administrar Categorías</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            Gestiona las categorías de tus insumos y gastos operativos.
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="flex-1 mt-6 flex flex-col h-full overflow-hidden">
          <form onSubmit={handleCrearCategoria} className="flex gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 shrink-0">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Nueva Categoría</Label>
              <Input 
                placeholder="Ej: Insumos, Sueldos..." 
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="h-10 bg-white"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!nuevaCategoria.trim() || isAgregandoCat}
              className="h-10 px-4"
            >
              {isAgregandoCat ? <Spinner size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
              Agregar
            </Button>
          </form>

          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Tus Categorías</Label>
            {isCargandoCategorias ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="default" className="text-muted-foreground" />
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl border-dashed">
                Aún no hay categorías registradas.
              </div>
            ) : (
              <div className="grid gap-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm hover:border-slate-300 transition-colors">
                    <span className="font-medium text-sm text-slate-800">{cat.nombre}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleEliminarCategoria(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
