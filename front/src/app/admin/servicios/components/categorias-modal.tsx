import React, { useState } from "react"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { apiClient } from "@/shared/lib/api-client"
import { toast } from "sonner"
import { Input } from "@/shared/ui/forms/input"
import { Button } from "@/shared/ui/forms/button"
import { Trash2, Edit2, Plus, Loader2, Save, X } from "lucide-react"

export function CategoriasModal({ isOpen, onClose, categorias, refreshCategorias }: any) {
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [newName, setNewName] = useState("")
  
  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      await apiClient.post("/categorias", { nombre: newName })
      toast.success("Categoría creada")
      setNewName("")
      refreshCategorias()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return
    setLoading(true)
    try {
      await apiClient.put(`/categorias/${id}`, { nombre: editName })
      toast.success("Categoría actualizada")
      setEditingId(null)
      refreshCategorias()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría? (Asegúrate de que no tenga servicios asociados)")) return
    setLoading(true)
    try {
      await apiClient.delete(`/categorias/${id}`)
      toast.success("Categoría eliminada")
      refreshCategorias()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Gestión de Categorías"
      description="Crea, edita o elimina las categorías de servicios."
    >
      <div className="flex flex-col gap-6 mt-4">
        {/* Create */}
        <div className="flex gap-2 items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Input 
            placeholder="Nueva categoría..." 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={loading || !newName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 shrink-0 shadow-sm transition-all">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-gray-500 mb-2">Categorías existentes</h3>
          {categorias?.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">No hay categorías registradas.</p>
          ) : (
            categorias?.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all bg-white group">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      disabled={loading}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(cat.id)} disabled={loading} className="text-green-600 shrink-0">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} disabled={loading} className="text-gray-400 shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-gray-800">{cat.nombre}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(cat.id); setEditName(cat.nombre); }} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </FormSheet>
  )
}
