import React, { useState } from "react";
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet";
import { Categoria, crearCategoria, actualizarCategoria, eliminarCategoria } from "@/domains/categorias/api";
import { toast } from "sonner";
import { Input } from "@/shared/ui/forms/input";
import { Button } from "@/shared/ui/forms/button";
import { Trash2, Edit2, Plus, Loader2, Save, X } from "lucide-react";

interface CategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  refreshCategorias: () => void;
}

export function CategoriasModal({ isOpen, onClose, categorias, refreshCategorias }: CategoriasModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  
  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await crearCategoria({ nombre: trimmed });
      toast.success("Categoría creada");
      setNewName("");
      refreshCategorias();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear categoría";
      toast.error(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await actualizarCategoria(id, { nombre: trimmed });
      toast.success("Categoría actualizada");
      setEditingId(null);
      refreshCategorias();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al actualizar categoría";
      toast.error(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría? (Asegúrate de que no tenga servicios asociados)")) return;
    setLoading(true);
    try {
      await eliminarCategoria(id);
      toast.success("Categoría eliminada");
      refreshCategorias();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al eliminar categoría";
      toast.error(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Gestión de Categorías</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            Crea, edita o elimina las categorías de servicios.
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="flex flex-col gap-6 mt-4">
          {/* Create */}
          <div className="flex gap-2 items-center bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl border border-gray-100 dark:border-neutral-700">
            <Input 
              placeholder="Nueva categoría..." 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              disabled={loading}
              className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={loading || !newName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 shrink-0 shadow-sm transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {/* List */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-500 dark:text-neutral-400 mb-2">Categorías existentes</h3>
            {categorias.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-neutral-500 italic text-center py-4">No hay categorías registradas.</p>
            ) : (
              categorias.map((cat: Categoria) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all bg-white dark:bg-neutral-800/80 group">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        disabled={loading}
                        autoFocus
                        className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleUpdate(cat.id)} disabled={loading} className="text-green-600 dark:text-green-400 shrink-0">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} disabled={loading} className="text-gray-400 dark:text-neutral-500 shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-800 dark:text-neutral-100">{cat.nombre}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(cat.id); setEditName(cat.nombre); }} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8">
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
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
