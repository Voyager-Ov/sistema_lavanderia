# Módulo: Pagos

## Descripción General
Este módulo se encarga del registro, facturación y anulación de los pagos asociados a los pedidos, y de la configuración de métodos de pago. 

## Roles Permitidos
- Todos los roles tienen acceso, siempre que posean un token válido y la suscripción del negocio esté activa.

## Endpoints (Requerimientos Funcionales)

### 1. Registrar Pago
- **Ruta y Método**: `POST /api/pagos`
- **Acción**: Registra el ingreso de dinero. Actualiza el pedido marcándolo como `cobrado: true`. Genera evento de WebSocket para actualizar métricas en tiempo real.
- **Validaciones**:
  - `pedidoId`: Obligatorio, entero.
  - `metodoPagoId`: Obligatorio, entero.
  - `monto`: Obligatorio, flotante mayor o igual a 0.
- **Reglas de Negocio**:
  - **Caja Obligatoria**: El usuario que registra el pago **debe tener una caja abierta** (`ABIERTA`) en el negocio. Si no tiene caja, el sistema rechaza el pago.
  - **Cobro Único**: Un pedido no puede cobrarse dos veces (rechaza si ya existe un pago en estado `COMPLETADO` para ese pedido).
  - **Facturación AFIP (Automática/Manual)**: Si el negocio tiene habilitada y configurada la facturación de AFIP, y está en modo `AUTOMATICO` (o es `MANUAL` y se envía `facturarAfip: true`), el sistema contacta con AFIP y adjunta el `cae`, `nroComprobante` y `tipoComprobante` al registro del pago.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "pedidoId": 12,
    "metodoPagoId": 1,
    "monto": 1500.50,
    "facturarAfip": true
  }
  ```

### 2. Anular Pago
- **Ruta y Método**: `PATCH /api/pagos/:id/anular`
- **Acción**: Revierte un pago y cancela el pedido asociado.
- **Validaciones**: El pago y pedido deben existir y pertenecer al negocio.
- **Reglas de Negocio**:
  - **Caja Obligatoria**: Para anular, el usuario también debe tener una caja abierta (para reflejar el ajuste, aunque por ahora la anulación descuenta indirectamente).
  - Cambia el estado del Pago a `ANULADO`.
  - Cambia el estado del Pedido asociado a `CANCELADO`.
  - Emite eventos WebSocket (`pago_anulado` y `pedido_actualizado`).

### 3. Facturar Pago Retroactivo
- **Ruta y Método**: `POST /api/pagos/:id/facturar`
- **Acción**: Genera la factura electrónica de AFIP para un pago que fue completado previamente pero que no había sido facturado.
- **Validaciones**: 
  - El pago debe existir, pertenecer al negocio y estar en estado `COMPLETADO`.
- **Reglas de Negocio**:
  - El pago no debe tener un `cae` ya generado.
  - El negocio debe tener configurada y activa la integración con AFIP.
  - Genera el comprobante usando la fecha actual y actualiza el pago con los datos de AFIP.

### 4. Obtener Métodos de Pago
- **Ruta y Método**: `GET /api/pagos/metodos`
- **Acción**: Lista los métodos de pago habilitados para el negocio (`esHabilitado: true`).

### 5. Crear Método de Pago
- **Ruta y Método**: `POST /api/pagos/metodos`
- **Acción**: Agrega un nuevo método de pago disponible para el negocio.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "nombre": "Transferencia Bancaria",
    "tipo": "TRANSFERENCIA",
    "esHabilitado": true
  }
  ```
