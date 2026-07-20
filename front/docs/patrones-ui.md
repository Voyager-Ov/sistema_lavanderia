# Patrones de UI y Reglas de Diseño

Este documento establece las reglas de arquitectura de interfaz (UI) para asegurar consistencia visual y de comportamiento en todo el panel de administración.

## 1. Estructura de Páginas de Entidades (Listar y Crear)

Para entidades principales (ej: `Pedidos`, `Servicios`, `Clientes`, `Caja`):
- **Listado (Data Table)**: Las pantallas principales deben utilizar el componente reutilizable `<DataTable>` (`@/shared/ui/data-display/data-table.tsx`). Este componente ya maneja paginación, filtros y acciones masivas.
- **Formularios de Creación**: 
  - Si el formulario es **complejo o principal** (ej. Crear Pedido, Crear Cliente), debe tener su propia ruta o pantalla dedicada completa (`/admin/pedidos/crear`). El formulario debe extraerse en un componente separado (`PedidoForm`) que reciba callbacks (`onSuccess`, `onError`) por props para mantener la vista limpia.
  - Si el formulario es **rápido o secundario** (ej. Registrar Gasto, Cerrar Caja, Agregar Categoría), debe presentarse en un `<ResponsiveSheet>`.

## 2. Formularios en Paneles Laterales (Responsive Sheets)

**Regla de Oro**: _"Sheet lateral para desktop, Bottom sheet para mobile"._

No se deben crear `<Sheet>` o `<Drawer>` sueltos ni escribir lógica manual con `window.innerWidth`. 
Para cualquier formulario rápido lateral, se **debe** usar el componente unificado:

```tsx
import { ResponsiveSheet, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetTitle } from "@/shared/ui/overlays/responsive-sheet"

<ResponsiveSheet open={open} onOpenChange={onOpenChange}>
  <ResponsiveSheetContent>
    <ResponsiveSheetHeader>
      <ResponsiveSheetTitle>Título del Formulario</ResponsiveSheetTitle>
    </ResponsiveSheetHeader>
    {/* Formulario */}
  </ResponsiveSheetContent>
</ResponsiveSheet>
```
Este componente se encarga automáticamente de ser un cajón lateral en pantallas grandes y un cajón inferior en móviles.

## 3. Alertas y Feedback Visual

Queda estrictamente **prohibido** utilizar HTML crudo (`<div>`, `<span>`) con clases de Tailwind (ej. `bg-red-100 text-red-500`) para mostrar mensajes de éxito, error o advertencia en la pantalla.
Se **debe** utilizar el componente `<Alert>` del Design System:

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/feedback/alert"
import { AlertCircle } from "lucide-react"

<Alert variant="destructive"> {/* variantes: default, destructive, warning, success */}
  <AlertCircle className="w-5 h-5" />
  <AlertTitle>Error de validación</AlertTitle>
  <AlertDescription>El monto ingresado es incorrecto.</AlertDescription>
</Alert>
```

Para notificaciones flotantes (toasts), se debe utilizar `toast` de `sonner` importado de `@/shared/ui/feedback/sonner`.

## 4. Chips, Estados y Etiquetas (Badges)

Al igual que las alertas, los estados visuales (ej: "Activa", "Cerrada", "Pagado", métodos de pago) **no** deben usar `<span>` manuales.
Se **debe** utilizar el componente `<Badge>`:

```tsx
import { Badge } from "@/shared/ui/data-display/badge"

<Badge variant="success">Completado</Badge>
{/* variantes: default, secondary, destructive, success, warning, outline */}
```

## 5. Buscadores

Para búsquedas globales en la aplicación, se utiliza el componente `<GlobalSearch>` (`@/shared/ui/overlays/global-search.tsx`), que invoca una paleta de comandos (`<Command>`). Las tablas (`<DataTable>`) ya incluyen su propio buscador local que debe ser configurado a través de sus props, sin necesidad de reinventar barras de búsqueda encima de las tablas.

## 6. Arquitectura de Componentes

- `@/shared/ui/...`: Componentes tontos (dumb components), puramente visuales (botones, inputs, modales, alertas). **No** deben hacer fetch a la API ni conocer de lógica de negocio.
- `@/domains/...`: Lógica de negocio, servicios, hooks de datos, definiciones de TypeScript (ej. `CajaActual`, `Pedido`).
- `@/app/admin/entidad/components/...`: Componentes específicos de una vista (ej. `CajaDashboard`, `AbrirCajaForm`). Pueden tener estado y consumir la API del dominio. 
