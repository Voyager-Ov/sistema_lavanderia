"use client"

import { useState, useEffect } from "react"
import { Pedido } from "@/domains/pedidos/api"
import { MetodoPago, obtenerMetodosPago, registrarPago } from "@/domains/pagos/api"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { Button } from "@/shared/ui/forms/button"
import { Label } from "@/shared/ui/forms/label"
import { toast } from "sonner"
import { Banknote, CreditCard, Wallet, Smartphone, Landmark, QrCode, Building, Gem, DollarSign, Loader2 } from "lucide-react"

const ICON_MAP: Record<string, any> = {
  Banknote,
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  QrCode,
  Building,
  Gem,
  DollarSign
}

interface BulkChargeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidos: Pedido[]
  onSuccess: () => void
}

export function BulkChargeModal({ open, onOpenChange, pedidos, onSuccess }: BulkChargeModalProps) {
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [selectedMetodo, setSelectedMetodo] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Solo considerar pedidos no cobrados
  const pedidosAPagar = pedidos.filter(p => !p.cobrado)
  const totalACobrar = pedidosAPagar.reduce((acc, p) => acc + parseFloat(p.total as any), 0)

  // Cargar métodos de pago
  useEffect(() => {
    if (open) {
      obtenerMetodosPago()
        .then((data) => {
          const activos = data.filter(m => m.activo)
          setMetodos(activos)
          if (activos.length > 0) {
            const efectivo = activos.find(m => m.nombre.toLowerCase().includes('efectivo'));
            setSelectedMetodo(efectivo ? efectivo.id.toString() : activos[0].id.toString())
          }
        })
        .catch(() => toast.error("Error al cargar los métodos de pago"))
    } else {
      setSelectedMetodo("")
    }
  }, [open])

  const handleBulkCharge = async () => {
    if (pedidosAPagar.length === 0 || !selectedMetodo) return

    setLoading(true)
    let successCount = 0
    let failCount = 0

    for (const pedido of pedidosAPagar) {
      try {
        await registrarPago({
          pedidoId: pedido.id,
          metodoPagoId: parseInt(selectedMetodo),
          monto: parseFloat(pedido.total.toString()),
        })
        successCount++
      } catch (error) {
        console.error("Error al cobrar pedido", pedido.id, error)
        failCount++
      }
    }

    setLoading(false)
    if (successCount > 0) {
      toast.success(`Se cobraron ${successCount} pedidos correctamente.`)
    }
    if (failCount > 0) {
      toast.error(`Hubo error al cobrar ${failCount} pedidos.`)
    }
    
    if (successCount > 0) {
      onSuccess()
    }
    onOpenChange(false)
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Banknote className="h-6 w-6 text-green-600" />
          Cobro Múltiple
        </div> as any
      }
      description={`Registra el pago para ${pedidosAPagar.length} pedidos seleccionados.`}
    >
      <div className="flex-1 space-y-6">
        {pedidosAPagar.length === 0 ? (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm">
            Todos los pedidos seleccionados ya han sido cobrados. No hay acciones disponibles.
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Pedidos a cobrar</span>
                <span className="font-semibold text-gray-900">{pedidosAPagar.length}</span>
              </div>
              <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Total a Pagar</span>
                <span className="font-bold text-green-600">${totalACobrar.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Método de Pago para todos</Label>
                <div className="grid grid-cols-2 gap-3">
                  {metodos.map((metodo) => {
                    const isSelected = selectedMetodo === metodo.id.toString()
                    const Icon = (metodo as any).icono ? (ICON_MAP[(metodo as any).icono] || Banknote) : Banknote;

                    return (
                      <div 
                        key={metodo.id}
                        onClick={() => setSelectedMetodo(metodo.id.toString())}
                        className={`
                          cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                          ${isSelected 
                            ? 'border-green-600 bg-green-50 shadow-md shadow-green-100 scale-[1.02]' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                        <span className={`text-sm font-semibold text-center ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                          {metodo.nombre}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Este método se aplicará automáticamente a todos los pedidos por el monto exacto adeudado de cada uno. No se calcula vuelto masivamente.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full mt-6">
        <Button 
          className="w-full h-12 rounded-xl text-base font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50" 
          onClick={handleBulkCharge}
          disabled={loading || !selectedMetodo || pedidosAPagar.length === 0}
        >
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
          {loading ? "Procesando Cobros..." : "Confirmar Cobro Masivo"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl text-base font-bold" 
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </FormSheet>
  )
}
