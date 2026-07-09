# Módulo: Dashboard (Métricas)

## Descripción General
Este módulo provee métricas clave del negocio para alimentar la vista principal del sistema (Dashboard) y el resumen al momento de cerrar una caja.

## Roles Permitidos
- Solo los usuarios autenticados con suscripción activa pueden ver métricas.
- (Usualmente consumido por Admins/Dueños para ver el pantallazo general, o por cajeros al ver el resumen de su caja).

## Endpoints (Requerimientos Funcionales)

### 1. Obtener Métricas Globales del Negocio
- **Ruta y Método**: `GET /api/dashboard/stats`
- **Acción**: Retorna un resumen de ingresos y operatividad general del mes.
- **Reglas de Negocio (Cálculos Internos)**:
  - **Ingresos Mensuales**: Compara los ingresos del mes actual vs mes anterior, sumando únicamente los pagos en estado `COMPLETADO` que pertenezcan a pedidos de ese negocio.
  - **Estado de Pedidos**: Devuelve el conteo total de los pedidos activos del negocio agrupados por su estado actual (`PENDIENTE`, `EN_PROCESO`, `LISTO`, `ENTREGADO`, `CANCELADO`).
  - **Top Productos**: Calcula los 5 productos o servicios más vendidos (por cantidad sumada) del mes actual, excluyendo los pedidos que estén `CANCELADO`.

```json
{
  "success": true,
  "data": {
    "ingresos": {
      "mesActual": 50000,
      "mesAnterior": 45000,
      "hoyCobrado": 1500,
      "ayerCobrado": 1200,
      "hoyTotalPedidos": 2500
    },
    "pedidosDelDia": {
      "hoy": 15,
      "ayer": 12
    },
    "pedidosActivos": {
      "PENDIENTE": 5,
      "EN_PROCESO": 3,
      "LISTO": 2,
      "ENTREGADO": 0,
      "PAGADO": 0,
      "CANCELADO": 0
    },
    "topProductos": [
      {
        "id": 1,
        "nombre": "Lavado de Ropa Blanca",
        "vendidos": 120
      }
    ],
    "topClientes": [
      {
        "id": 1,
        "nombre": "María López",
        "pedidos": 15
      }
    ],
    "ventasPorDia": [
      { "name": "Lun", "ventas": 5000 },
      { "name": "Mar", "ventas": 4500 }
    ]
  }
}
```

### 2. Obtener Resumen de Cierre de Caja
- **Ruta y Método**: `GET /api/dashboard/caja/:cajaId`
- **Acción**: Retorna el consolidado final de una caja específica (ideal para mostrar antes o después del cierre).
- **Reglas de Negocio (Cálculos Internos)**:
  - Busca todos los pagos `COMPLETADOS` asociados a esa caja.
  - Devuelve el `totalRecaudado`.
  - Devuelve un desglose detallado de los montos separados por **método de pago** (Ej. "Efectivo: $1000", "Transferencia: $500").
  - Retorna la cantidad total de tickets/pagos registrados.
