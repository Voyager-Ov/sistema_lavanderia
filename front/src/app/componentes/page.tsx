"use client"

import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { PasswordInput } from "@/shared/ui/forms/password-input"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { KpiCard } from "@/shared/ui/data-display/kpi-card"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { StatusDropdown } from "@/shared/ui/data-display/status-dropdown"
import { PageHeader } from "@/shared/ui/composite/page-header"
import { EmptyState } from "@/shared/ui/composite/empty-state"
import { FormSheet } from "@/shared/ui/composite/form-sheet"
import { AppLayout } from "@/shared/ui/layout/app-layout"
import { GlobalSearch } from "@/shared/ui/overlays/global-search"
import { Breadcrumbs } from "@/shared/ui/navigation/breadcrumbs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/data-display/card"
import { Badge } from "@/shared/ui/data-display/badge"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/shared/ui/overlays/alert-dialog"
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/feedback/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/navigation/tabs"
import { Switch } from "@/shared/ui/forms/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/ui/forms/select"
import { Textarea } from "@/shared/ui/forms/textarea"
import { toast } from "sonner"
import { AreaChartAnimated } from "@/shared/ui/charts/area-chart-animated"
import { BarChartAnimated } from "@/shared/ui/charts/bar-chart-animated"
import { PieChartAnimated } from "@/shared/ui/charts/pie-chart-animated"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/data-display/chart"
import { Bar, BarChart, XAxis } from "recharts"
import React, { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/overlays/dropdown-menu"
import { MoreHorizontal, Download, Plus, CheckCircle, Trash, FolderSearch, User, AlertCircle } from "lucide-react"

// Mock Data for the Table
type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const initialData: Payment[] = [
  { id: "m5gr84i9", amount: 316, status: "pending", email: "ken99@yahoo.com" },
  { id: "3u1reuv4", amount: 242, status: "success", email: "Abe45@gmail.com" },
  { id: "derv1ws0", amount: 837, status: "processing", email: "Monserrat44@gmail.com" },
  { id: "5kma53ae", amount: 874, status: "pending", email: "Silas22@gmail.com" },
  { id: "bhqecj4p", amount: 721, status: "failed", email: "carmella@hotmail.com" },
]

const areaChartData = [
  { name: 'Lun', ingresos: 4000 },
  { name: 'Mar', ingresos: 3000 },
  { name: 'Mie', ingresos: 5500 },
  { name: 'Jue', ingresos: 4500 },
  { name: 'Vie', ingresos: 8000 },
  { name: 'Sab', ingresos: 7200 },
  { name: 'Dom', ingresos: 9500 },
]

const barChartData = [
  { name: 'Lavado Básico', ventas: 120 },
  { name: 'Planchado', ventas: 98 },
  { name: 'Tintorería', ventas: 65 },
  { name: 'Edredones', ventas: 45 },
]

const pieChartData = [
  { name: 'Entregados', value: 400 },
  { name: 'En Proceso', value: 300 },
  { name: 'Pendientes', value: 300 },
  { name: 'Cancelados', value: 100 },
]

export default function UIPlayground() {
  const [payments, setPayments] = useState<Payment[]>(initialData)
  const [loadingRowIds, setLoadingRowIds] = useState<string[]>([])
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

  // Simulador de cambio de estado asíncrono
  const handleStatusChange = async (id: string, newStatus: string) => {
    // 1. Poner en estado de carga
    setLoadingRowIds(prev => [...prev, id])
    setRowErrors(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    // 2. Simular latencia del servidor (1.5 segundos)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 3. Regla de Negocio: No se puede pasar de "Pendiente" a "Completado" directamente
    const payment = payments.find(p => p.id === id)
    if (payment?.status === "pending" && newStatus === "success") {
      setRowErrors(prev => ({ 
        ...prev, 
        [id]: "Regla de Negocio: Un pago pendiente debe pasar por 'Procesando' antes de ser completado." 
      }))
      setLoadingRowIds(prev => prev.filter(rowId => rowId !== id))
      return
    }

    // 4. Si todo sale bien, actualizar en BD (aquí en estado local)
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p))
    setLoadingRowIds(prev => prev.filter(rowId => rowId !== id))
  }

  // Columnas dinámicas que usan las funciones de arriba
  const tableColumns: ColumnDef<Payment>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { 
      accessorKey: "email", 
      header: "Email",
      cell: ({ row }) => (
        <div className="w-[180px] max-w-[180px] sm:w-[250px] sm:max-w-[250px] truncate font-medium">
          {row.original.email}
        </div>
      )
    },
    { accessorKey: "amount", header: "Monto", cell: ({ row }) => `$${row.original.amount}` },
    { 
      accessorKey: "status", 
      header: "Estado",
      cell: ({ row }) => (
        <StatusDropdown
          currentStatus={row.original.status}
          options={[
            { value: "pending", label: "Pendiente", colorClass: "bg-yellow-100 text-yellow-800" },
            { value: "processing", label: "Procesando", colorClass: "bg-blue-100 text-blue-800" },
            { value: "success", label: "Completado", colorClass: "bg-green-100 text-green-800" },
            { value: "failed", label: "Fallido", colorClass: "bg-red-100 text-red-800" }
          ]}
          onChange={(val) => handleStatusChange(row.original.id, val)}
          disabled={loadingRowIds.includes(row.original.id)}
          className="min-w-[110px] justify-center"
        />
      )
    },
    {
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-2">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Ver Detalles</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-brand-red focus:text-brand-red">Anular Pago</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <AppLayout 
      title="UI Playground" 
      breadcrumbs={[{ label: "Home" }, { label: "Playground" }]}
    >
      <div className="space-y-16 pb-32">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Sistema Lavandería UI</h1>
            <p className="text-muted-foreground max-w-xl text-lg mb-4">
              Un catálogo interactivo de los componentes base desarrollados para la aplicación.
            </p>
          </div>
        </div>

        {/* 7. Nuevos Componentes Estructurales */}
        <section className="space-y-6 bg-muted/30 p-8 rounded-3xl border border-dashed">
          <div className="border-b pb-4 mb-8">
            <h2 className="text-2xl font-semibold">Nuevos Componentes Estructurales (Smart Grid)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Prueba cambiar un pago de <strong>Pendiente a Completado</strong> para ver la validación de errores.
            </p>
          </div>

          <PageHeader 
            title="Gestión de Pagos" 
            description="Controla todos los pagos y facturas del sistema en un solo lugar."
          >
            <Button variant="outline" className="hidden sm:flex">Exportar</Button>
            <FormSheet 
              title="Nuevo Pago Manual" 
              description="Ingresa los datos del pago recibido en efectivo o transferencia."
              trigger={<Button><Plus className="h-4 w-4 mr-2" /> Nuevo Pago</Button>}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto</label>
                  <Input placeholder="$0.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Input placeholder="Buscar cliente..." />
                </div>
                <Button className="w-full mt-4">Guardar Pago</Button>
              </div>
            </FormSheet>
          </PageHeader>
          
          <DataTable 
            columns={tableColumns} 
            data={payments} 
            searchPlaceholder="Buscar por email, monto o estado..."
            
            // Asynchronous props!
            loadingRowIds={loadingRowIds}
            rowErrors={rowErrors}
            onClearRowError={(id) => setRowErrors(prev => { const next = {...prev}; delete next[id]; return next; })}
            
            // Server-side Pagination props!
            manualPagination={true}
            pageCount={3} // Mockeado desde el backend: ej. hay 3 páginas en total
            pagination={pagination}
            onPaginationChange={setPagination}
            
            bulkActions={[
              {
                label: "Marcar Completado",
                icon: CheckCircle,
                onClick: (filas) => {
                  filas.forEach(f => handleStatusChange(f.id, "success"))
                }
              },
              {
                label: "Eliminar",
                icon: Trash,
                variant: "destructive",
                onClick: (filas) => alert(`Eliminando ${filas.length} pagos`)
              }
            ]}
            renderMobileCard={(pago) => (
              <div className="flex flex-col gap-3 p-5 border rounded-2xl bg-card shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-lg">${pago.amount}</div>
                  <StatusDropdown
                    currentStatus={pago.status}
                    options={[
                      { value: "pending", label: "Pendiente", colorClass: "bg-yellow-100 text-yellow-800" },
                      { value: "processing", label: "Procesando", colorClass: "bg-blue-100 text-blue-800" },
                      { value: "success", label: "Completado", colorClass: "bg-green-100 text-green-800" },
                      { value: "failed", label: "Fallido", colorClass: "bg-red-100 text-red-800" }
                    ]}
                    onChange={(val) => handleStatusChange(pago.id, val)}
                    disabled={loadingRowIds.includes(pago.id)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">{pago.email}</div>
                <Button variant="outline" size="sm" className="w-full mt-2" disabled={loadingRowIds.includes(pago.id)}>Ver Detalles</Button>
              </div>
            )}
          />

          <div className="mt-12">
            <h3 className="font-semibold mb-4">Ejemplo de Estado Vacío (EmptyState)</h3>
            <EmptyState 
              icon={FolderSearch}
              title="No se encontraron facturas"
              description="Aún no tienes facturas registradas en este periodo. Cuando cobres servicios aparecerán aquí."
              action={<Button variant="outline">Ver historial del mes pasado</Button>}
            />
          </div>
        </section>

        {/* Dashboard Charts (Nuevos) */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">Gráficos Animados (Dashboard)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Componentes para visualización de datos usando Recharts + GSAP.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KpiCard 
              title="Ingresos" 
              value="$452,300" 
              description="+15% este mes"
              backMessage="Total de ingresos generados en lo que va del mes actual."
              colorVariant="blue"
            />
            <KpiCard 
              title="Pedidos Nuevos" 
              value="124" 
              description="+5 vs ayer"
              backMessage="Pedidos ingresados el día de hoy por los diferentes canales."
              colorVariant="green"
            />
            <KpiCard 
              title="Clientes" 
              value="48" 
              description="-2 vs ayer"
              backMessage="Usuarios que se registraron por primera vez."
              colorVariant="orange"
            />
            <KpiCard 
              title="Alertas" 
              value="3" 
              description="Requieren atención"
              backMessage="Sucesos importantes como pagos fallidos o demoras críticas."
              colorVariant="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AreaChartAnimated 
                data={areaChartData} 
                dataKeyX="name" 
                dataKeyY="ingresos" 
                title="Evolución de Ingresos" 
                subtitle="Últimos 7 días"
                delay={0.5}
              />
            </div>
            <div>
              <PieChartAnimated 
                data={pieChartData} 
                dataKey="value" 
                nameKey="name" 
                title="Estado de Pedidos" 
                subtitle="Distribución actual"
                delay={0.6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <BarChartAnimated 
              data={barChartData} 
              dataKeyX="name" 
              dataKeyY="ventas" 
              title="Servicios más vendidos"
              subtitle="Top 4 servicios"
              delay={0.7}
            />
          </div>
        </section>

        {/* 1. Botones */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">1. Botones Genéricos (Forma Pill)</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-4 flex flex-col items-start">
              <Button variant="default">Importar Clientes</Button>
              <Button variant="outlineBlue">Outline Azul</Button>
            </div>
            <div className="space-y-4 flex flex-col items-start">
              <Button variant="success">Nuevo Cliente</Button>
              <Button variant="outlineGreen">Outline Verde</Button>
            </div>
            <div className="space-y-4 flex flex-col items-start">
              <Button variant="warning">Refrescar</Button>
              <Button variant="outline">Filtros (Neutro)</Button>
            </div>
            <div className="space-y-4 flex flex-col items-start">
              <Button variant="destructive">Eliminar Fila</Button>
              <Button variant="ghost">Modo Ghost</Button>
            </div>
          </div>
        </section>

        {/* 8. Componentes Migrados (Apple Style) */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">8. Componentes Premium (Estilo Apple)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Tarjetas Glass de Colores */}
            <div className="flex flex-col gap-6">
              <Card variant="glassRed">
                <CardHeader>
                  <CardTitle>Glass Rojo</CardTitle>
                  <CardDescription>Para alertas o estados críticos.</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="glassBlue">
                <CardHeader>
                  <CardTitle>Glass Azul</CardTitle>
                  <CardDescription>Para información o elementos neutros.</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="glassYellow">
                <CardHeader>
                  <CardTitle>Glass Amarillo</CardTitle>
                  <CardDescription>Para advertencias o tareas pendientes.</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="glassGreen">
                <CardHeader>
                  <CardTitle>Glass Verde</CardTitle>
                  <CardDescription>Para éxitos o estados completados.</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Formularios: Select, Switch, Textarea */}
            <Card>
              <CardHeader>
                <CardTitle>Inputs Avanzados</CardTitle>
                <CardDescription>Selects y Switches súper fluidos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Notificaciones Push</span>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sucursal</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caba">Capital Federal</SelectItem>
                      <SelectItem value="gba">Gran Buenos Aires</SelectItem>
                      <SelectItem value="interior">Interior del País</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comentarios adicionales</label>
                  <Textarea placeholder="Escribe aquí..." />
                </div>
              </CardContent>
            </Card>

            {/* Overlays: Alert Dialog & Sonner Toasts */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback & Diálogos</CardTitle>
                <CardDescription>Interacciones críticas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="warning">
                  <AlertTitle>Atención</AlertTitle>
                  <AlertDescription>Tienes pagos pendientes por revisar.</AlertDescription>
                </Alert>
                <div className="flex gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Abrir Alerta Modal</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente los datos del cliente.
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600">Sí, eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button variant="outline" onClick={() => toast("¡Acción completada con éxito!", { description: "Los cambios han sido guardados." })}>
                    Disparar Toast
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Barras (Estilo Bento + Colores de Marca) */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Diarias</CardTitle>
                <CardDescription>Gráfico con barras superpuestas redondeadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ 
                  rojo: { label: "Crítico", color: "#ef4444" },
                  azul: { label: "Info", color: "#3b82f6" },
                  amarillo: { label: "Alerta", color: "#eab308" },
                  verde: { label: "Éxito", color: "#22c55e" }
                }} className="h-[250px] w-full mt-4">
                  <BarChart data={[
                    { name: 'Lun', rojo: 40, azul: 80, amarillo: 20, verde: 60 },
                    { name: 'Mar', rojo: 30, azul: 90, amarillo: 40, verde: 70 },
                    { name: 'Mié', rojo: 20, azul: 60, amarillo: 50, verde: 90 },
                    { name: 'Jue', rojo: 50, azul: 70, amarillo: 30, verde: 80 },
                    { name: 'Vie', rojo: 60, azul: 50, amarillo: 60, verde: 100 },
                  ]} margin={{top:0, left:0, right:0, bottom:0}} barGap={8}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <ChartTooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="rojo" fill="var(--color-rojo)" radius={[20, 20, 20, 20]} background={{ fill: 'rgba(0,0,0,0.04)', radius: 20 }} barSize={12} />
                    <Bar dataKey="azul" fill="var(--color-azul)" radius={[20, 20, 20, 20]} background={{ fill: 'rgba(0,0,0,0.04)', radius: 20 }} barSize={12} />
                    <Bar dataKey="amarillo" fill="var(--color-amarillo)" radius={[20, 20, 20, 20]} background={{ fill: 'rgba(0,0,0,0.04)', radius: 20 }} barSize={12} />
                    <Bar dataKey="verde" fill="var(--color-verde)" radius={[20, 20, 20, 20]} background={{ fill: 'rgba(0,0,0,0.04)', radius: 20 }} barSize={12} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

          </div>
        </section>

      </div>
    </AppLayout>
  )
}
