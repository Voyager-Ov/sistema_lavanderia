"use client"

import React, { useEffect, useState, useRef } from "react"
import { getPedidoById, Pedido } from "@/domains/pedidos/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Printer, CheckCircle2, Circle, Clock, Check, ReceiptText, Banknote, MapPin, User, FileText, Ticket, XCircle } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/data-display/card"
import { Badge } from "@/shared/ui/data-display/badge"
import { cn, formatCurrency } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/forms/button"
import { Separator } from "@/shared/ui/layout/separator"
import { TicketPrintTemplate } from "./ticket-print-template"
import { getTicketsPedidoAPI, generarTicketsAPI } from "@/domains/pedidos/api"
import { toast } from "sonner"

interface PedidoDetailViewProps {
  id: number
  onPrintTicket?: (id: number) => void
  onCobrar?: (pedido: Pedido) => void
  onGenerateFactura?: (id: number) => void
  hideActions?: boolean
}

export function PedidoDetailView({ id, onPrintTicket, onCobrar, onGenerateFactura, hideActions }: PedidoDetailViewProps) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [tickets, setTickets] = useState<any[]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const printTemplateRef = useRef<HTMLDivElement>(null)

  gsap.registerPlugin(useGSAP)

  useEffect(() => {
    let mounted = true
    const fetchPedido = async () => {
      try {
        setIsLoading(true)
        const data = await getPedidoById(id)
        if (mounted) {
          setPedido(data)
          const fetchedTickets = await getTicketsPedidoAPI(id).catch(() => [])
          setTickets(fetchedTickets)
          setError(null)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Error al cargar pedido")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    if (id) fetchPedido()
    return () => { mounted = false }
  }, [id])

  const handleGenerateAndPrint = async () => {
    if (!pedido) return;
    try {
      toast.info("Generando ticket...")
      const newTickets = await generarTicketsAPI(pedido.id, 1);
      setTickets(newTickets);
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (err: any) {
      toast.error(err.message || "Error al generar ticket");
    }
  }

  useGSAP(() => {
    if (!isLoading && pedido) {
      // Staggered reveal for the main grid items
      gsap.fromTo(".detail-fade-up", 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out"
        }
      )
      
      // Timeline items animation
      gsap.fromTo(".timeline-item",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "back.out(1.7)",
          delay: 0.3
        }
      )
    }
  }, { scope: containerRef, dependencies: [isLoading, pedido] })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-blue" />
        <p className="text-sm font-medium">Cargando detalles...</p>
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="text-sm font-medium">{error || "Pedido no encontrado"}</p>
      </div>
    )
  }

  const getStatusBadgeVariant = (estado?: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'secondary'
      case 'EN_PROCESO': return 'warning'
      case 'LISTO_PARA_RETIRAR': return 'default'
      case 'ENTREGADO': return 'success'
      case 'CANCELADO': return 'destructive'
      default: return 'outline'
    }
  }



  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full mx-auto overflow-hidden p-1">
      
      {/* Header Section */}
      <div className="detail-fade-up flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">#{pedido.codigoSeguimiento}</h1>
            <Badge variant={getStatusBadgeVariant(pedido.estado) as any} className="uppercase tracking-wider">
              {pedido.estado?.replace(/_/g, ' ') || 'Desconocido'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Registrado el {format(new Date(pedido.createdAt), "PPP 'a las' p", { locale: es })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!hideActions && onGenerateFactura && !pedido.facturado && pedido.estado !== "CANCELADO" && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onGenerateFactura(pedido.id)}
              className="rounded-full shadow-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              AFIP
            </Button>
          )}
          
          {!hideActions && pedido.estado !== "CANCELADO" && (tickets.length === 0 ? (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleGenerateAndPrint}
              className="rounded-full shadow-sm bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white border-transparent"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Imprimir Ticket
            </Button>
          ) : (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="rounded-full shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir {tickets.length} Tickets
            </Button>
          ))}

          {!hideActions && onCobrar && !pedido.cobrado && pedido.estado !== "CANCELADO" && (
            <Button 
              onClick={() => onCobrar(pedido)}
              className="bg-brand-green hover:bg-green-600 shadow-[0_4px_15px_rgba(34,197,94,0.3)] text-white rounded-full transition-all hover:scale-105 px-6"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Cobrar
            </Button>
          )}
        </div>
      </div>

      <Separator className="detail-fade-up mb-2" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Client & Timeline */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Client Card */}
          <Card className="detail-fade-up border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-blue to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {pedido.cliente?.nombre?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-tight">{pedido.cliente?.nombre || 'Consumidor Final'}</p>
                  {pedido.cliente?.telefono && (
                    <p className="text-sm text-gray-500 font-medium mt-1">{pedido.cliente.telefono}</p>
                  )}
                </div>
              </div>

              {pedido.notas && (
                <div className="mt-6 pt-6 border-t border-gray-100 relative z-10">
                  <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Notas del Pedido</h4>
                  <p className="text-sm text-gray-700 bg-white border border-gray-100 p-4 rounded-xl italic shadow-sm">&quot;{pedido.notas}&quot;</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aditional Order Info (Dates, Cancellation) */}
          <Card className="detail-fade-up border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Datos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Recepción</span>
                <span className="font-bold text-gray-900">
                  {pedido.fechaRecepcion ? format(new Date(pedido.fechaRecepcion), "dd/MM/yyyy HH:mm") : format(new Date(pedido.createdAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Entrega Estimada</span>
                <span className="font-bold text-gray-900">
                  {pedido.fechaEntregaEstimada ? format(new Date(pedido.fechaEntregaEstimada), "dd/MM/yyyy") : 'No especificada'}
                </span>
              </div>
              
              {pedido.estado === "CANCELADO" && (
                <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="text-xs uppercase tracking-widest text-red-800 font-bold mb-2 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Motivo de Cancelación
                  </h4>
                  <p className="text-sm font-bold text-red-900">{pedido.motivoCancelacion || 'Cancelado'}</p>
                  {pedido.descripcionCancelacion && (
                    <p className="text-xs text-red-700 mt-1.5 italic bg-red-100/50 p-2 rounded-lg">
                      &quot;{pedido.descripcionCancelacion}&quot;
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="detail-fade-up border-none shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Historial de Estados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 space-y-6">
                {/* Vertical line */}
                <div className="absolute left-6 top-2 bottom-2 w-px bg-gray-100"></div>

                {pedido.historial?.map((hist, i) => (
                  <div key={hist.id} className="timeline-item relative flex gap-4 z-10">
                    <div className="flex flex-col items-center mt-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? 'bg-brand-blue shadow-[0_0_10px_rgba(0,0,0,0.1)] ring-4 ring-white' : 'bg-gray-100 border-2 border-white'}`}>
                        {i === 0 ? <Check className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{hist.estadoNuevo?.replace(/_/g, ' ') || 'Desconocido'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {format(new Date(hist.createdAt), "dd MMM, HH:mm", { locale: es })}
                        {hist.usuario && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{hist.usuario.nombre}</span>
                          </>
                        )}
                      </div>
                      {hist.comentario && (
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {hist.comentario}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Right Column: Digital Ticket & Payment */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <Card className="detail-fade-up border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden bg-[#FDFDFD]">
            {/* Minimalist receipt styling */}
            <div className="absolute -top-3 left-8 right-8 h-6 flex justify-between px-2 overflow-hidden pointer-events-none opacity-20">
               {Array.from({length: 15}).map((_, i) => (
                 <div key={i} className="w-4 h-6 rounded-full bg-white border border-gray-300"></div>
               ))}
            </div>

            <CardHeader className="border-b border-dashed border-gray-300 pb-6 pt-8 mb-6 mx-6 px-0">
              <div className="flex justify-between items-end">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-gray-900 mb-1">Ticket de Servicios</CardTitle>
                  <CardDescription className="text-sm font-medium">{pedido.items?.length || 0} ítems</CardDescription>
                </div>
                
                <div className="text-right">
                  {pedido.cobrado ? (
                    <Badge variant="success" className="px-3 py-1 gap-1.5 uppercase font-bold text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="px-3 py-1 gap-1.5 uppercase font-bold text-[10px]">
                      <Circle className="w-3.5 h-3.5" /> No Pagado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 space-y-4 mb-2 min-h-[150px]">
              {pedido.items?.map((item, i) => (
                <div key={i} className="group flex justify-between items-center p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 font-bold text-sm">
                      {item.cantidad}x
                    </Badge>
                    <div>
                      <p className="font-bold text-gray-900">{item.producto?.nombre || 'Item'}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{formatCurrency(item.precioUnitario)} c/u</p>
                    </div>
                  </div>
                  <div className="font-black text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="mx-6 mb-6">
              <Separator className="border-dashed mb-6" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Total</span>
                <span className="text-4xl font-black tracking-tighter text-gray-900">
                  {formatCurrency(pedido.total)}
                </span>
              </div>
              
              {pedido.pago && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-500">Método de pago</span>
                  <span className="font-bold text-gray-900 uppercase">{pedido.pago.metodoPago?.nombre || 'Otro'}</span>
                </div>
              )}
            </div>
            
          </Card>

          {/* Ticket History Card */}
          {tickets.length > 0 && (
            <Card className="detail-fade-up border-none shadow-sm mt-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Historial de Tickets ({tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tickets.map((ticket, index) => (
                    <div 
                      key={ticket.id} 
                      className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-brand-blue/30 hover:shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
                      onClick={() => {
                        // Open thermal ticket view or re-print this specific ticket
                        toast.info(`Ticket ${ticket.codigo} seleccionado. (Re-impresión individual en desarrollo)`)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">#{ticket.codigo}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Bulto {index + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">
                          {format(new Date(ticket.createdAt), "dd MMM HH:mm", { locale: es })}
                        </p>
                        <Printer className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-blue transition-colors ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50">
        <TicketPrintTemplate 
          pedido={pedido} 
          tickets={tickets}
          // Default tracking URL assuming Next.js handles it at /tracking/negocioId/codigo
          // We can just use origin/tracking or window.location.origin + /tracking
          trackingBaseUrl={typeof window !== 'undefined' ? `${window.location.origin}/tracking/1` : '/tracking/1'} 
        />
      </div>
    </div>
  )
}
