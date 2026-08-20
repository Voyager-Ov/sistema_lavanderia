"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { toast } from "sonner"
import { LayoutDashboard, ShoppingCart, Pause, Clock } from "lucide-react"
import { clsx } from "clsx"

import { Cliente } from "@/domains/clientes/api"
import { getCategorias, Categoria } from "@/domains/categorias/api"
import { getProductos, Producto } from "@/domains/productos/api"
import { crearPedido } from "@/domains/pedidos/api"
import { obtenerCajaActual, CajaActual } from "@/domains/caja/caja.api"
import { Button } from "@/shared/ui/forms/button"

// Reuse Admin Components
import { ServiceGrid } from "@/app/admin/pedidos/nuevo/components/service-grid"
import { OrderCart, CartItem } from "@/app/admin/pedidos/nuevo/components/order-cart"

// POS Specific Components
import { PosClientSearch } from "./components/pos-client-search"
import { PosKanban } from "./components/pos-kanban"
import { AbrirCajaPosCard } from "@/app/admin/pos/components/abrir-caja-pos-card"
import { PosHeaderActions } from "@/app/admin/pos/components/pos-header-actions"
import { RegistrarGastoModal } from "@/app/admin/caja/components/registrar-gasto-modal"
import { ResumenCierreTurnoView } from "@/app/admin/pos/components/resumen-cierre-turno-view"

interface ParkedCart {
  id: string
  client: Cliente | null
  cart: CartItem[]
  fecha: Date | undefined
  timestamp: number
}

