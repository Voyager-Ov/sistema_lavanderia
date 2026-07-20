"use client"

import { useState, useEffect, useRef } from "react"
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle, ResponsiveSheetDescription } from "@/shared/ui/overlays/responsive-sheet"
import { toast } from "sonner"
import { registrarGasto } from "@/domains/caja/caja.api"
import { obtenerMetodosPago, MetodoPago } from "@/domains/pagos/api"
import { obtenerCategoriasGastos, crearCategoriaGasto, eliminarCategoriaGasto, CategoriaGasto } from "@/domains/caja/categorias-gastos.api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/forms/select"
import { Input } from "@/shared/ui/forms/input"
import { Label } from "@/shared/ui/forms/label"
import { Button } from "@/shared/ui/forms/button"
import { Textarea } from "@/shared/ui/forms/textarea"
import { DollarSign, Banknote, CreditCard, Wallet, Smartphone, Landmark, QrCode, Building, Gem, Settings2, Plus, Trash2, ChevronLeft } from "lucide-react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Spinner } from "@/shared/ui/feedback/spinner"

interface RegistrarGastoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ICON_MAP: Record<string, any> = {
  Banknote, CreditCard, Wallet, Smartphone, Landmark, QrCode, Building, Gem, DollarSign
}

export function RegistrarGastoModal({ open, onOpenChange, onSuccess }: RegistrarGastoModalProps) {
  // Estados del Gasto
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [metodoPagoId, setMetodoPagoId] = useState<string>("")
  
  // Estados de datos
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(false)
  const [isCargandoCategorias, setIsCargandoCategorias] = useState(false)
  const [view, setView] = useState<'form' | 'manage'>('form')
  
  // Estados de Administrar Categorías
  const [nuevaCategoria, setNuevaCategoria] = useState("")
  const [isAgregandoCat, setIsAgregandoCat] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const manageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setView('form')
      obtenerMetodosPago()
        .then(data => {
            const activos = data.filter(m => m.activo);
            setMetodosPago(activos);
            if (activos.length > 0) {
              const efectivo = activos.find(m => m.nombre.toLowerCase().includes('efectivo'));
              setMetodoPagoId(efectivo ? efectivo.id.toString() : activos[0].id.toString());
            }
        })
        .catch(err => console.error("Error al obtener métodos de pago", err));

      cargarCategorias()
    } else {
      setMonto("")
      setDescripcion("")
      setCategoria("")
    }
  }, [open])

  const cargarCategorias = async () => {
    try {
      setIsCargandoCategorias(true)
      const data = await obtenerCategoriasGastos()
      setCategorias(data)
      if (data.length > 0 && !categoria) {
        setCategoria(data[0].nombre)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCargandoCategorias(false)
    }
  }

  // GSAP View Transitions
  useGSAP(() => {
    if (!open) return

    if (view === 'manage') {
      gsap.to(formRef.current, { x: -30, opacity: 0, duration: 0.2, ease: "power2.inOut", onComplete: () => {
        if (formRef.current) formRef.current.style.display = 'none'
        if (manageRef.current) {
          manageRef.current.style.display = 'block'
          gsap.fromTo(manageRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" })
        }
      }})
    } else {
      gsap.to(manageRef.current, { x: 30, opacity: 0, duration: 0.2, ease: "power2.inOut", onComplete: () => {
        if (manageRef.current) manageRef.current.style.display = 'none'
        if (formRef.current) {
          formRef.current.style.display = 'block'
          gsap.fromTo(formRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" })
        }
      }})
    }
  }, [view, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monto || isNaN(Number(monto))) {
      toast.error("Ingrese un monto válido")
      return
    }
    if (!categoria) {
      toast.error("Seleccione una categoría")
      return
    }
    if (!metodoPagoId) {
      toast.error("Seleccione un método de pago")
      return
    }

    try {
      setIsLoading(true)
      await registrarGasto({
        monto: Number(monto),
        categoria,
        descripcion,
        metodoPagoId: Number(metodoPagoId)
      })
      toast.success("Gasto registrado")
      setMonto("")
      setDescripcion("")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el gasto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaCategoria.trim()) return
    try {
      setIsAgregandoCat(true)
      const nueva = await crearCategoriaGasto(nuevaCategoria.trim())
      setCategorias(prev => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNuevaCategoria("")
      toast.success("Categoría creada")
      // Seleccionar automáticamente si estaba vacío
      if (!categoria) setCategoria(nueva.nombre)
    } catch (e: any) {
      toast.error(e.message || "Error al crear categoría")
    } finally {
      setIsAgregandoCat(false)
    }
  }

  const handleEliminarCategoria = async (id: number) => {
    try {
      await eliminarCategoriaGasto(id)
      setCategorias(prev => prev.filter(c => c.id !== id))
      // Si la borrada estaba seleccionada, limpiar
      const catBorrada = categorias.find(c => c.id === id)
      if (catBorrada?.nombre === categoria) {
        setCategoria("")
      }
      toast.success("Categoría eliminada")
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar categoría")
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent className="overflow-hidden flex flex-col">
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>
            {view === 'form' ? "Registrar Salida / Gasto" : "Administrar Categorías"}
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            {view === 'form' 
              ? "Registra un egreso de dinero indicando la categoría y de dónde salió el dinero."
              : "Gestiona las categorías personalizadas de gastos de tu negocio."}
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="relative flex-1 mt-6 overflow-hidden">
          {/* VISTA 1: FORMULARIO PRINCIPAL */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 absolute inset-0 overflow-y-auto pb-6 px-1">
            <div className="space-y-2">
              <Label>Monto</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="pl-10 font-medium h-12 text-lg"
                  placeholder="0.00"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Categoría</Label>
              <div className="flex gap-2">
                <Select value={categoria} onValueChange={setCategoria} disabled={isCargandoCategorias}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue placeholder={isCargandoCategorias ? "Cargando..." : "Seleccione una categoría"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
                      <SelectItem key={c.id.toString()} value={c.nombre}>{c.nombre}</SelectItem>
                    ))}
                    {categorias.length === 0 && !isCargandoCategorias && (
                      <div className="p-3 text-sm text-muted-foreground text-center">No hay categorías configuradas</div>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 px-4 shrink-0 border-dashed"
                  onClick={() => setView('manage')}
                >
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Medio de Pago</Label>
              <div className="grid grid-cols-2 gap-3">
                {metodosPago.map((metodo) => {
                  const isSelected = metodoPagoId === metodo.id.toString()
                  const Icon = metodo.icono ? (ICON_MAP[metodo.icono] || Banknote) : Banknote;

                  return (
                    <div 
                      key={metodo.id}
                      onClick={() => setMetodoPagoId(metodo.id.toString())}
                      className={`
                        cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-brand-blue bg-brand-blue/5 shadow-md shadow-brand-blue/10 scale-[1.02]' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }
                      `}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-brand-blue' : 'text-slate-500'}`} />
                      <span className={`text-sm font-semibold text-center ${isSelected ? 'text-brand-blue' : 'text-slate-700'}`}>
                        {metodo.nombre}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="resize-none h-24"
                placeholder="Detalle opcional del gasto (ej. Compra de jabón líquido)..."
              />
            </div>

            <div className="pt-4 flex flex-col gap-3 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isLoading || !monto || !metodoPagoId || !categoria}
                className="h-12 text-base font-bold w-full"
              >
                {isLoading ? "Registrando..." : "Registrar Gasto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 font-semibold w-full"
              >
                Cancelar
              </Button>
            </div>
          </form>

          {/* VISTA 2: ADMINISTRAR CATEGORÍAS */}
          <div ref={manageRef} className="absolute inset-0 hidden overflow-y-auto pb-6 px-1 flex flex-col h-full">
            <div className="flex-1 space-y-4">
              <form onSubmit={handleCrearCategoria} className="flex gap-2 items-end bg-muted/30 p-3 rounded-xl border border-border">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Nueva Categoría</Label>
                  <Input 
                    placeholder="Ej: Insumos" 
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    className="h-10 bg-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!nuevaCategoria.trim() || isAgregandoCat}
                  className="h-10 px-4"
                >
                  {isAgregandoCat ? <Spinner size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
                  Agregar
                </Button>
              </form>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Tus Categorías</Label>
                {isCargandoCategorias ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="default" className="text-muted-foreground" />
                  </div>
                ) : categorias.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl border-dashed">
                    Aún no hay categorías registradas.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {categorias.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-slate-300 transition-colors">
                        <span className="font-medium text-sm">{cat.nombre}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if(confirm("¿Seguro que deseas eliminar esta categoría? No afectará a los gastos ya registrados.")) {
                              handleEliminarCategoria(cat.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView('form')}
                className="w-full h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver al Registro
              </Button>
            </div>
          </div>

        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  )
}
