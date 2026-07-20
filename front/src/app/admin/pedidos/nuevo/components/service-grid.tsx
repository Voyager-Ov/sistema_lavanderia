"use client"

import React, { useMemo } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Categoria } from "@/domains/categorias/api"
import { Producto } from "@/domains/productos/api"
import { CartItem } from "./order-cart"
import { Loader2, Package, Tag, Clock } from "lucide-react"
import { clsx } from "clsx"

interface ServiceGridProps {
  categorias: Categoria[]
  productos: Producto[]
  activeCategoryId: number | "ALL"
  onCategoryChange: (id: number | "ALL") => void
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  isLoading: boolean
}



export function ServiceGrid({
  categorias,
  productos,
  activeCategoryId,
  onCategoryChange,
  cart,
  setCart,
  isLoading
}: ServiceGridProps) {
  
  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "ALL") return productos
    return productos.filter(p => p.categoriaId === activeCategoryId)
  }, [productos, activeCategoryId])

  // GSAP animation for grid items when filteredProducts change
  useGSAP(() => {
    if (!isLoading && filteredProducts.length > 0) {
      gsap.fromTo(
        ".product-card",
        { opacity: 0, scale: 0.9, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "back.out(1.5)", clearProps: "all" }
      )
    }
  }, [filteredProducts, isLoading])

  const addToCart = (producto: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === producto.id)
      if (existing) {
        return prev.map(item => 
          item.producto.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * Number(producto.precioActual) }
            : item
        )
      }
      return [...prev, { producto, cantidad: 1, subtotal: Number(producto.precioActual) }]
    })
  }

  const renderProduct = (producto: Producto) => {
    const cartItem = cart.find(item => item.producto.id === producto.id)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const imageUrl = producto.imagenUrl ? (producto.imagenUrl.startsWith('http') ? producto.imagenUrl : `${baseUrl}${producto.imagenUrl}`) : null
    
    return (
      <button
        key={producto.id}
        onClick={() => addToCart(producto)}
        className="product-card group text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-blue/30 transition-all duration-300 flex flex-col relative"
      >
        {cartItem && (
          <div className="absolute top-2 right-2 bg-brand-blue text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10">
            {cartItem.cantidad}
          </div>
        )}

        {imageUrl ? (
          <div className="h-28 w-full overflow-hidden flex items-center justify-center bg-gray-50 border-b border-gray-100">
            <img 
              src={imageUrl} 
              alt={producto.nombre}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('bg-gray-100');
              }}
            />
          </div>
        ) : (
          <div className="h-28 w-full bg-gray-50 border-b border-gray-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        
        <div className="p-4 flex-1 flex flex-col relative bg-white z-10">
          <h3 className="font-bold text-gray-900 leading-tight mb-1 group-hover:text-brand-blue transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
          
          {producto.tiempoEstimadoMinutos ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto mb-3">
              <Clock className="w-3 h-3" />
              <span>{producto.tiempoEstimadoMinutos} min</span>
            </div>
          ) : (
            <div className="mt-auto mb-3" />
          )}

          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-gray-900 tracking-tight">
              ${Number(producto.precioActual).toLocaleString('es-AR')}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-brand-blue group-hover:text-white transition-colors">
              <span className="font-bold text-lg leading-none">+</span>
            </div>
          </div>
        </div>
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-blue" />
        <p className="font-medium">Cargando catálogo de servicios...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">


      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-2 -mr-2">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Package className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-medium">No hay servicios en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredProducts.map(producto => renderProduct(producto))}
          </div>
        )}
      </div>
    </div>
  )
}
