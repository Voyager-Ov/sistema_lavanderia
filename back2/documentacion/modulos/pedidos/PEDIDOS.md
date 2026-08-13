# Especificación del Módulo de Pedidos y Trazabilidad de Estados (Pedidos)

Este documento detalla la especificación técnica completa del **Módulo de Pedidos y Trazabilidad de Estados (`pedidos`)** para la plataforma SaaS Multi-Tenant de lavandería, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Pedidos es el núcleo operativo de la lavandería SaaS. Es el responsable de la recepción de órdenes en mostrador, el congelamiento inmutable de precios por ítem (Patrón Memento), el control de la Máquina de Estados operativa (Patrón State: `Pendiente`, `Lavando`, `Listo`, `Entregado`, `Cancelado`), la notificación automática al cliente al finalizar el lavado (Patrón Observer) y la emisión del ticket térmico físico.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

A continuación se especifica la matriz detallada de trazabilidad entre la interfaz de usuario, los actores del sistema y los servicios de backend:

### CU-24: Registrar Pedido
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Pantalla de Creación de Pedido:** `/admin/pedidos/nuevo` y `/pos/pedidos/nuevo`.
    *   **Componentes UI:** `PedidoForm.tsx`, `ClienteSearchSelect.tsx` (Buscador predictivo de cliente), `ServiciosCatalogGrid.tsx` (Grid de selección de ítems por categoría con cálculo dinámico de subtotales) y `TicketPreviewModal.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Captura de `clienteId`, selección de servicios, `origen` ("Local" / "Delivery"), `direccionEntrega`, `costoEnvio` y `observaciones`.
    *   *Backend (Endpoint `POST /api/v1/pedidos`):* Execución en `pedido.service.js` dentro de una transacción manejada en Sequelize.
    *   *Patrón Memento (Snapshot):* Por cada ítem seleccionado, la entidad `DetallePedido` captura y almacena el valor de `precio` del catálogo en el atributo `precioHistorico` de manera inmutable.
    *   *Validación:* Asigna el estado inicial `Pendiente`, genera el `codigoSeguimiento` (ej. `PED-00105`) y emite el evento WebSocket `caja_actualizada`.

---

### CU-25: Iniciar Lavado de Pedido
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Tablero Kanban y Tabla de Pedidos:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `pedidos-table.tsx`, `pedido-detail-view.tsx` (desplegado dentro de `ResponsiveSheet`), y tarjetas del Tablero Kanban.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Acción de arrastrar la tarjeta en el Kanban a la columna "Lavando" o presionar el botón "Iniciar Lavado" en la ficha del pedido (`pedido-detail-view.tsx`).
    *   *Backend (Endpoint `PATCH /api/v1/pedidos/:id/estado`):* Invoca `cambiarEstadoPedido()` en `pedido.service.js`.
    *   *Patrón State (Máquina de Estados):* Valida la transición permitida desde `Pendiente` ➔ `Lavando`. Registra el evento en `CambioEstadoPedido` (con `usuarioId` y timestamp).

---

### CU-26: Finalizar Lavado de Pedido (Aviso de Retiro)
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Tablero Kanban y Ficha de Pedido:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `pedidos-table.tsx` y `pedido-detail-view.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Botón "Finalizar Lavado / Marcar Listo" en la tarjeta del pedido.
    *   *Backend (Endpoint `PATCH /api/v1/pedidos/:id/estado`):* Transiciona el estado de `Lavando` ➔ `Listo`.
    *   *Patrón Observer (Notificaciones):* Al confirmarse el estado `Listo`, se dispara automáticamente el `ServicioNotificacion` que genera y envía un aviso por SMS/Email o alerta de WhatsApp al cliente informando que su pedido está preparado para retiro o despacho.

---

### CU-27: Entregar Pedido
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Ficha de Pedido y Modal de Cobro:** `/admin/pedidos` o `/pos/pedidos`.
    *   **Componentes UI:** `pedido-detail-view.tsx` (`ResponsiveSheet`) y `cobrar-pedido-sheet.tsx` (`ResponsiveSheet`).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Botón "Entregar Pedido" en mostrador.
    *   *Backend (Endpoint `PATCH /api/v1/pedidos/:id/estado` o `POST /api/v1/pedidos/:id/cobrar`):* Transiciona de `Listo` ➔ `Entregado`.
    *   *Regla de Negocio Contable:* Si el pedido no estaba previamente cobrado, abre la interfaz de cobro (`cobrar-pedido-sheet.tsx`) para abonar mediante Efectivo, Tarjeta, QR o Saldo a Favor FIFO. De no saldarse en el acto, el pedido pasa a integrar la **Deuda Exigible** del cliente en su Cuenta Corriente (Módulo 3).

