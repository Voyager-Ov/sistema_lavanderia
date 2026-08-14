# Changelog - Backend (back2)

Todas las modificaciones notables realizadas al backend se documentarán en este archivo.

## [Fecha: 2026-08-14] - Implementación de Finanzas para el Admin
### Modificaciones en Modelos
- **`src/models/Cobro.js`**: Se agregó la asociación `belongsTo(models.Empleado, { as: 'empleado' })` para mantener la trazabilidad de qué empleado registra el cobro.
- **`src/models/Gasto.js`**: Se agregó la asociación `belongsTo(models.Empleado, { as: 'empleado' })` para mantener la trazabilidad de qué empleado registra el gasto.

### Nuevos Controladores
- **`src/modules/finanzas/controllers/finanzas.controller.js`**: 
  - Se creó el controlador para manejar los endpoints requeridos por el frontend de finanzas.
  - Se implementó `getKPIs`, el cual calcula:
    - **Total Ingresos**: Suma de `montoAbonado` en `Cobros`.
    - **Total Egresos**: Suma de `montoTotal` en `Gastos` donde el estado es `Pagado`.
    - **Balance Neto**: Ingresos - Egresos.
    - **Total No Cobrado**: Suma del `total` de `Pedidos` que no están cobrados (`cobrado = false`) y no están cancelados (`estado != 'CANCELADO'`).
  - Se implementó `getMovimientos`:
    - Combina y pagina `Cobros` (como ingresos) y `Gastos` (como egresos).
## [Fecha: 2026-08-14] - Implementación Completa de Servicios y Auditoría de Precios
### Nuevos Modelos
- **`src/models/HistorialPrecioServicio.js`**: Modelo para registrar el historial auditado de precios de cada servicio (`fechaDesde`, `fechaHasta`, `precio`, `motivo`, `servicioId`, `negocioId`).

### Modificaciones en Servicios
- **`src/modules/servicios/services/servicios.service.js`**:
  - Al crear o actualizar un servicio se genera de forma transparente una nueva entrada en `HistorialPrecioServicio`, cerrando el intervalo previo (`fechaHasta = NOW`).
  - **`cambiarDisponibilidad`**: Permite alternar la disponibilidad (`disponible`) de un servicio para ser ofrecido en el POS.
  - **`actualizarPreciosMasivo`**: Procesa actualizaciones masivas de precios de forma atómica y audita cada cambio en la tabla de historial.
  - **`actualizarDisponibilidadMasiva`**: Permite activar/desactivar múltiples servicios en lote.
  - **`obtenerHistorialPrecios`**: Devuelve la línea de tiempo de cambios de precio para ser graficado en el detalle del servicio.

### Modificaciones en Controladores y Rutas
- **`servicios.controller.js`**: Se agregaron los controladores para las acciones masivas, alternancia de disponibilidad e historial.
- **`servicios.routes.js`**:
  - `PUT /bulk/precios`
  - `PUT /bulk/disponibilidad`
  - `PATCH /:id/disponibilidad` y `PUT /:id/disponibilidad`
  - `GET /:id/historial`
