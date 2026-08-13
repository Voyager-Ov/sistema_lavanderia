# Especificación del Módulo de Pedidos y Trazabilidad (`pedidos`)

Este documento especifica la arquitectura, modelos, lógica de negocio, endpoints y funcionamiento de cada subpantalla del **Módulo de Pedidos (`pedidos`)** en el backend `back2`.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Pedidos es el núcleo operativo de la lavandería. Gobierna la recepción de artículos, la selección de servicios, la generación de comprobantes/tickets, la trazabilidad de estados en tiempo real (mostrador y taller), el seguimiento online por QR y la liquidación de saldos.

### Pantallas y Subpantallas en el Frontend:
1. **Nuevo Pedido / Punto de Venta (`/admin/pedidos/nuevo` & `/pos/terminal`):**
   * Búsqueda o creación rápida de cliente.
   * Selección de servicios en grilla interactiva por categoría.
   * Carrito de compras con cantidades, precios históricos y costo de envío.
   * Fecha de entrega estimada y observaciones especiales de lavado.
   * Emisión del pedido e impresión de ticket térmico.

2. **Listado de Pedidos (`/admin/pedidos`):**
   * Tabla paginada con filtros por número de pedido, cliente, rango de fechas y estado actual.
   * Ordenamiento dinámico de columnas (número, cliente, total, fecha, estado).
   * Indicadores de estado de pago (PAGADO, PARCIAL, NO_PAGADO) y avance operativo.

3. **Detalle y Trazabilidad (`/admin/pedidos/[id]`):**
   * Ficha completa del pedido, cliente e ítems contratados.
   * Timeline de trazabilidad histórica de cambios de estado (`PENDIENTE` ➔ `EN_PROCESO` ➔ `LISTO_PARA_RETIRAR` ➔ `ENTREGADO` / `CANCELADO`).
   * Botones de acción directa para cambiar estado, reimprimir ticket o facturar.

---

## 2. Modelos de Base de Datos Vinculados

El módulo opera dentro del esquema del inquilino activo (`tenant_{id}`):

* **`Pedido` (`src/models/Pedido.js`):**
  * `numeroPedido` (PK, INTEGER, autoIncrement): Identificador único del pedido.
  * `fechaHoraCreacion` (DATE): Fecha de emisión.
  * `fechaHoraEntregaEstimada` (DATE): Fecha comprometida de retiro.
  * `observaciones` (TEXT): Notas especiales de lavado o prendas sensibles.
  * `origen` (STRING): "MOSTRADOR", "DELIVERY", "ONLINE".
  * `direccionEntrega` (STRING): Dirección si requiere envío a domicilio.
  * `costoEnvio` (DECIMAL): Recargo por flete.
  * `ticketImpreso` (BOOLEAN): Estado de impresión del ticket.
  * `clienteId` (FK ➔ `Cliente.id`).
  * `negocioId` (FK ➔ `Negocio.id`).

* **`DetallePedido` (`src/models/DetallePedido.js`):**
  * `id` (PK, INTEGER).
  * `cantidad` (INTEGER).
  * `precioHistorico` (DECIMAL): Precio cobrado al momento de la venta.
  * `pedidoNumeroPedido` (FK ➔ `Pedido.numeroPedido`).
  * `servicioId` (FK ➔ `Servicio.id`).

* **`CambioEstadoPedido` (`src/models/CambioEstadoPedido.js`):**
  * `id` (PK, INTEGER).
  * `fechaHoraInicio` (DATE): Inicio del estado.
  * `fechaHoraFin` (DATE): Fin del estado al pasar al siguiente.
  * `pedidoNumeroPedido` (FK ➔ `Pedido.numeroPedido`).
  * `estadoId` (FK ➔ `Estado.id`).

---

## 3. Contratos de API (Endpoints)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/pedidos` | Listado paginado de pedidos con búsqueda por cliente/número y filtros. |
| `GET` | `/api/pedidos/stats` | Métricas generales (pendientes, en proceso, listos, entregados). |
| `GET` | `/api/pedidos/:id` | Detalle completo de un pedido con cliente e ítems. |
| `POST` | `/api/pedidos` | Creación de pedido con ítems y asignación de estado inicial PENDIENTE. |
| `PATCH` | `/api/pedidos/:id/estado` | Cambio de estado con registro en la trazabilidad. |
| `POST` | `/api/pedidos/:id/ticket` | Marca el ticket como impreso. |

---

## 4. Lógica de Negocio y Flujo de Estados

1. **Recepción:** Al ingresar un pedido en `/admin/pedidos/nuevo`, el sistema calcula el total de los servicios seleccionados y registra automáticamente el primer registro en `CambioEstadoPedido` con `Estado.nombre = "PENDIENTE"`.
2. **Lavado / Taller:** El personal cambia el estado a `EN_PROCESO` desde la tabla o el detalle. El backend cierra la fecha del estado anterior (`fechaHoraFin = now()`) y crea el nuevo tramo.
3. **Control de Calidad:** Al finalizar, pasa a `LISTO_PARA_RETIRAR` o `LISTO`. Si WhatsApp está activo, se notifica al cliente.
4. **Entrega:** El cliente retira la prenda y el estado pasa a `ENTREGADO`.