---

### CU-28: Cancelar Pedido
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Modal de Cancelación:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `cancel-order-sheet.tsx` / `cancel-pedido-sheet.tsx` (desplegado dentro de `ResponsiveSheet`) y `bulk-cancellation-wizard.tsx` (Wizard de anulación en lote exclusivo de Admin).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Selección del pedido y apertura del sheet de cancelación con selector de `motivoId` / texto descriptivo del motivo.
    *   *Backend (Endpoint `PATCH /api/v1/pedidos/:id/cancelar`):* `cancelarPedido()` en `pedido.service.js`. Transiciona el estado a `Cancelado`. Si el pedido poseía pagos previos completados, genera automáticamente un crédito a favor del cliente (`tipoOrigen = "CANCELACION_PEDIDO"`) mediante `CreditoService.generarCreditoCancelacion()`.

---

### CU-29: Consultar y Filtrar Pedidos
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Listado Principal y Reportes:** `/admin/pedidos`, `/pos/pedidos` y `/admin/reportes/pedidos`.
    *   **Componentes UI:** `pedidos-header.tsx`, `pedidos-kpis.tsx`, `pedidos-table.tsx` y `pedidos-report-table.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Filtros multicriterio por estado (`Pendiente`, `Lavando`, `Listo`, `Entregado`, `Cancelado`), rango de fechas de recepción (`fechaInicio`, `fechaFin`), buscador predictivo por código de seguimiento o nombre de cliente, y paginación.
    *   *Backend (Endpoint `GET /api/v1/pedidos`):* `obtenerPedidos()` en `pedido.service.js` con filtros de Sequelize y paginación sanitizada (`getPagingData`).

---

### CU-30: Imprimir Ticket de Pedido
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Vista de Detalle y Cola de Impresión:** `/admin/pedidos` y `/pos/pedidos`.
    *   **Componentes UI:** `print-queue-manager.tsx` y `ticket-print-template.tsx`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Botón "Imprimir Ticket" que abre el template térmico de 80mm/58mm con código QR de seguimiento, desglose de ítems, cliente y datos fiscales de la lavandería.
    *   *Backend (Endpoint `PATCH /api/v1/pedidos/:id/ticket-impreso`):* Actualiza el flag `ticketImpreso = true` para auditoría de emisión.

---

## 3. Modelos de Base de Datos Vinculados

El módulo interactúa con las entidades operativas en el esquema del tenant (`tenant_{id}`).

### A. Modelo `Pedido`
*   `numeroPedido` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador único de la orden.
*   `fechaHoraCreacion` (DataTypes.DATE, defaultValue: DataTypes.NOW): Fecha/hora de recepción.
*   `fechaHoraEntregaEstimada` (DataTypes.DATE, allowNull: true): Fecha/hora prometida de retiro.
*   `observaciones` (DataTypes.TEXT, allowNull: true): Instrucciones especiales de lavado.
*   `origen` (DataTypes.STRING, allowNull: false): Canal de recepción ("Local", "Delivery").
*   `direccionEntrega` (DataTypes.STRING, allowNull: true): Dirección de despacho para delivery.
*   `costoEnvio` (DataTypes.DOUBLE, defaultValue: 0): Cargo por servicio de envío.
*   `ticketImpreso` (DataTypes.BOOLEAN, defaultValue: false): Flag de impresión del comprobante físico.
*   `clienteId` (DataTypes.INTEGER, allowNull: false): FK hacia `Cliente`.
*   `negocioId` (DataTypes.INTEGER, allowNull: false): Llave tenant.

---

### B. Modelo `DetallePedido` (Snapshot Memento)
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador del renglón del pedido.
*   `cantidad` (DataTypes.INTEGER, allowNull: false): Kilos o unidades solicitadas.
*   `precioHistorico` (DataTypes.DOUBLE, allowNull: false): Congelamiento del precio unitario al momento del pedido.
*   `subtotal` (DataTypes.DOUBLE, allowNull: false): Importe total del renglón (`cantidad * precioHistorico`).
*   `servicioId` (DataTypes.INTEGER, allowNull: false): FK hacia `Servicio`.
*   `pedidoNumeroPedido` (DataTypes.INTEGER, allowNull: false): FK hacia `Pedido`.

---

### C. Modelo `CambioEstadoPedido`
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Registro de auditoría de trazabilidad.
*   `fechaHora` (DataTypes.DATE, defaultValue: DataTypes.NOW): Timestamp de la transición.
*   `motivo` (DataTypes.STRING, allowNull: true): Detalle de la transición.
*   `estadoId` (DataTypes.INTEGER, allowNull: false): FK hacia `Estado`.
*   `pedidoNumeroPedido` (DataTypes.INTEGER, allowNull: false): FK hacia `Pedido`.
*   `usuarioId` (DataTypes.INTEGER, allowNull: false): Usuario que ejecutó la transición.

---

## 4. Contratos de API (JSON Payloads)

### 1. Registrar Nuevo Pedido (`POST /api/v1/pedidos`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Request Body:**
    ```json
    {
      "clienteId": 12,
      "observaciones": "Lavar con jabón neutro, secado a baja temperatura",
      "origen": "Local",
      "costoEnvio": 0,
      "detalles": [
        {
          "servicioId": 2,
          "cantidad": 4,
          "precioUnitario": 1200.00
        }
      ]
    }
    ```
*   **Responses:**
    *   `201 Created` ➔ Pedido registrado con éxito.
        ```json
        {
          "status": "success",
          "message": "Pedido registrado exitosamente",
          "data": {
            "numeroPedido": 108,
            "codigoSeguimiento": "PED-00108",
            "clienteId": 12,
            "total": 4800.00,
            "estado": "Pendiente",
            "createdAt": "2026-08-13T17:40:00.000Z"
          }
        }
        ```
    *   `400 Bad Request` ➔ Faltan ítems o el cliente no existe.

---

### 2. Cambiar Estado del Pedido (`PATCH /api/v1/pedidos/:id/estado`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Request Body:**
    ```json
    {
      "nuevoEstado": "Listo",
      "motivo": "Proceso de planchado y embolsado finalizado"
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Transición confirmada y notificación Observer ejecutada.
    *   `400 Bad Request` ➔ Transición de estado rechazada por la máquina de estados.

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Transición Controlada y Notificación Observer (`cambiarEstadoPedido`)

```javascript
export const cambiarEstadoPedido = async (negocioId, usuarioId, pedidoId, nuevoEstadoNombre, motivo) => {
    const transaction = await sequelize.transaction();
    try {
        const pedido = await models.Pedido.findOne({
            where: { numeroPedido: pedidoId, negocioId },
            include: [{ model: models.Estado, as: "estadoActual" }],
            transaction
        });

        if (!pedido) throw new AppError("Pedido no encontrado", 404);

        // Matriz de transiciones válidas según el Patrón State
        const transicionesValidas = {
            "Pendiente": ["Lavando", "Cancelado"],
            "Lavando": ["Listo", "Cancelado"],
            "Listo": ["Entregado", "Cancelado"],
            "Entregado": [],
            "Cancelado": []
        };

        const estadoActualNombre = pedido.estadoActual.nombre;
        if (!transicionesValidas[estadoActualNombre].includes(nuevoEstadoNombre)) {
            throw new AppError(`Transición no válida de ${estadoActualNombre} a ${nuevoEstadoNombre}`, 400);
        }

        const nuevoEstado = await models.Estado.findOne({ where: { nombre: nuevoEstadoNombre } });

        // Actualizar el estado del pedido
        await pedido.update({ estadoId: nuevoEstado.id }, { transaction });

        // Historial de trazabilidad
        await models.CambioEstadoPedido.create({
            pedidoNumeroPedido: pedido.numeroPedido,
            estadoId: nuevoEstado.id,
            usuarioId,
            motivo: motivo || `Cambio a ${nuevoEstadoNombre}`
        }, { transaction });

        await transaction.commit();

        // Patrón Observer: Al estar "Listo", disparar notificación automática al cliente
        if (nuevoEstadoNombre === "Listo") {
            notificarClientePedidoListo(pedido.clienteId, pedido.numeroPedido);
        }

        // Evento en tiempo real para tableros Kanban activos
        emitToTenant(negocioId, "pedido_actualizado", { pedidoId: pedido.numeroPedido, estado: nuevoEstadoNombre });

        return pedido;
    } catch (error) {
        if (transaction.finished !== 'commit') await transaction.rollback();
        throw error;
    }
};
```

---

## 6. Middlewares y Filtros de Seguridad Involucrados

### `verificarToken` y `verificarRol` (`src/middlewares/role.middleware.js`)
*   Garantizan la autenticación JWT y restringen la ejecución de cambios de estado y cancelaciones únicamente a usuarios autenticados con los roles `admin` o `empleado`.
