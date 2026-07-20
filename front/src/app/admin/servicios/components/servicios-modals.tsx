import React from "react"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/shared/lib/api-client"
import { CategoriasModal } from "./categorias-modal"

export function ServiciosModals({ data, actions, modals }: any) {
  return (
    <>
      <HistorySheet 
        isOpen={modals.isHistoryModalOpen} 
        onClose={() => { modals.setIsHistoryModalOpen(false); modals.setServicioToHistory(null); }}
        servicio={modals.servicioToHistory}
      />

      <CategoriasModal
        isOpen={modals.isCategoriesModalOpen}
        onClose={() => modals.setIsCategoriesModalOpen(false)}
        categorias={data.categorias}
        refreshCategorias={data.fetchCategorias}
      />
    </>
  )
}

function HistorySheet({ isOpen, onClose, servicio }: any) {
  const [history, setHistory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && servicio) {
      const fetchHistory = async () => {
        setLoading(true)
        try {
          const data: any = await apiClient.get(`/productos/${servicio.id}/historial`)
          setHistory(data.data || [])
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }
      fetchHistory()
    }
  }, [isOpen, servicio])

  return (
    <FormSheet 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      title="Historial de Precios"
      description={servicio?.nombre}
    >
      <div className="mt-2 min-h-[300px]">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
            <p className="text-gray-500 font-medium">No hay historial de cambios</p>
            <p className="text-xs text-gray-400 mt-1">Este servicio mantiene su precio original.</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-300 before:to-transparent">
            {history.map((h: any, i: number) => (
              <div key={h.id} className="relative flex items-center gap-4 group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white bg-indigo-100 text-indigo-500 shadow shrink-0 z-10 shadow-indigo-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                </div>
                <div className="flex-1 p-4 rounded-xl border border-gray-100 bg-gray-50/80 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-black text-xl text-indigo-900">${Number(h.precioNuevo).toLocaleString("es-AR")}</div>
                    <time className="font-medium text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</time>
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    Precio anterior: <span className="line-through opacity-70">${Number(h.precioAnterior).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormSheet>
  )
}
