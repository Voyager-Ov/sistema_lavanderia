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
    - Mapea el campo `registradoPor` buscando primero la relación directa con `Empleado` agregada a los modelos. Si no existe, recurre a buscar a través de `MovimientoCaja -> Caja -> Empleado` para asegurar trazabilidad.

### Modificaciones en Rutas
- **`src/modules/finanzas/finanzas.routes.js`**: 
  - Se agregaron las rutas `GET /kpis` y `GET /movimientos` protegidas con el middleware `verificarToken`.
