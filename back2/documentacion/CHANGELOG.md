# Changelog - Backend (back2)

Todas las modificaciones notables realizadas al backend se documentarán en este archivo.

## [Fecha: 2026-08-17] - Unificación de Cobro por Pedido Individual y Trazabilidad Contable Dual
### Modificaciones en Módulo de Finanzas y Pagos
- **`src/modules/finanzas/services/pagos.service.js`**:
  - **Cobro Unificado de 1 Pedido**: Se simplificó la transacción de cobro a 1 solo pedido por operación (`POST /api/pagos`), eliminando inconsistencias y asignaciones falsas de vuelto a favor generadas en cobros en lote masivos.
  - **Fórmula de Vuelto en Efectivo Corregida**: Se calcula exactamente como `cashRecibidoReal - remanenteTotalEfectivo`, asegurando que no se asigne vuelto a favor incorrecto.
  - **Trazabilidad Contable Dual Estricta**:
    - **`MovimientoCaja`**: Registra fondos únicamente cuando ingresa dinero en efectivo físico (`dineroIngresadoFisico > 0`). Si el pago se cubre 100% con saldo a favor o bonificación, no genera registro en caja para evitar sobrantes irreales en el arqueo diario.
    - **`MovimientoCuenta` (Débito)**: Se crea automáticamente al aplicar saldo a favor del cliente (`aplicarSaldoAFavor: true`).
    - **`MovimientoCuenta` (Crédito)**: Se crea automáticamente al acreditar el vuelto en efectivo como crédito (`dejarVueltoAFavor: true`).
  - **Validación de Caja Chica Abierta**: Verifica que exista un turno activo en estado `"Abierta"` antes de procesar cualquier cobro.

### Modificaciones en Módulo de Clientes
- **`src/modules/clientes/services/clientes.service.js`**:
  - `obtenerClientePorId` incluye los registros de `MovimientoCuenta` dentro de la `CuentaCorriente` del cliente, posibilitando la auditoría completa del historial de débitos y créditos desde la ficha del cliente.

### Modificaciones en Frontend (`front`)
- **`cobrar-pedido-sheet.tsx`**: Consolidado como el modal lateral responsivo único para registrar cobros de 1 pedido, con banner de advertencia si la caja chica está cerrada.
- **`pedidos/page.tsx` & `pedidos-modals.tsx`**: Removida la acción *"Cobrar Masivamente"* del Bottom Island y eliminada la modal `BulkChargeModal`.
- **`clientes/[id]/page.tsx`**: Removidas las casillas de selección múltiple y el botón *"Cobrar Deuda"*. Cada pedido impago posee su propio botón individual *"Cobrar"*.

### Pruebas de Integración y Resiliencia
- **`scripts/stress_test_cobros.js`**: Reescrito para ejecutar pruebas en vivo contra el servidor Express (`app.js`) sobre HTTP (`fetch`) con autenticación JWT, logrando un **100% de éxito en 12 suites de prueba**.

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

## [Fecha: 2026-08-14] - Alineación de Regla Única de Deuda de Clientes y Cuenta Corriente
### Modificaciones en Módulo de Clientes
- **`src/modules/clientes/services/clientes.service.js`**:
  - Se implementó la regla de negocio contable **única**: `saldoDeuda` surge exclusivamente de los pedidos que están **`ENTREGADOS`** (o `COMPLETADO`) y **no han sido cobrados** (`cobrado === false`).
  - Los pedidos impagos que aún permanecen en proceso en taller (`PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`) no radican deuda para el cliente hasta su entrega formal. Se contabilizan de forma separada como `montoEnTaller`.
  - Se actualizó `obtenerPedidosImpagosCliente` para marcar `esDeuda: true/false` en cada pedido devuelto.
