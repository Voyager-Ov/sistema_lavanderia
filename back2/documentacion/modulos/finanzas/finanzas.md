# Módulo de Finanzas (Portal Admin)

Este documento especifica los endpoints y la lógica de negocio del módulo de Finanzas del portal de Administración.

---

## 1. Endpoints

### A. Obteción de KPIs Financieros
- **Ruta:** `GET /api/finanzas/kpis`
- **Autenticación:** Requerida (Bearer Token JWT)
- **Query Params:**
  - `fechaDesde` *(opcional)*: Fecha inicial en formato ISO/YYYY-MM-DD.
  - `fechaHasta` *(opcional)*: Fecha final en formato ISO/YYYY-MM-DD.
- **Respuesta (200 OK):**
```json
{
  "data": {
    "totalIngresos": 15400.0,
    "totalEgresos": 3200.0,
    "balanceNeto": 12200.0,
    "totalNoCobrado": 4500.0
  }
}
```
- **Lógica de cálculo:**
  - `totalIngresos`: Suma de `montoAbonado` de todos los `Cobros` dentro del rango de fechas.
  - `totalEgresos`: Suma de `montoTotal` de todos los `Gastos` con `estadoGasto = "Pagado"` dentro del rango de fechas.
  - `balanceNeto`: `totalIngresos - totalEgresos`.
  - `totalNoCobrado`: Suma del `total` de todos los `Pedidos` con `cobrado = false` descartando aquellos con `estado = "CANCELADO"`.

---

### B. Listado Unificado de Movimientos Financieros
- **Ruta:** `GET /api/finanzas/movimientos`
- **Autenticación:** Requerida (Bearer Token JWT)
- **Query Params:**
  - `fechaDesde` *(opcional)*: Fecha inicial.
  - `fechaHasta` *(opcional)*: Fecha final.
  - `page` *(opcional, default: 1)*: Número de página.
  - `limit` *(opcional, default: 10)*: Cantidad de registros por página.
  - `search` *(opcional)*: Término de búsqueda por descripción.
- **Respuesta (200 OK):**
```json
{
  "data": [
    {
      "id": "cobro-12",
      "originalId": 12,
      "tipoMovimiento": "INGRESO",
      "monto": 1500.0,
      "fecha": "2026-08-14T15:30:00.000Z",
      "descripcion": "Cobro de Pedido #102",
      "referenciaId": 102,
      "metodoPago": "Efectivo",
      "registradoPor": "Juan Pérez",
      "estado": "COMPLETADO"
    },
    {
      "id": "gasto-4",
      "originalId": 4,
      "tipoMovimiento": "EGRESO",
      "monto": 800.0,
      "fecha": "2026-08-14T12:00:00.000Z",
      "descripcion": "Insumos de limpieza",
      "referenciaId": 2,
      "metodoPago": "Transferencia Bancaria",
      "registradoPor": "Maria Gomez",
      "estado": "Pagado"
    }
  ],
  "pagination": {
    "totalRecords": 2,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10
  }
}
```
- **Trazabilidad de `registradoPor`:**
  - Prioridad 1: Empleado asociado directamente al `Cobro` o `Gasto` (`empleadoId`).
  - Prioridad 2: Empleado asociado a la `Caja` que originó el `MovimientoCaja` vinculado (`movimientoCaja -> caja -> empleado`).
  - Fallback: `"Sistema"`.
