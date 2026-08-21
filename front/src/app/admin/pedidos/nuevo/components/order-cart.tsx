"use client"

import React, { useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Cliente } from "@/domains/clientes/api"
import { Producto } from "@/domains/productos/api"
import { ShoppingBag, Trash2, Plus, Minus, Loader2, ArrowRight, Calendar, Clock, Zap, Package } from "lucide-react"
import { DateTimePicker } from "@/shared/ui/forms/date-time-picker"
import { getImageUrl } from "@/shared/lib/utils"

export interface CartItem {
  producto: Producto
  cantidad: number
  subtotal: number
}

interface OrderCartProps {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  selectedClient: Cliente | null
  fechaHoraPedido?: Date | undefined
  setFechaHoraPedido?: (v: Date | undefined) => void
  fechaEntregaEstimada: Date | undefined
  setFechaEntregaEstimada: (v: Date | undefined) => void
  onCheckout: () => void
  isSubmitting: boolean
}

export function OrderCart({
  cart,
  setCart,
  selectedClient,
  fechaHoraPedido,
  setFechaHoraPedido,
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
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-background min-h-0 transition-colors">
      {/* Cart Header */}
      <div className="p-5 bg-card border-b border-border flex items-center justify-between shadow-sm z-10 flex-shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-foreground transition-colors">Resumen del Pedido</h2>
            <p className="text-sm text-muted-foreground transition-colors">{itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}</p>
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
      <div className="p-5 bg-card border-b border-border shadow-sm z-10 flex-shrink-0 relative flex flex-col gap-4 transition-colors">
        
        {/* Fecha del Pedido (Ingreso Real) */}
        {setFechaHoraPedido && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between transition-colors">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-purple" />
                Fecha Recepción del Pedido
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Por defecto: Ahora</span>
            </label>
            <div className="relative group">
              <DateTimePicker 
                value={fechaHoraPedido} 
                onChange={setFechaHoraPedido} 
                placeholder="Fecha actual (o seleccionar retroactiva/futura)..."
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 transition-colors">
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
              className="flex-1 py-1.5 px-2 bg-blue-50/50 hover:bg-blue-100 text-brand-blue border border-brand-blue/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800"
            >
              <Zap className="w-3.5 h-3.5" /> 24 hs
            </button>
            <button
              onClick={() => {
                const d = new Date()
                d.setHours(d.getHours() + 48)
                setFechaEntregaEstimada(d)
              }}
              className="flex-1 py-1.5 px-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> 48 hs
            </button>
            <button
              onClick={() => setFechaEntregaEstimada(undefined)}
              className="py-1.5 px-3 bg-muted hover:bg-red-500/10 hover:text-red-500 text-muted-foreground border border-border rounded-xl text-xs font-medium transition-colors"
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
          <span className="text-muted-foreground font-medium transition-colors">Total a cobrar</span>
          <span className="text-2xl font-black text-foreground tracking-tight transition-colors">${total.toLocaleString('es-AR')}</span>
        </div>

        {!selectedClient && cart.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-500 rounded-lg text-sm font-medium transition-colors">
            Por favor, busca y selecciona un cliente primero.
          </div>
        )}

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || !selectedClient || isSubmitting}
          className="w-full bg-brand-blue hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-xl active:scale-[0.98]"
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
            <ShoppingBag className="w-16 h-16 mb-4 text-muted-foreground/30 transition-colors" />
            <p className="font-medium text-muted-foreground text-lg transition-colors">El carrito está vacío</p>
            <p className="text-sm mt-1">Selecciona servicios del catálogo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map(item => {
              const img = getImageUrl(item.producto.imagenUrl)
              return (
                <div key={item.producto.id} className="cart-item bg-card p-3 rounded-xl border border-border shadow-sm flex flex-col gap-2.5 group transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {img ? (
                          <img
                            src={img}
                            alt={item.producto.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                          />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground text-sm leading-snug truncate transition-colors">{item.producto.nombre}</h4>
                    </div>
                    <button 
                      onClick={() => removeItem(item.producto.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-muted rounded-lg border border-border p-1 transition-colors">
                      <button 
                        onClick={() => item.cantidad > 1 ? updateQuantity(item.producto.id, -1) : removeItem(item.producto.id)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-background hover:shadow-sm rounded-md transition-all"
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
                        className="w-12 text-center font-semibold text-sm text-foreground bg-transparent border-none focus:ring-0 p-0 appearance-none m-0 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button 
                        onClick={() => updateQuantity(item.producto.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-background hover:shadow-sm rounded-md transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <span className="font-bold text-foreground transition-colors">
                      ${item.subtotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
