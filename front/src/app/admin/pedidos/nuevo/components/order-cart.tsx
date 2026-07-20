"use client"

import React, { useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Cliente } from "@/domains/clientes/api"
import { Producto } from "@/domains/productos/api"
import { ShoppingBag, Trash2, Plus, Minus, Loader2, ArrowRight, Calendar, Clock, Zap } from "lucide-react"
import { DateTimePicker } from "@/shared/ui/forms/date-time-picker"

export interface CartItem {
  producto: Producto
  cantidad: number
  subtotal: number
}

interface OrderCartProps {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  selectedClient: Cliente | null
  fechaEntregaEstimada: Date | undefined
  setFechaEntregaEstimada: (v: Date | undefined) => void
  onCheckout: () => void
  isSubmitting: boolean
}

export function OrderCart({
  cart,
  setCart,
  selectedClient,
  fechaEntregaEstimada,
  setFechaEntregaEstimada,
  onCheckout,
  isSubmitting
}: OrderCartProps) {

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart])
  const itemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.cantidad, 0), [cart])

  const updateQuantity = (productoId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.producto.id === productoId) {
        const newCantidad = item.cantidad + delta
        if (newCantidad < 1) return item // handled by remove
        return {
          ...item,
          cantidad: newCantidad,
          subtotal: newCantidad * Number(item.producto.precioActual)
        }
      }
      return item
    }))
  }

  const removeItem = (productoId: number) => {
    setCart(prev => prev.filter(item => item.producto.id !== productoId))
  }

  // Animate items entering the cart
  useGSAP(() => {
    if (cart.length > 0) {
      gsap.fromTo(
        ".cart-item",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: "power2.out", clearProps: "all" }
      )
    }
  }, [cart.length]) // only trigger when length changes

  return (
    <div className="h-full flex flex-col bg-gray-50/50 min-h-0">
      {/* Cart Header */}
      <div className="p-5 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Resumen del Pedido</h2>
            <p className="text-sm text-gray-500">{itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}</p>
          </div>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={() => setCart([])}
            className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Cart Action Area (Checkout) */}
      <div className="p-5 bg-white border-b border-gray-100 shadow-sm z-10 flex-shrink-0 relative flex flex-col gap-4">
        
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-blue" />
            Entrega Estimada (Opcional)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date()
                d.setHours(d.getHours() + 24)
                setFechaEntregaEstimada(d)
              }}
              className="flex-1 py-1.5 px-2 bg-blue-50/50 hover:bg-blue-100 text-brand-blue border border-brand-blue/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> 24 hs
            </button>
            <button
              onClick={() => {
                const d = new Date()
                d.setHours(d.getHours() + 48)
                setFechaEntregaEstimada(d)
              }}
              className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> 48 hs
            </button>
            <button
              onClick={() => setFechaEntregaEstimada(undefined)}
              className="py-1.5 px-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 border border-gray-200 rounded-xl text-xs font-medium transition-colors"
            >
              Limpiar
            </button>
          </div>

          <div className="relative group">
            <DateTimePicker 
              value={fechaEntregaEstimada} 
              onChange={setFechaEntregaEstimada} 
              placeholder="Seleccionar fecha y hora..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-500 font-medium">Total a cobrar</span>
          <span className="text-2xl font-black text-gray-900 tracking-tight">${total.toLocaleString('es-AR')}</span>
        </div>

        {!selectedClient && cart.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium">
            Por favor, busca y selecciona un cliente primero.
          </div>
        )}

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || !selectedClient || isSubmitting}
          className="w-full bg-brand-blue hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-xl active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creando Pedido...
            </>
          ) : (
            <>
              Confirmar Pedido
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingBag className="w-16 h-16 mb-4 text-gray-200" />
            <p className="font-medium text-gray-500 text-lg">El carrito está vacío</p>
            <p className="text-sm mt-1">Selecciona servicios del catálogo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map(item => (
              <div key={item.producto.id} className="cart-item bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 group">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-semibold text-gray-900 leading-tight">{item.producto.nombre}</h4>
                  <button 
                    onClick={() => removeItem(item.producto.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                    <button 
                      onClick={() => item.cantidad > 1 ? updateQuantity(item.producto.id, -1) : removeItem(item.producto.id)}
                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={item.cantidad}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) val = 1;
                        if (val > 10000) val = 10000;
                        updateQuantity(item.producto.id, val - item.cantidad);
                      }}
                      className="w-12 text-center font-semibold text-sm text-gray-900 bg-transparent border-none focus:ring-0 p-0 appearance-none m-0 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => updateQuantity(item.producto.id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <span className="font-bold text-gray-900">
                    ${item.subtotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
