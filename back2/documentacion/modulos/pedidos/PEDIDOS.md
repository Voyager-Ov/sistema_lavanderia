# Especificación del Módulo de Pedidos y Trazabilidad (`pedidos`)

Este documento especifica la arquitectura, modelos, lógica de negocio, endpoints y funcionamiento del **Módulo de Pedidos (`pedidos`)** en el backend `back2`.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Pedidos es el núcleo operativo de la lavandería. Gobierna la recepción de artículos, la selección de servicios, la generación de comprobantes/tickets, la trazabilidad de estados en tiempo real (mostrador y taller), el seguimiento online por QR y la liquidación de saldos.

### Distinción de Marcas de Tiempo en Pedidos:
- **`fechaHoraCreacion` (Creación en Sistema)**: Marca de tiempo inmutable indicando el instante exacto en que la orden fue registrada en la base de datos PostgreSQL.
- **`fechaHoraPedido` (Recepción Real)**: Marca de tiempo representativa del ingreso físico de las prendas al local. Permite a los administradores registrar pedidos de forma retroactiva (fechas pasadas) o programada (fechas futuras), sin perder la auditoría de cuándo fue cargado realmente en el sistema.

---

## 2. Modelos de Base de Datos Vinculados

El módulo opera dentro del esquema del inquilino activo (`tenant_{id}`):

* **`Pedido` (`src/models/Pedido.js`):**
  * `numeroPedido` (PK, INTEGER, autoIncrement): Identificador único del pedido.
  * `fechaHoraCreacion` (DATE, default: NOW): Fecha/Hora auditada de alta en sistema.
  * `fechaHoraPedido` (DATE, default: NOW): Fecha/Hora de ingreso o recepción real del pedido.
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
| `GET` | `/api/pedidos` | Listado paginado de pedidos con búsqueda por cliente/número y filtros de fecha. |
| `GET` | `/api/pedidos/stats` | Métricas generales (pendientes, en proceso, listos, entregados). |
| `GET` | `/api/pedidos/:id` | Detalle completo de un pedido con cliente e ítems. |
| `POST` | `/api/pedidos` | Creación de pedido con fecha de recepción personalizable (`fechaHoraPedido`). |
| `PATCH` | `/api/pedidos/:id/estado` | Cambio de estado con registro en la trazabilidad. |
| `POST` | `/api/pedidos/:id/ticket` | Marca el ticket como impreso. |

---

## 4. Lógica de Negocio y Flujo de Estados

1. **Recepción:** Al ingresar un pedido en `/admin/pedidos/nuevo`, el usuario puede elegir la `fechaHoraPedido` (por defecto la fecha actual, o una fecha retroactiva/futura). Se calcula el total y se asigna el estado inicial `PENDIENTE`.
2. **Lavado / Taller:** El personal cambia el estado a `EN_PROCESO`. El backend asigna `fechaHoraFin = now()` al estado anterior y crea la nueva entrada auditada.
3. **Control de Calidad:** Al finalizar pasa a `LISTO_PARA_RETIRAR`.
4. **Entrega:** El cliente retira la prenda y el estado pasa a `ENTREGADO`.
