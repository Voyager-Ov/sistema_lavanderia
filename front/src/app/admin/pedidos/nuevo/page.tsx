"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { getClientes, Cliente } from "@/domains/clientes/api"
import { getCategorias, Categoria } from "@/domains/categorias/api"
import { getProductos, Producto } from "@/domains/productos/api"
import { crearPedido } from "@/domains/pedidos/api"
import { Button } from "@/shared/ui/forms/button"
import { clsx } from "clsx"

import { ClientSearch } from "./components/client-search"
import { ServiceGrid } from "./components/service-grid"
import { OrderCart, CartItem } from "./components/order-cart"

export default function CrearPedidoPage() {
  const router = useRouter()
  
  // Data State
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)

  // Order State
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | "ALL">("ALL")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState<Date | undefined>(undefined)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          getCategorias(),
          getProductos()
        ])
        setCategorias(catsRes)
        setProductos(prodsRes)
      } catch (error) {
        toast.error("Error al cargar el catálogo de servicios")
        console.error(error)
      } finally {
        setIsFetchingData(false)
      }
    }
    fetchData()
  }, [])

  // Page entry animation
  useGSAP(() => {
    gsap.fromTo(
      ".fade-up-element",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    )
  }, [])

  const handleCreateOrder = async () => {
    if (!selectedClient) {
      toast.error("Debe seleccionar un cliente")
      return
    }
    if (cart.length === 0) {
      toast.error("El pedido debe tener al menos un servicio")
      return
    }

    setIsSubmitting(true)
    try {
      await crearPedido({
        clienteId: selectedClient.id,
        fechaEntregaEstimada: fechaEntregaEstimada ? fechaEntregaEstimada.toISOString() : undefined,
        items: cart.map(c => ({ productoId: c.producto.id, cantidad: c.cantidad }))
      })
      toast.success("¡Pedido creado con éxito!")
      router.push("/admin/pedidos")
      router.refresh()
    } catch (error) {
      toast.error("Hubo un error al crear el pedido")
      console.error(error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="lg:h-[calc(100vh-220px)] min-h-screen bg-gray-50/50 -mx-4 -mt-4 p-4 sm:p-6 lg:p-6 flex flex-col lg:overflow-hidden">
      {/* Header */}
      <div className="fade-up-element flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Crear Pedido</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Selecciona un cliente y agrega los servicios requeridos.</p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 lg:min-h-0">
        
        {/* Left Pane (Catalog & Client) */}
        <div className="flex-1 flex flex-col gap-4 lg:overflow-hidden">
          {/* Client Search & Category Tabs Section */}
          <div className="fade-up-element bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0 relative z-20 flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/5">
              <ClientSearch 
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
              />
            </div>
            <div className="w-full lg:w-3/5 flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Categoría</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-[56px]">
                <Button
                  onClick={() => setActiveCategoryId("ALL")}
                  variant={activeCategoryId === "ALL" ? "secondary" : "outline"}
                  className="flex-shrink-0"
                >
                  Todos
                </Button>
                {categorias.map((cat, index) => {
                  const variants = [
                    { active: "default", inactive: "outlineBlue" },
                    { active: "success", inactive: "outlineGreen" },
                    { active: "warning", inactive: "outlineOrange" },
                    { active: "destructive", inactive: "outlineRed" }
                  ] as const;
                  
                  const currentVariant = variants[index % variants.length];
                  const isActive = activeCategoryId === cat.id;

                  return (
                    <Button
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      variant={isActive ? currentVariant.active : currentVariant.inactive}
                      className="flex-shrink-0"
                    >
                      {cat.nombre}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Catalog Section */}
          <div className="fade-up-element bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 lg:overflow-hidden flex flex-col relative z-10 min-h-[400px] lg:min-h-0">
            <ServiceGrid 
              categorias={categorias}
              productos={productos}
              activeCategoryId={activeCategoryId}
              onCategoryChange={setActiveCategoryId}
              cart={cart}
              setCart={setCart}
              isLoading={isFetchingData}
            />
          </div>
        </div>

        {/* Right Pane (Cart) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] fade-up-element bg-white p-0 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:overflow-hidden relative z-10 flex-shrink-0 min-h-[400px] lg:min-h-0 pb-8 lg:pb-0">
          <OrderCart 
            cart={cart}
            setCart={setCart}
            selectedClient={selectedClient}
            fechaEntregaEstimada={fechaEntregaEstimada}
            setFechaEntregaEstimada={setFechaEntregaEstimada}
            onCheckout={handleCreateOrder}
            isSubmitting={isSubmitting}
          />
        </div>

      </div>
    </div>
  )
}
