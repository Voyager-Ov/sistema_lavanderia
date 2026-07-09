# Módulo: Pedidos

## Descripción General
Este módulo gestiona el flujo principal del negocio: la creación, consulta y actualización de los pedidos de lavandería. 

## Roles Permitidos
- **Todos los roles (Superadmin, Admin, Empleado)** tienen acceso a estos endpoints, siempre que posean un token válido y la suscripción del negocio esté activa. (Algunas acciones específicas de cambio de estado tienen reglas de validación adicionales por rol).

## Endpoints (Requerimientos Funcionales)

### 1. Crear Pedido
- **Ruta y Método**: `POST /api/pedidos`
- **Acción**: Registra un nuevo pedido en estado `PENDIENTE`. Calcula el total basándose en el `precioActual` de los productos, guarda el precio unitario histórico para evitar inconsistencias si el precio cambia después, genera un código de seguimiento único, y crea un registro inicial en el historial. También emite un evento WebSocket (`pedido_actualizado`) al negocio.
- **Validaciones**:
  - `clienteId`: Obligatorio, número entero. Debe existir un cliente con ese ID en el negocio actual.
  - `items`: Obligatorio, arreglo (min 1). Cada ítem debe tener `productoId` (entero) y `cantidad` (entero, min 1).
  - Los productos deben existir y pertenecer al negocio.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "clienteId": 1,
    "items": [
      { "productoId": 5, "cantidad": 2 },
      { "productoId": 3, "cantidad": 1 }
    ]
  }
  ```

### 2. Listar Pedidos
- **Ruta y Método**: `GET /api/pedidos`
- **Acción**: Retorna los pedidos paginados. Soporta múltiples filtros.
- **Validaciones**: Soporta los query parameters de paginación estándar (`limit`, `page`).
- **Filtros Soportados (Query Params)**:
  - `estado`: Filtra por estado (ej: PENDIENTE, ENTREGADO).
  - `clienteId`: Trae pedidos de un cliente específico.
  - `fechaInicio` y `fechaFin`: Rango de fechas de creación.
  - `search`: Búsqueda por nombre del cliente.

### 3. Obtener Pedido por ID
- **Ruta y Método**: `GET /api/pedidos/:id`
- **Acción**: Devuelve los detalles completos de un pedido específico que pertenezca al negocio, incluyendo relaciones con el cliente, los ítems y productos, el historial de estados ordenado del más reciente al más antiguo, y los pagos asociados.

### 4. Cambiar Estado del Pedido
- **Ruta y Método**: `PATCH /api/pedidos/:id/estado`
- **Acción**: Modifica el estado del pedido, registra el cambio en el `HistorialPedido` con un comentario, emite evento WebSocket y evalúa integraciones externas (ej. WhatsApp).
- **Validaciones**:
  - `estado`: Obligatorio, debe ser uno de: `PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`, `ENTREGADO`, `CANCELADO`.
  - `comentario`: Opcional, string.
- **Reglas de Negocio**:
  - Un **EMPLEADO** no tiene permisos para cancelar un pedido si el estado anterior ya era `ENTREGADO`.
  - No se permite cambiar el estado si el estado solicitado es el mismo que el actual.
  - **Hook WhatsApp**: Si el nuevo estado es `LISTO_PARA_RETIRAR` y el negocio tiene configurada la integración con WhatsApp activa, se envía automáticamente un mensaje al cliente avisándole que puede pasar a buscar su ropa.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "estado": "LISTO_PARA_RETIRAR",
    "comentario": "Terminado antes de tiempo"
  }
  ```