export default function TerminalPage() {
  const router = useRouter()

  // Caja State
  const [cajaActual, setCajaActual] = useState<CajaActual | null>(null)
  const [isLoadingCaja, setIsLoadingCaja] = useState<boolean>(true)
  const [currentView, setCurrentView] = useState<"OPERATIVO" | "RESUMEN">("OPERATIVO")
  const [openGastoModal, setOpenGastoModal] = useState<boolean>(false)
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<"NUEVO" | "KANBAN">("NUEVO")

  // Data State
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)

  // Order State
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | "ALL">("ALL")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState<Date | undefined>(undefined)

  // Parked Carts State
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([])

  // Fetch caja actual
  const fetchCaja = useCallback(async () => {
    try {
      setIsLoadingCaja(true)
      const data = await obtenerCajaActual()
      setCajaActual(data)
    } catch (err: any) {
      console.error("Error al cargar la caja actual:", err)
      setCajaActual(null)
    } finally {
      setIsLoadingCaja(false)
    }
  }, [])

  useEffect(() => {
    fetchCaja()
  }, [fetchCaja])

  // Fetch initial catalog
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          getCategorias(),
          getProductos()
        ])
        setCategorias(catsRes)
        setProductos(prodsRes.filter(p => p.activo !== false && p.disponible !== false))
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

  const handleParkCart = () => {
    if (cart.length === 0) return
    const newParked: ParkedCart = {
      id: Math.random().toString(36).substring(7),
      client: selectedClient,
      cart: [...cart],
      fecha: fechaEntregaEstimada,
      timestamp: Date.now()
    }
    setParkedCarts([...parkedCarts, newParked])
    setCart([])
    setSelectedClient(null)
    setFechaEntregaEstimada(undefined)
    toast.info("Ticket pausado y guardado en espera")
  }

  const handleRestoreCart = (parkedId: string) => {
    const parked = parkedCarts.find(p => p.id === parkedId)
    if (!parked) return
    
    if (cart.length > 0) {
      const currentToPark: ParkedCart = {
        id: Math.random().toString(36).substring(7),
        client: selectedClient,
        cart: [...cart],
        fecha: fechaEntregaEstimada,
        timestamp: Date.now()
      }
      setParkedCarts(prev => [...prev.filter(p => p.id !== parkedId), currentToPark])
    } else {
      setParkedCarts(prev => prev.filter(p => p.id !== parkedId))
    }

    setCart(parked.cart)
    setSelectedClient(parked.client)
    setFechaEntregaEstimada(parked.fecha)
    setActiveTab("NUEVO")
    toast.success("Ticket restaurado")
  }

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
      
      setCart([])
      setSelectedClient(null)
      setFechaEntregaEstimada(undefined)
      
    } catch (error) {
      toast.error("Hubo un error al crear el pedido")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCajaAbierta = Boolean(
    cajaActual && (cajaActual.estado === "ABIERTA" || cajaActual.estadoCaja === "Abierta")
  )

  if (isLoadingCaja) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-500 dark:text-neutral-400">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Verificando estado de caja POS...</p>
      </div>
    )
  }

  const renderTerminalContent = () => (
    <div className="flex-1 flex flex-col h-full gap-3 w-full p-2 sm:px-4 sm:pt-1 sm:pb-4 lg:overflow-hidden bg-gray-50/50 dark:bg-background transition-colors">
      
      {/* Tabs compactos, Filtros y Acciones rápidas de Caja */}
      <div className="fade-up-element flex items-center justify-between flex-shrink-0 z-20 overflow-x-auto pb-1 gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-1 rounded-xl shadow-sm transition-colors flex-shrink-0">
            <button
              onClick={() => setActiveTab("NUEVO")}
              className={clsx(
                "flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === "NUEVO" 
                  ? "bg-brand-blue text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              Nueva Orden
            </button>
            <button
              onClick={() => setActiveTab("KANBAN")}
              className={clsx(
                "flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === "KANBAN" 
                  ? "bg-brand-blue text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Producción
            </button>
          </div>

          {/* Category Filters in Header (Only show in NUEVO tab) */}
          {activeTab === "NUEVO" && (
            <div className="flex items-center gap-2 border-l border-gray-300 dark:border-neutral-700 pl-4 flex-shrink-0">
              <Button
                onClick={() => setActiveCategoryId("ALL")}
                variant={activeCategoryId === "ALL" ? "secondary" : "outline"}
                className="flex-shrink-0 rounded-xl h-[36px]"
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
                return (
                  <Button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    variant={activeCategoryId === cat.id ? currentVariant.active : currentVariant.inactive}
                    className="flex-shrink-0 rounded-xl h-[36px]"
                  >
                    {cat.nombre}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Burbujas de tickets pausados */}
          <div className="flex items-center gap-2 flex-shrink-0 border-l border-gray-300 dark:border-neutral-700 pl-4">
            {cart.length > 0 && activeTab === "NUEVO" && (
              <button 
                onClick={handleParkCart}
                className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-sm h-[36px]"
              >
                <Pause className="w-3.5 h-3.5" /> Pausar
              </button>
            )}
            
            {parkedCarts.map(pc => (
              <button 
                key={pc.id}
                onClick={() => handleRestoreCart(pc.id)}
                className="text-xs border-2 border-brand-blue/20 bg-blue-50 text-brand-blue hover:bg-blue-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors shadow-sm h-[36px]"
              >
                <Clock className="w-3.5 h-3.5" /> 
                <span className="truncate max-w-[100px]">{pc.client ? pc.client.nombre : 'Consumidor'}</span>
                <span className="bg-brand-blue text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{pc.cart.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones Estándar de Acciones Rápidas: Registrar Gasto & Cerrar Turno */}
        {cajaActual && (
          <PosHeaderActions
            caja={cajaActual}
            onOpenGastoModal={() => setOpenGastoModal(true)}
            onOpenCierreModal={() => setCurrentView("RESUMEN")}
          />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        
        {/* TAB 1: KANBAN */}
        <div className={clsx("absolute inset-0 transition-opacity duration-300 flex flex-col", activeTab === "KANBAN" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
          <PosKanban isActive={activeTab === "KANBAN"} />
        </div>

        {/* TAB 2: NUEVO PEDIDO */}
        <div className={clsx("absolute inset-0 transition-opacity duration-300 flex flex-col lg:flex-row gap-4", activeTab === "NUEVO" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
          
          {/* Left Pane (Catalog & Client) */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
            {/* Client Search Section */}
            <div className="fade-up-element bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/50 p-4 rounded-2xl shadow-sm flex-shrink-0 relative z-20 flex flex-col gap-4 transition-colors">
              <PosClientSearch 
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
              />
            </div>

            {/* Catalog Grid Section */}
            <div className="fade-up-element bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/50 p-4 rounded-2xl shadow-sm flex-1 lg:overflow-hidden flex flex-col relative z-10 min-h-[400px] lg:min-h-0 transition-colors">
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
          <div className="w-full lg:w-[380px] xl:w-[420px] fade-up-element bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/50 p-0 rounded-2xl shadow-sm flex flex-col lg:overflow-hidden relative z-10 flex-shrink-0 min-h-[400px] lg:min-h-0 pb-8 lg:pb-0 transition-colors">
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

      {/* Registrar Gasto Modal (usando ResponsiveSheet) */}
      <RegistrarGastoModal
        open={openGastoModal}
        onOpenChange={setOpenGastoModal}
        onSuccess={fetchCaja}
      />
    </div>
  )

  // Si la caja NO está abierta: renderizar POS desenfocado de fondo + modal de Apertura centrado
  if (!isCajaAbierta) {
    return (
      <div className="relative flex-1 flex flex-col h-full w-full overflow-hidden">
        <div className="flex-1 flex flex-col h-full w-full pointer-events-none select-none filter blur-[3px] opacity-85 transition-all duration-500 overflow-hidden">
          {renderTerminalContent()}
        </div>

        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <AbrirCajaPosCard onCajaAbierta={(nuevaCaja) => setCajaActual(nuevaCaja)} />
        </div>
      </div>
    )
  }

  // Si se presiona "Cerrar Turno POS": vista de Arqueo y Resumen
  if (currentView === "RESUMEN" && cajaActual) {
    return (
      <ResumenCierreTurnoView
        caja={cajaActual}
        onVolverPos={() => setCurrentView("OPERATIVO")}
        onCajaCerrada={() => {
          fetchCaja()
          setCurrentView("OPERATIVO")
        }}
      />
    )
  }

  return renderTerminalContent()
}
